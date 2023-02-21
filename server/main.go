package main

import (
	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
	"github.com/oklog/ulid/v2"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"log"
	_ "main/migrations"
	"math/rand"
	"net/http"
	"os"
)

func main() {
	app := pocketbase.New()

	// ---------------------------------------------------------------
	// Optional plugin flags:
	// ---------------------------------------------------------------

	var migrationsDir string
	app.RootCmd.PersistentFlags().StringVar(
		&migrationsDir,
		"migrationsDir",
		"",
		"the directory with the user defined migrations",
	)

	var automigrate bool
	app.RootCmd.PersistentFlags().BoolVar(
		&automigrate,
		"automigrate",
		true,
		"enable/disable auto migrations",
	)

	var indexFallback bool
	app.RootCmd.PersistentFlags().BoolVar(
		&indexFallback,
		"indexFallback",
		true,
		"fallback the request to index.html on missing static path (eg. when pretty urls are used with SPA)",
	)

	var corsOrigins []string
	app.RootCmd.PersistentFlags().StringSliceVar(
		&corsOrigins,
		"corsOrigins",
		[]string{"https://108.cards", "https://108cards.pages.dev", "http://localhost:3000"},
		"CORS allowed domain origins list",
	)

	_ = app.RootCmd.ParseFlags(os.Args[1:])

	// ---------------------------------------------------------------
	// Custom routes:
	// ---------------------------------------------------------------

	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		e.Router.Use(middleware.CORSWithConfig(middleware.CORSConfig{
			Skipper:      middleware.DefaultSkipper,
			AllowOrigins: corsOrigins,
			AllowMethods: []string{http.MethodGet, http.MethodHead, http.MethodPut, http.MethodPatch, http.MethodPost, http.MethodDelete},
		}))

		// Attention: API safety checks intentionally removed to save on resources in enclosed system

		e.Router.POST("/user/register", func(c echo.Context) error {
			players, err := getPlayers(app)
			if err != nil {
				return err
			}

			player := models.NewRecord(players)
			player.Set("name", ulid.Make().String())
			player.Set("game", "")
			player.Set("hand", defaultJson())

			if err := savePlayer(app, player); err != nil {
				return err
			}

			return c.JSON(http.StatusOK, Registration{Name: player.GetString("name"), Token: player.Id})
		})

		e.Router.POST("/session/create", func(c echo.Context) error {
			player, err := getPlayerRecordByToken(app, c.Request().Header.Get("token"))
			if err != nil {
				return err
			}

			if len(player.GetString("game")) != 0 {
				// Check for ongoing game
				game, err := getGameRecordByCode(app, player.GetString("game"))
				if err == nil {
					// Registered for valid game
					// Retrieve ongoing game player data

					players, err := playersFromGame(game)
					if err != nil {
						return err
					}

					// Remove player from ongoing game
					index, err := playerIndexByName(player.GetString("name"), players)
					if err != nil {
						return err
					}
					playersUpdated, err := playersFromStruct(append(players[:index], players[index+1:]...))
					if err != nil {
						return err
					}

					game.Set("players", playersUpdated)
					if err := saveGame(app, game); err != nil {
						return err
					}
				}

				player.Set("game", "")
				if err := savePlayer(app, player); err != nil {
					return err
				}
			}

			games, err := getGames(app)
			if err != nil {
				return err
			}

			game := models.NewRecord(games)
			game.Set("players", defaultPlayers(player.GetString("name")))
			game.Set("globals", defaultGlobals())
			game.Set("rules", defaultRules())
			game.Set("stack", defaultJson())

			if err := saveGame(app, game); err != nil {
				return err
			}

			player.Set("game", game.Id)

			if err := savePlayer(app, player); err != nil {
				return err
			}

			return c.JSON(http.StatusOK, Session{Game: game.Id})
		})

		e.Router.POST("/session/join", func(c echo.Context) error {
			// Retrieve target user
			player, err := getPlayerRecordByToken(app, c.Request().Header.Get("token"))
			if err != nil {
				return err
			}

			// If player is already participating in different game
			if len(player.GetString("game")) != 0 && player.GetString("game") != c.Request().Header.Get("game") {
				// Remove player from game
				game, err := getGameRecordByCode(app, player.GetString("game"))
				if err != nil {
					return err
				}

				players, err := playersFromGame(game)
				if err != nil {
					return err
				}

				globals, err := globalsFromGame(game)
				if err != nil {
					return err
				}

				// Check if game will end
				if len(players) <= 2 {
					// Stop game if only one player
					players[0].Called = false

					// Restore game defaults
					game.Set("globals", defaultGlobals())
				} else {
					// Shifting turn if necessary
					if globals.Live == player.GetString("name") {
						// Evaluating next player
						next, err := nextPlayer(player.GetString("name"), players, globals)
						if err != nil {
							return err
						}

						globals.Live = players[next].Name

						// Save globals to game
						globalsUpdated, err := globalsFromStruct(globals)
						if err != nil {
							return err
						}

						game.Set("globals", globalsUpdated)
					}

					// Remove player from ongoing game
					index, err := playerIndexByName(player.GetString("name"), players)
					if err != nil {
						return err
					}
					players = append(players[:index], players[index+1:]...)
				}

				// Save players to game
				playersUpdated, err := playersFromStruct(players)
				if err != nil {
					return err
				}

				game.Set("players", playersUpdated)

				// Remove game from player
				player.Set("game", "")
				player.Set("hand", defaultJson())

				// Save changes
				if err := saveGame(app, game); err != nil {
					return err
				}

				if err := savePlayer(app, player); err != nil {
					return err
				}
			}

			// Retrieve target game to join
			game, err := getGameRecordByCode(app, c.Request().Header.Get("game"))
			if err != nil {
				return err
			}

			globals, err := globalsFromGame(game)
			if err != nil {
				return err
			}

			// Check if player isn't already participating
			if c.Request().Header.Get("game") != player.GetString("game") {
				// Check if game has already started
				if len(globals.Live) > 0 {
					return apis.NewBadRequestError("Game has already started.", err)
				}

				players, err := playersFromGame(game)
				if err != nil {
					return err
				}

				// Adding player to game
				playersUpdated, err := playersFromStruct(append(players, defaultPlayerStruct(player.GetString("name"))))
				if err != nil {
					return err
				}

				game.Set("players", playersUpdated)

				// Save changes
				err = saveGame(app, game)
				if err != nil {
					return err
				}
			}

			// Add game to player
			player.Set("game", game.Id)

			// Save changes
			if err := savePlayer(app, player); err != nil {
				return err
			}

			return c.JSON(http.StatusOK, Status{Status: "ok"})
		})

		e.Router.POST("/session/start", func(c echo.Context) error {
			// Retrieve target user
			player, err := getPlayerRecordByToken(app, c.Request().Header.Get("token"))
			if err != nil {
				return err
			}

			if err := participating(player); err != nil {
				return err
			}

			game, err := getGameRecordByCode(app, player.GetString("game"))
			if err != nil {
				return err
			}

			rules, err := rulesFromGame(game)
			if err != nil {
				return err
			}

			players, err := playersFromGame(game)
			if err != nil {
				return err
			}

			if err := hosting(player, players); err != nil {
				return err
			}

			if len(players) < 2 {
				return apis.NewBadRequestError("Not enough players to start.", err)
			}

			if !rules.Unlimited {
				give := len(players) * rules.Count
				var stack []string

				for {
					stack = append(stack, DECK...)
					if give*2 < len(stack) {
						break
					}
				}

				rand.Shuffle(len(stack), func(i, j int) { stack[i], stack[j] = stack[j], stack[i] })

				for i := 0; i < len(players); i++ {
					var hand []string

					for j := 0; j < rules.Count; j++ {
						index := rand.Intn(len(stack) - 1)
						hand = append(hand, stack[index])
						stack = append(stack[:index], stack[index+1:]...)
					}

					players[i].Cards = rules.Count

					player, err := getPlayerRecordByName(app, players[i].Name)
					if err != nil {
						return err
					}

					handUpdate, err := handFromPlayer(player)

					player.Set("hand", handUpdate)

					if err := savePlayer(app, player); err != nil {
						return err
					}
				}

				stackUpdate, err := stackFromStruct(stack)
				if err != nil {
					return err
				}

				game.Set("stack", stackUpdate)
			} else {
				for i := 0; i < len(players); i++ {
					var hand []string

					for j := 0; j < rules.Count; j++ {
						index := rand.Intn(len(DECK) - 1)
						hand = append(hand, DECK[index])
					}

					player, err := getPlayerRecordByName(app, players[i].Name)
					if err != nil {
						return err
					}

					handUpdate, err := handFromPlayer(player)
					if err != nil {
						return err
					}

					player.Set("hand", handUpdate)

					if err := savePlayer(app, player); err != nil {
						return err
					}
				}
			}

			// Write player updates
			playersUpdate, err := playersFromStruct(players)
			if err != nil {
				return err
			}

			game.Set("players", playersUpdate)

			// Updating globals
			globals := defaultGlobalsStruct()
			globals.Live = player.GetString("name")
			globalsUpdate, err := globalsFromStruct(globals)
			if err != nil {
				return err
			}

			game.Set("globals", globalsUpdate)

			// Save state
			if err := saveGame(app, game); err != nil {
				return err
			}

			return c.JSON(http.StatusOK, Status{Status: "ok"})
		})

		e.Router.POST("/session/rules", func(c echo.Context) error {
			// Retrieve target user
			player, err := getPlayerRecordByToken(app, c.Request().Header.Get("token"))
			if err != nil {
				return err
			}

			if err := participating(player); err != nil {
				return err
			}

			game, err := getGameRecordByCode(app, player.GetString("name"))
			if err != nil {
				return err
			}

			// Save new rules
			rules, err := rulesFromString(c.Request().Header.Get("rules"))

			rulesUpdate, err := rulesFromStruct(rules)
			if err != nil {
				return err
			}

			game.Set("rules", rulesUpdate)

			// Save state
			if err := saveGame(app, game); err != nil {
				return err
			}

			return c.JSON(http.StatusOK, Status{Status: "ok"})
		})

		e.Router.POST("/session/leave", func(c echo.Context) error {
			// Retrieve target user
			player, err := getPlayerRecordByToken(app, c.Request().Header.Get("token"))
			if err != nil {
				return err
			}

			// Check if player is in game
			if len(player.GetString("game")) != 0 {
				return apis.NewBadRequestError("Not participating in any game.", nil)
			}

			// Retrieve game data
			game, err := getGameRecordByCode(app, player.GetString("game"))
			if err != nil {
				return err
			}

			players, err := playersFromGame(game)
			if err != nil {
				return err
			}

			globals, err := globalsFromGame(game)
			if err != nil {
				return err
			}

			// Check if game will end
			if len(players) <= 2 {
				// Stop game if only one player
				players[0].Called = false

				// Restore game defaults
				game.Set("globals", defaultGlobals())
			} else {
				// Shifting turn if necessary
				if globals.Live == player.GetString("name") {
					// Evaluating next player
					next, err := nextPlayer(player.GetString("name"), players, globals)
					if err != nil {
						return err
					}

					globals.Live = players[next].Name

					// Save globals to game
					globalsUpdated, err := globalsFromStruct(globals)
					if err != nil {
						return err
					}

					game.Set("globals", globalsUpdated)
				}

				// Remove player from ongoing game
				index, err := playerIndexByName(player.GetString("name"), players)
				if err != nil {
					return err
				}
				players = append(players[:index], players[index+1:]...)
			}

			// Save players to game
			playersUpdated, err := playersFromStruct(players)
			if err != nil {
				return err
			}

			game.Set("players", playersUpdated)

			// Remove game from player
			player.Set("game", "")
			player.Set("hand", defaultJson())

			// Save changes
			if err := saveGame(app, game); err != nil {
				return err
			}

			if err := savePlayer(app, player); err != nil {
				return err
			}

			return c.JSON(http.StatusOK, Status{Status: "ok"})
		})

		e.Router.POST("/session/ongoing", func(c echo.Context) error {
			// Retrieve target user
			player, err := getPlayerRecordByToken(app, c.Request().Header.Get("token"))
			if err != nil {
				return err
			}

			if len(player.GetString("game")) == 0 {
				return c.JSON(http.StatusOK, Session{Game: ""})
			}

			game, err := getGameRecordByCode(app, player.GetString("game"))
			if err != nil {
				return err
			}

			return c.JSON(http.StatusOK, Session{Game: game.Id})
		})

		e.Router.POST("/game/draw", func(c echo.Context) error {
			// Retrieve target user
			player, err := getPlayerRecordByToken(app, c.Request().Header.Get("token"))
			if err != nil {
				return err
			}

			game, err := getGameRecordByCode(app, player.GetString("game"))
			if err != nil {
				return err
			}

			hand, err := handFromPlayer(player)
			if err != nil {
				return err
			}

			players, err := playersFromGame(game)
			if err != nil {
				return err
			}

			rules, err := rulesFromGame(game)
			if err != nil {
				return err
			}

			stack, err := stackFromGame(game)
			if err != nil {
				return err
			}

			globals, err := globalsFromGame(game)
			if err != nil {
				return err
			}

			// Retrieving player status
			current, err := playerIndexByName(player.GetString("name"), players)
			if err != nil {
				return err
			}

			// Checking if player has turn
			if err := playing(player, globals); err != nil {
				return err
			}

			// Checking if player can still draw
			if !globals.Drawable {
				return apis.NewBadRequestError("You can't draw anymore cards.", nil)
			}

			var drawn []string

			if stack[len(stack)-1][0] == 'p' && globals.Drawable {
				// Drawing 2 * n cards
				for i := 1; i > 0; i++ {
					for j := 0; j < 2; j++ {
						if rules.Ordered {
							drawn = append(drawn, resetCard(stack[len(stack)-1]))
							stack = stack[:len(stack)-2]
						} else {
							index := rand.Intn(len(stack)-3) + 1
							drawn = append(drawn, resetCard(stack[index]))
							stack = append(stack[:index], stack[index+1:]...)
						}
						if len(stack) <= 1 {
							break
						}
					}

					if stack[len(stack)-i][0] == 'p' || len(stack) > 1 {
						break
					}
				}
			} else if stack[len(stack)-1][0] == 'j' && globals.Drawable {
				// Drawing 4 * n cards
				for i := 1; i > 0; i++ {
					for j := 0; j < 4; j++ {
						if rules.Ordered {
							drawn = append(drawn, resetCard(stack[len(stack)-1]))
							stack = stack[:len(stack)-2]
						} else {
							index := rand.Intn(len(stack)-3) + 1
							drawn = append(drawn, resetCard(stack[index]))
							stack = append(stack[:index], stack[index+1:]...)
						}
						if len(stack) <= 1 {
							break
						}
					}

					if stack[len(stack)-i][0] == 'j' || len(stack) > 1 {
						break
					}
				}
			} else if rules.Unlimited {
				// Drawing 1 card and then continue to draw until playable
				if rules.Ordered {
					for {
						drawn = append(drawn, resetCard(stack[len(stack)-1]))
						stack = stack[:len(stack)-2]
						if len(stack) > 1 && drawn[len(drawn)-1][1] != stack[0][1] {
							break
						}
					}
				} else {
					for {
						index := rand.Intn(len(stack) - 2)
						drawn = append(drawn, resetCard(stack[index]))
						stack = append(stack[:index], stack[index+1:]...)
						if len(stack) <= 1 && drawn[len(drawn)-1][1] != stack[0][1] {
							break
						}
					}
				}
			} else {
				// Drawing 1 card
				if rules.Ordered {
					drawn = append(drawn, resetCard(stack[0]))
					stack = append(stack, stack[1:]...)
				} else {
					index := rand.Intn(len(stack) - 2)
					drawn = append(drawn, resetCard(stack[index]))
					stack = append(stack[:index], stack[index+1:]...)
				}
			}

			hand = append(hand, drawn...)

			// Saving card to arrays and setting player state
			players[current].Cards = len(hand)
			globals.Stacking = false

			if rules.Unlimited {
				for j := 0; j < len(drawn); j++ {
					if drawn[j][0] == stack[0][0] || drawn[j][1] == stack[0][1] {
						// Shifting turn to next player
						next, err := nextPlayer(player.GetString("name"), players, globals)
						if err != nil {
							return err
						}

						game.Set("live", players[next].Name)
						break
					}
				}
			} else {
				// Shifting turn to next player
				next, err := nextPlayer(player.GetString("name"), players, globals)
				if err != nil {
					return err
				}
				game.Set("live", players[next].Name)
			}

			// Update state
			playersUpdate, err := playersFromStruct(players)
			if err != nil {
				return err
			}

			stackUpdate, err := stackFromStruct(stack)
			if err != nil {
				return err
			}

			handUpdate, err := handFromStruct(hand)
			if err != nil {
				return err
			}

			game.Set("players", playersUpdate)
			game.Set("stack", stackUpdate)
			player.Set("hand", handUpdate)

			// Saving state
			err = saveGame(app, player)
			if err != nil {
				return err
			}

			err = savePlayer(app, player)
			if err != nil {
				return err
			}

			return c.JSON(http.StatusOK, Status{Status: "ok"})
		})

		/*e.Router.POST("/game/play", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Can't find user.", err)
			}

			game, err := app.Dao().FindRecordById("games", user.GetString("game"))
			if err != nil {
				return apis.NewBadRequestError("User not participating in game.", err)
			}

			var cards []string
			err = json.Unmarshal([]byte(user.GetString("hand")), &cards)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get player cards.", err)
			}

			var players []Player
			err = json.Unmarshal([]byte(game.GetString("players")), &players)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game players.", err)
			}

			var rules Rules
			err = json.Unmarshal([]byte(game.GetString("rules")), &rules)
			if err != nil {
				return apis.NewBadRequestError("Couldn't get game rules.", err)
			}

			var stack []string
			err = json.Unmarshal([]byte(game.GetString("stack")), &stack)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game card stack.", err)
			}

			// Checking if player has turn
			if game.GetString("live") != user.GetString("name") {
				return apis.NewBadRequestError("It's not your turn.", nil)
			}

			// Retrieve card player wants to play
			index := -1
			for i := 0; i < len(cards); i++ {
				if cards[i] == c.Request().Header.Get("card") {
					index = i
					break
				}
			}
			if index < 0 {
				return apis.NewBadRequestError("card not in player possession.", nil)
			}
			card := cards[index]

			// Retrieving player status
			var player Player
			for i := 0; i < len(players); i++ {
				if players[i].Name == user.GetString("name") {
					player = players[i]
				}
			}

			// Check if currently swapping
			if player.Swapping {
				return apis.NewBadRequestError("You are currently swapping.", nil)
			}

			// Check if currently wishing
			if !player.Drawable && (stack[0][0] == 'w' && stack[0][1] == 'd') && (stack[0][0] == 'w' && stack[0][1] == 'd') {
				return apis.NewBadRequestError("You are currently wishing.", nil)
			}

			// Checking if previous card requires draw / stack
			if player.Stacking {
				if stack[0][0] == 'p' {
					if !rules.Stack2 {
						if card[0] == 'p' {
							return apis.NewBadRequestError("Stacking is disabled. You need to draw.", nil)
						} else {
							return apis.NewBadRequestError("You need to draw.", nil)
						}
					}
					if card[0] != 'p' {
						return apis.NewBadRequestError("You must stack an equivalent card or draw.", nil)
					}
				} else if stack[0][0] == 'j' && player.Stacking {
					if !rules.Stack4 {
						if card[0] == 'j' {
							return apis.NewBadRequestError("Stacking is disabled. You need to draw.", nil)
						} else {
							return apis.NewBadRequestError("You need to draw.", nil)
						}
					}
					if card[0] != 'j' {
						return apis.NewBadRequestError("You must stack an equivalent card or draw.", nil)
					}
				} else {
					return apis.NewApiError(500, "Invalid stacking state.", err)
				}
			}

			// Checking if card is wish or if previous card has matching color
			if card[0] != 'w' && card[0] != 'j' && stack[0][0] != card[0] && stack[0][1] != card[1] {
				return apis.NewBadRequestError("card not matching.", nil)
			}

			// Applying direction change if needed
			if card[0] == 'd' {
				rules.Direction = !rules.Direction
			}

			// Saving card to arrays and setting player state
			cards = append(cards[:index], cards[index+1:]...)
			stack = append(stack, card)
			player.Cards = len(cards)
			if len(cards) > 1 {
				player.Called = false
			}
			if card[0] == '7' && rules.Swap {
				player.Swapping = true
			}

			// Saving player to array
			for i := 0; i < len(players); i++ {
				if players[i].Name == user.GetString("name") {
					players[i] = player
				}
			}

			// If player action isn't pending, assigning next player
			if card[0] != 'j' && card[0] != 'w' && (card[0] != '7' && !rules.Swap) {
				next := nextPlayer(user.GetString("name"), players, rules)
				if next < 0 {
					return apis.NewApiError(500, "Couldn't evaluate next player.", err)
				}

				// Skipping player if block played
				if card[0] == 'b' {
					next = nextPlayer(players[next].Name, players, rules)
					if next < 0 {
						return apis.NewApiError(500, "Couldn't evaluate next player.", err)
					}
				}

				// Applying traits for next player
				players[next].Drawable = true
				if card[0] == 'p' {
					players[next].Stacking = true
				}
				game.Set("live", players[next].Name)
			}

			// Check if player has won
			if rules.King {
				if len(cards) == 0 {
					game.Set("live", "")
				}
			} else {
				playing := 0

				for i := 0; i < len(players); i++ {
					if players[0].Cards > 0 {
						playing++
					}
					if playing > 1 {
						break
					}
				}

				if playing < 2 {
					game.Set("live", "")
				}
			}

			// Update state
			playersUpdate, err := json.Marshal(players)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game players update.", err)
			}

			stackUpdate, err := json.Marshal(stack)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game stack update.", err)
			}

			cardsUpdate, err := json.Marshal(cards)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get user cards update.", err)
			}

			rulesUpdate, err := json.Marshal(rules)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get user rules update.", err)
			}

			game.Set("players", playersUpdate)
			game.Set("stack", stackUpdate)
			game.Set("rules", rulesUpdate)
			user.Set("hand", cardsUpdate)

			err = app.Dao().SaveRecord(game)
			if err != nil {
				return apis.NewApiError(500, "Couldn't update game record.", err)
			}

			err = app.Dao().SaveRecord(user)
			if err != nil {
				return apis.NewApiError(500, "Couldn't update player record.", err)
			}

			return c.JSON(http.StatusOK, Status{Status: "ok"})
		})*/

		e.Router.POST("/game/throw", func(c echo.Context) error {
			// Retrieve target user
			player, err := getPlayerRecordByToken(app, c.Request().Header.Get("token"))
			if err != nil {
				return err
			}

			game, err := getGameRecordByCode(app, player.GetString("game"))
			if err != nil {
				return err
			}

			hand, err := handFromPlayer(player)
			if err != nil {
				return err
			}

			players, err := playersFromGame(game)
			if err != nil {
				return err
			}

			rules, err := rulesFromGame(game)
			if err != nil {
				return err
			}

			stack, err := stackFromGame(game)
			if err != nil {
				return err
			}

			globals, err := globalsFromGame(game)
			if err != nil {
				return err
			}

			// Retrieve card player wants to play
			index := -1
			for i := 0; i < len(hand); i++ {
				if hand[i] == c.Request().Header.Get("card") {
					index = i
					break
				}
			}
			if index < 0 {
				return apis.NewBadRequestError("Card not in player possession.", nil)
			}
			card := hand[index]

			// Retrieving player status
			current, err := playerIndexByName(player.GetString("name"), players)
			if err != nil {
				return err
			}

			// Checking if card is wish or if previous card has matching color
			if card[0] != 'w' && card[0] != 'j' && stack[0][0] != card[0] && stack[0][1] != card[1] {
				return apis.NewBadRequestError("Card not matching.", nil)
			}

			// Applying direction change if needed
			if card[0] == 'd' {
				globals.Direction = !globals.Direction
			}

			// Enable swap if needed
			if card[0] == '7' && rules.Swap {
				globals.Swapping = true
			}

			// Play card from inventory to stack
			hand = append(hand[:index], hand[index+1:]...)
			stack = append(stack, card)
			players[current].Cards = len(hand)
			if len(hand) > 1 {
				players[current].Called = false
			}

			// If player action isn't pending, assigning next player
			if card[0] != 'j' && card[0] != 'w' && (card[0] != '7' && !rules.Swap) {
				next, err := nextPlayer(player.GetString("name"), players, globals)
				if err != nil {
					return err
				}

				// Skipping player if block played
				if card[0] == 'b' {
					next, err = nextPlayer(players[next].Name, players, globals)
					if err != nil {
						return err
					}
				}

				// Applying traits for next player
				globals.Live = players[next].Name
				globals.Drawable = true
				globals.Swapping = false
				if card[0] == 'p' {
					globals.Stacking = true
				}
			}

			// Check if player has won
			if rules.King && len(hand) == 0 {
				// Reset game
				globals = defaultGlobalsStruct()
				for i := 0; i < len(players); i++ {
					players[i].Called = false
					players[i].Cards = 0

					player, err := getPlayerRecordByName(app, players[i].Name)
					if err != nil {
						return err
					}

					player.Set("hand", defaultJson())

					if err := savePlayer(app, player); err != nil {
						return err
					}
				}
			} else {
				playing := 0

				// Check how many players are still playing
				for i := 0; i < len(players); i++ {
					if players[0].Cards > 0 {
						playing++
					}
					if playing > 1 {
						break
					}
				}

				if playing < 2 {
					// Reset game
					globals = defaultGlobalsStruct()
					for i := 0; i < len(players); i++ {
						players[i].Called = false
						players[i].Cards = 0

						player, err := getPlayerRecordByName(app, players[i].Name)
						if err != nil {
							return err
						}

						player.Set("hand", defaultJson())

						if err := savePlayer(app, player); err != nil {
							return err
						}
					}
				}
			}

			// Update state
			playersUpdate, err := playersFromStruct(players)
			if err != nil {
				return err
			}

			stackUpdate, err := stackFromStruct(stack)
			if err != nil {
				return err
			}

			globalsUpdate, err := globalsFromStruct(globals)
			if err != nil {
				return err
			}

			handUpdate, err := handFromStruct(hand)
			if err != nil {
				return err
			}

			game.Set("players", playersUpdate)
			game.Set("stack", stackUpdate)
			game.Set("globals", globalsUpdate)
			player.Set("hand", handUpdate)

			// Saving state
			err = saveGame(app, player)
			if err != nil {
				return err
			}

			err = savePlayer(app, player)
			if err != nil {
				return err
			}

			return c.JSON(http.StatusOK, Status{Status: "ok"})
		})

		/*e.Router.POST("/game/hold", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Can't find user.", err)
			}

			game, err := app.Dao().FindRecordById("games", user.GetString("game"))
			if err != nil {
				return apis.NewBadRequestError("User not participating in game.", err)
			}

			var cards []string
			err = json.Unmarshal([]byte(user.GetString("hand")), &cards)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get player cards.", err)
			}

			var players []Player
			err = json.Unmarshal([]byte(game.GetString("players")), &players)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game players.", err)
			}

			var rules Rules
			err = json.Unmarshal([]byte(game.GetString("rules")), &rules)
			if err != nil {
				return apis.NewBadRequestError("Couldn't get game rules.", err)
			}

			var stack []string
			err = json.Unmarshal([]byte(game.GetString("stack")), &stack)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game card stack.", err)
			}

			// Checking if player has turn
			if game.GetString("live") != user.GetString("name") {
				return apis.NewBadRequestError("It's not your turn.", nil)
			}

			// Update drawing status
			for i := 0; i < len(players); i++ {
				if players[i].Name == user.GetString("name") {
					if players[i].Drawable {
						return apis.NewBadRequestError("User is still drawable.", err)
					}
					break
				}
			}

			// Shifting turn to next player
			next := nextPlayer(user.GetString("name"), players, rules)
			if next < 0 {
				return apis.NewApiError(500, "Couldn't evaluate next player.", err)
			}
			players[next].Drawable = true
			game.Set("live", players[next].Name)

			// Update state
			playersUpdate, err := json.Marshal(players)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game players update.", err)
			}

			stackUpdate, err := json.Marshal(stack)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game stack update.", err)
			}

			cardsUpdate, err := json.Marshal(cards)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get user cards update.", err)
			}

			game.Set("players", playersUpdate)
			game.Set("stack", stackUpdate)
			user.Set("hand", cardsUpdate)

			err = app.Dao().SaveRecord(game)
			if err != nil {
				return apis.NewApiError(500, "Couldn't update game record.", err)
			}

			err = app.Dao().SaveRecord(user)
			if err != nil {
				return apis.NewApiError(500, "Couldn't update player record.", err)
			}

			return c.JSON(http.StatusOK, Status{Status: "ok"})
		})

		e.Router.POST("/game/wish", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Can't find user.", err)
			}

			game, err := app.Dao().FindRecordById("games", user.GetString("game"))
			if err != nil {
				return apis.NewBadRequestError("User not participating in game.", err)
			}

			var cards []string
			err = json.Unmarshal([]byte(user.GetString("hand")), &cards)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get player cards.", err)
			}

			var players []Player
			err = json.Unmarshal([]byte(game.GetString("players")), &players)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game players.", err)
			}

			var rules Rules
			err = json.Unmarshal([]byte(game.GetString("rules")), &rules)
			if err != nil {
				return apis.NewBadRequestError("Couldn't get game rules.", err)
			}

			var stack []string
			err = json.Unmarshal([]byte(game.GetString("stack")), &stack)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game card stack.", err)
			}

			// Checking if player has turn
			if game.GetString("live") != user.GetString("name") {
				return apis.NewBadRequestError("It's not your turn.", nil)
			}

			// Checking if previous card is wishable
			if stack[0][0] != 'w' && stack[0][0] != 'j' {
				return apis.NewBadRequestError("Previous card is not a wish card.", nil)
			}

			// Checking if color is valid
			color := c.Request().Header.Get("color")[0]
			if color != 'y' && color != 'g' && color != 'b' && color != 'p' {
				return apis.NewBadRequestError("Invalid card color.", nil)
			}

			// Update wish color
			stack[0] = string(stack[0][0]) + string(c.Request().Header.Get("color")[0])

			// Advancing turn
			next := nextPlayer(user.GetString("name"), players, rules)
			if next < 0 {
				return apis.NewApiError(500, "Couldn't evaluate next player.", err)
			}

			// Applying traits for next player
			players[next].Drawable = true
			if stack[0][0] == 'j' {
				players[next].Stacking = true
			}
			game.Set("live", players[next].Name)

			// Update state
			playersUpdate, err := json.Marshal(players)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game players update.", err)
			}

			stackUpdate, err := json.Marshal(stack)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game stack update.", err)
			}

			game.Set("players", playersUpdate)
			game.Set("stack", stackUpdate)

			err = app.Dao().SaveRecord(game)
			if err != nil {
				return apis.NewApiError(500, "Couldn't update game record.", err)
			}

			return c.JSON(http.StatusOK, Status{Status: "ok"})
		})

		e.Router.POST("/game/call", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Can't find user.", err)
			}

			game, err := app.Dao().FindRecordById("games", user.GetString("game"))
			if err != nil {
				return apis.NewBadRequestError("User not participating in game.", err)
			}

			var cards []string
			err = json.Unmarshal([]byte(user.GetString("hand")), &cards)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get player cards.", err)
			}

			var players []Player
			err = json.Unmarshal([]byte(game.GetString("players")), &players)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game players.", err)
			}

			var stack []string
			err = json.Unmarshal([]byte(game.GetString("stack")), &stack)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game card stack.", err)
			}

			// Checking if player has turn
			if game.GetString("live") != user.GetString("name") {
				return apis.NewBadRequestError("It's not your turn.", nil)
			}

			// Update called status
			for i := 0; i < len(players); i++ {
				if players[i].Name == user.GetString("name") {
					if players[i].Called {
						return apis.NewBadRequestError("User has already called.", err)
					}

					players[i].Called = true
					break
				}
			}

			// Update state
			playersUpdate, err := json.Marshal(players)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game players update.", err)
			}

			stackUpdate, err := json.Marshal(stack)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game stack update.", err)
			}

			cardsUpdate, err := json.Marshal(cards)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get user cards update.", err)
			}

			game.Set("players", playersUpdate)
			game.Set("stack", stackUpdate)
			user.Set("hand", cardsUpdate)

			err = app.Dao().SaveRecord(game)
			if err != nil {
				return apis.NewApiError(500, "Couldn't update game record.", err)
			}

			err = app.Dao().SaveRecord(user)
			if err != nil {
				return apis.NewApiError(500, "Couldn't update player record.", err)
			}

			return c.JSON(http.StatusOK, Status{Status: "ok"})
		})

		e.Router.POST("/game/appeal", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Can't find user.", err)
			}

			game, err := app.Dao().FindRecordById("games", user.GetString("game"))
			if err != nil {
				return apis.NewBadRequestError("User not participating in game.", err)
			}

			var cards []string
			err = json.Unmarshal([]byte(user.GetString("hand")), &cards)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get player cards.", err)
			}

			var players []Player
			err = json.Unmarshal([]byte(game.GetString("players")), &players)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game players.", err)
			}

			var rules Rules
			err = json.Unmarshal([]byte(game.GetString("rules")), &rules)
			if err != nil {
				return apis.NewBadRequestError("Couldn't get game rules.", err)
			}

			var stack []string
			err = json.Unmarshal([]byte(game.GetString("stack")), &stack)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game card stack.", err)
			}

			// Checking if player has turn
			if game.GetString("live") != user.GetString("player") {
				return apis.NewBadRequestError("It's not the player's turn.", nil)
			}

			// Update called status
			for i := 0; i < len(players); i++ {
				if players[i].Name == user.GetString("player") {
					if players[i].Called {
						return apis.NewBadRequestError("Player has already called.", err)
					}

					// Draw 2 cards if possible
					draw := 2
					for {
						if rules.Ordered {
							cards = append(cards, stack[len(stack) - 1])
							stack = append(stack, stack[1:]...)
						} else {
							index := rand.Intn(len(stack) - 2)
							cards = append(cards, stack[index])
							stack = append(stack[:index], stack[index+1:]...)
						}
						draw--

						if len(stack) > 1 && draw > 0 {
							break
						}
					}

					break
				}
			}

			// Update state
			playersUpdate, err := json.Marshal(players)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game players update.", err)
			}

			stackUpdate, err := json.Marshal(stack)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game stack update.", err)
			}

			cardsUpdate, err := json.Marshal(cards)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get user cards update.", err)
			}

			game.Set("players", playersUpdate)
			game.Set("stack", stackUpdate)
			user.Set("hand", cardsUpdate)

			err = app.Dao().SaveRecord(game)
			if err != nil {
				return apis.NewApiError(500, "Couldn't update game record.", err)
			}

			err = app.Dao().SaveRecord(user)
			if err != nil {
				return apis.NewApiError(500, "Couldn't update user record.", err)
			}

			return c.JSON(http.StatusOK, Status{Status: "ok"})
		})

		e.Router.POST("/game/switch", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Can't find user.", err)
			}

			game, err := app.Dao().FindRecordById("games", user.GetString("game"))
			if err != nil {
				return apis.NewBadRequestError("User not participating in game.", err)
			}

			var players []Player
			err = json.Unmarshal([]byte(game.GetString("players")), &players)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game players.", err)
			}

			var rules Rules
			err = json.Unmarshal([]byte(game.GetString("rules")), &rules)
			if err != nil {
				return apis.NewBadRequestError("Couldn't get game rules.", err)
			}

			// Checking if player has turn
			if game.GetString("live") != user.GetString("name") {
				return apis.NewBadRequestError("It's not your turn.", nil)
			}

			// Checking if player is currently swapping
			for i := 0; i < len(players); i++ {
				if players[i].Name == user.GetString("name") {
					if !players[i].Swapping {
						return apis.NewBadRequestError("The user is currently not swapping.", nil)
					} else {
						break
					}
				}
			}

			// Redistributing cards
			player, err := app.Dao().FindFirstRecordByData("players", "name", c.Request().Header.Get("player"))
			if err != nil {
				return apis.NewApiError(500, "Couldn't get player.", err)
			}
			if player.GetString("game") != user.GetString("game") {
				return apis.NewBadRequestError("Player in other game.", nil)
			}

			// Update hands
			hand1 := user.GetString("hand")
			hand2 := player.GetString("hand")
			player.Set("hand", hand1)
			user.Set("hand", hand2)

			// Update game cards
			for i := 0; i < len(players); i++ {
				if players[i].Name == user.GetString("player") {
					var count []string
					err = json.Unmarshal([]byte(hand1), &count)
					if err != nil {
						return apis.NewApiError(500, "Couldn't get first hand.", err)
					}

					players[i].Cards = len(count)
				}
				if players[i].Name == user.GetString("name") {
					var count []string
					err = json.Unmarshal([]byte(hand2), &count)
					if err != nil {
						return apis.NewApiError(500, "Couldn't get second hand.", err)
					}

					players[i].Cards = len(count)
				}
			}

			// Finish switching
			for i := 0; i < len(players); i++ {
				if players[i].Name == user.GetString("name") {
					players[i].Swapping = false
				}
			}

			// Shifting turn
			next := nextPlayer(user.GetString("name"), players, rules)
			if next < 0 {
				return apis.NewApiError(500, "Couldn't evaluate next player.", err)
			}
			players[next].Drawable = true
			game.Set("live", players[next].Name)

			// Update state
			playersUpdate, err := json.Marshal(players)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game players update.", err)
			}

			game.Set("players", playersUpdate)

			err = app.Dao().SaveRecord(game)
			if err != nil {
				return apis.NewApiError(500, "Couldn't update game record.", err)
			}

			err = app.Dao().SaveRecord(user)
			if err != nil {
				return apis.NewApiError(500, "Couldn't update user record.", err)
			}

			err = app.Dao().SaveRecord(player)
			if err != nil {
				return apis.NewApiError(500, "Couldn't update player record.", err)
			}

			return c.JSON(http.StatusOK, Status{Status: "ok"})
		})

		e.Router.POST("/game/timeout", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Can't find user.", err)
			}

			game, err := app.Dao().FindRecordById("games", user.GetString("game"))
			if err != nil {
				return apis.NewBadRequestError("User not participating in game.", err)
			}

			var players []Player
			err = json.Unmarshal([]byte(game.GetString("players")), &players)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game players.", err)
			}

			var rules Rules
			err = json.Unmarshal([]byte(game.GetString("rules")), &rules)
			if err != nil {
				return apis.NewBadRequestError("Couldn't get game rules.", err)
			}

			var stack []string
			err = json.Unmarshal([]byte(game.GetString("stack")), &stack)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game card stack.", err)
			}

			// Checking if timeout has elapsed
			if int(time.Now().Sub(game.Updated.Time()).Seconds()) <= rules.Timeout {
				return apis.NewBadRequestError("Timeout hasn't elapsed yet.", nil)
			}

			// Removing player from game
			name := ""
			for i := 0; i < len(players); i++ {
				if players[i].Name == user.GetString("player") {
					name = players[i].Name
					players = append(players[:i], players[i+1:]...)
					break
				}
			}

			if len(name) == 0 {
				return apis.NewBadRequestError("Player not participating in game.", nil)
			}

			// Redistributing cards
			player, err := app.Dao().FindFirstRecordByData("players", "name", name)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get player.", err)
			}

			var cards []string
			err = json.Unmarshal([]byte(player.GetString("hand")), &cards)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get players hand.", err)
			}

			stack = append(cards, stack...)
			player.Set("hand", "[{}]")

			// Shifting turn if it was the player's turn
			if game.GetString("live") == player.GetString("name") {
				next := nextPlayer(user.GetString("name"), players, rules)
				if next < 0 {
					return apis.NewApiError(500, "Couldn't evaluate next player.", err)
				}
				players[next].Drawable = true
				game.Set("live", players[next].Name)
			}

			// Update state
			playersUpdate, err := json.Marshal(players)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game players update.", err)
			}

			stackUpdate, err := json.Marshal(stack)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get game stack update.", err)
			}

			game.Set("players", playersUpdate)
			game.Set("stack", stackUpdate)
			player.Set("hand", "[{}]")

			err = app.Dao().SaveRecord(game)
			if err != nil {
				return apis.NewApiError(500, "Couldn't update game record.", err)
			}

			err = app.Dao().SaveRecord(player)
			if err != nil {
				return apis.NewApiError(500, "Couldn't update player record.", err)
			}

			return c.JSON(http.StatusOK, Status{Status: "ok"})
		})*/

		return nil
	})

	// ---------------------------------------------------------------
	// Migrate and start:
	// ---------------------------------------------------------------

	migratecmd.MustRegister(app, app.RootCmd, &migratecmd.Options{
		TemplateLang: migratecmd.TemplateLangGo,
		Automigrate:  automigrate,
		Dir:          migrationsDir,
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
