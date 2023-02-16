package main

import (
	"encoding/json"
	"github.com/labstack/echo/v5/middleware"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"

	_ "main/migrations"
)

type Status struct {
	Status string `json:"status" xml:"status"`
}

type Registration struct {
	Name  string `json:"name" xml:"name"`
	Token string `json:"token" xml:"token"`
}

type Session struct {
	Game string `json:"game" xml:"game"`
}

type Player struct {
	Name   string `json:"name" xml:"name"`
	Cards  int    `json:"cards" xml:"cards"`
	Called bool   `json:"called" xml:"called"`
}

type Global struct {
	Direction bool `json:"direction" xml:"direction"` // Direction of turns of players (true is clockwise)
	Stacking  bool `json:"stacking" xml:"stacking"`
	Swapping  bool `json:"swapping" xml:"swapping"`
	Drawable  bool `json:"drawable" xml:"drawable"`
}

type Rules struct {
	Count     int  `json:"count" xml:"count"`         // Number of cards every player gets at start
	Stack2    bool `json:"stack2" xml:"stack2"`       // Draw 2 cards are stackable
	Stack4    bool `json:"stack4" xml:"stack4"`       // Draw 4 cards are stackable
	Swap      bool `json:"swap" xml:"swap"`           // LobbyPlayers selects who to swap hands with when a 7 is played
	Throw     bool `json:"throw" xml:"throw"`         // LobbyPlayers can throw identical cards in anytime
	Unlimited bool `json:"unlimited" xml:"unlimited"` // LobbyPlayers draw until card is playable
	Ordered   bool `json:"ordered" xml:"ordered"`     // LobbyPlayers draw from bottom of stack
	Hold      bool `json:"hold" xml:"hold"`           // LobbyPlayers can hold matching card after drawn
	King      bool `json:"king" xml:"king"`           // Game ends when the first player is finished
	Timeout   int  `json:"timeout" xml:"timeout"`     // Time each player has to take his turn (seconds)
}

var DECK = []string{
	"0y", "0g", "0b", "0p",
	"1y", "1g", "1b", "1p",
	"1y", "1g", "1b", "1p",
	"2y", "2g", "2b", "2p",
	"2y", "2g", "2b", "2p",
	"3y", "3g", "3b", "3p",
	"3y", "3g", "3b", "3p",
	"4y", "4g", "4b", "4p",
	"4y", "4g", "4b", "4p",
	"5y", "5g", "5b", "5p",
	"5y", "5g", "5b", "5p",
	"6y", "6g", "6b", "6p",
	"6y", "6g", "6b", "6p",
	"7y", "7g", "7b", "7p",
	"7y", "7g", "7b", "7p",
	"8y", "8g", "8b", "8p",
	"8y", "8g", "8b", "8p",
	"9y", "9g", "9b", "9p",
	"9y", "9g", "9b", "9p",
	"by", "bg", "bb", "bp",
	"by", "bg", "bb", "bp",
	"dy", "dg", "db", "dp",
	"dy", "dg", "db", "dp",
	"py", "pg", "pb", "pp",
	"py", "pg", "pb", "pp",
	"wd", "wd", "wd", "wd",
	"jd", "jd", "jd", "jd",
}

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
		[]string{"https://108.cards", "http://localhost:3000"},
		"CORS allowed domain origins list",
	)

	app.RootCmd.ParseFlags(os.Args[1:])

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
			collection, err := app.Dao().FindCollectionByNameOrId("players")
			if err != nil {
				return apis.NewApiError(500, "Couldn't access player database.", err)
			}

			record := models.NewRecord(collection)
			record.Set("name", ulid.Make().String())
			record.Set("hand", "[{}]")

			err = app.Dao().SaveRecord(record)
			if err != nil {
				return apis.NewApiError(500, "Couldn't create player record.", err)
			}

			return c.JSON(http.StatusOK, Registration{Name: record.GetString("name"), Token: record.Id})
		})

		e.Router.POST("/session/create", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Can't find user.", err)
			}

			if len(user.GetString("game")) != 0 {
				// Check for ongoing game
				game, err := app.Dao().FindRecordById("games", user.GetString("game"))
				if err == nil {
					// Registered for valid game
					// Retrieve ongoing game player data
					var players []Player
					err = json.Unmarshal([]byte(game.GetString("players")), &players)
					if err != nil {
						return apis.NewApiError(500, "Couldn't get ongoing players.", err)
					}

					// Remove player from ongoing game
					for i := 0; i < len(players); i++ {
						if players[i].Name == user.Get("name") {
							updated, err := json.Marshal(append(players[:i], players[i+1:]...))
							if err != nil {
								return apis.NewApiError(500, "Couldn't generate ongoing update request.", err)
							}

							game.Set("players", updated)
							err = app.Dao().SaveRecord(game)
							if err != nil {
								return apis.NewApiError(500, "Couldn't remove player from ongoing game.", err)
							}
							break
						}
					}
				}

				// Remove ongoing game from player
				user.Set("game", "")
				err = app.Dao().SaveRecord(user)
				if err != nil {
					return apis.NewApiError(500, "Couldn't update player game.", err)
				}
			}

			collection, err := app.Dao().FindCollectionByNameOrId("games")
			if err != nil {
				return apis.NewApiError(500, "Couldn't access game database.", err)
			}

			players, err := json.Marshal([]Player{{
				Name:     user.GetString("name"),
				Cards:    0,
				Called:   false,
				Drawable: false,
				Swapping: false,
			}})
			if err != nil {
				return apis.NewApiError(500, "Couldn't generate default rules.", err)
			}

			rules, err := json.Marshal(Rules{
				Direction: true,
				Count:     7,
				Stack2:    false,
				Stack4:    false,
				Swap:      false,
				Throw:     false,
				Unlimited: false,
				Ordered:   false,
				Hold:      false,
				King:      false,
				Timeout:   15,
			})
			if err != nil {
				return apis.NewApiError(500, "Couldn't generate default rules.", err)
			}

			// Create game record
			record := models.NewRecord(collection)
			record.Set("players", players)
			record.Set("rules", rules)
			record.Set("stack", "[{}]")

			// Updating state
			err = app.Dao().SaveRecord(record)
			if err != nil {
				return apis.NewApiError(500, "Couldn't create game record.", err)
			}

			// Adding player to game
			user.Set("game", record.Id)

			err = app.Dao().SaveRecord(user)
			if err != nil {
				return apis.NewApiError(500, "Couldn't add player to game.", err)
			}

			return c.JSON(http.StatusOK, Session{Game: record.Id})
		})

		e.Router.POST("/session/join", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Couldn't find player.", err)
			}

			if len(user.GetString("game")) != 0 && user.GetString("game") != c.Request().Header.Get("game") {
				// Check for ongoing game
				game, err := app.Dao().FindRecordById("games", user.GetString("game"))
				if err != nil {
					return apis.NewApiError(500, "User registered for game that is absent.", err)
				}

				// Retrieve ongoing game player data
				var players []Player
				err = json.Unmarshal([]byte(game.GetString("players")), &players)
				if err != nil {
					return apis.NewApiError(500, "Couldn't get ongoing players.", err)
				}

				// Remove player from ongoing game
				for i := 0; i < len(players); i++ {
					if players[i].Name == user.Get("name") {
						players = append(players[:i], players[i+1:]...)

						// Clean up dead game
						if len(players) == 1 {
							game.Set("live", "")
							players[0].Cards = 0
							players[0].Drawable = false
							players[0].Called = false
							players[0].Swapping = false

							player, err := app.Dao().FindFirstRecordByData("players", "name", players[0].Name)
							if err != nil {
								return apis.NewApiError(500, "Couldn't get player for cleanup.", err)
							}

							player.Set("hand", "[{}]")

							err = app.Dao().SaveRecord(player)
							if err != nil {
								return apis.NewApiError(500, "Couldn't update player for cleanup.", err)
							}
						}

						// Save state
						updated, err := json.Marshal(players)
						if err != nil {
							return apis.NewApiError(500, "Couldn't generate ongoing update request.", err)
						}

						game.Set("players", updated)
						err = app.Dao().SaveRecord(game)
						if err != nil {
							return apis.NewApiError(500, "Couldn't remove player from ongoing game.", err)
						}
						break
					}
				}

				// Remove ongoing game from player
				user.Set("game", "")
				err = app.Dao().SaveRecord(user)
				if err != nil {
					return apis.NewApiError(500, "Couldn't update player game.", err)
				}
			}

			// Retrieve target game to join
			game, err := app.Dao().FindRecordById("games", c.Request().Header.Get("game"))
			if err != nil {
				return apis.NewBadRequestError("Can't find specified game.", err)
			}

			if len(game.GetString("live")) > 0 && c.Request().Header.Get("game") != user.GetString("game") {
				return apis.NewBadRequestError("Game has already started.", err)
			}

			if c.Request().Header.Get("game") != user.GetString("game") {
				var players []Player
				err = json.Unmarshal([]byte(game.GetString("players")), &players)
				if err != nil {
					return apis.NewApiError(500, "Couldn't get players for game.", err)
				}

				// Adding player to game
				updated, err := json.Marshal(append(players, Player{
					Name:     user.GetString("name"),
					Cards:    0,
					Called:   false,
					Drawable: false,
					Swapping: false,
				}))
				if err != nil {
					return apis.NewApiError(500, "Couldn't generate game update request.", err)
				}

				game.Set("players", updated)
				err = app.Dao().SaveRecord(game)
				if err != nil {
					return apis.NewApiError(500, "Couldn't add player to game.", err)
				}
			}

			// Add game to player
			user.Set("game", game.Id)
			err = app.Dao().SaveRecord(user)
			if err != nil {
				return apis.NewApiError(500, "Couldn't update player game.", err)
			}

			return c.JSON(http.StatusOK, Status{Status: "ok"})
		})

		e.Router.POST("/session/start", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Can't find user.", err)
			}

			if len(user.GetString("game")) == 0 {
				return apis.NewBadRequestError("You are not participating in this game.", err)
			}

			game, err := app.Dao().FindRecordById("games", user.GetString("game"))
			if err != nil {
				return apis.NewApiError(500, "User participating in absent game.", err)
			}

			var rules Rules
			err = json.Unmarshal([]byte(game.GetString("rules")), &rules)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get rules.", err)
			}

			var players []Player
			err = json.Unmarshal([]byte(game.GetString("players")), &players)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get players.", err)
			}

			if players[0].Name != user.GetString("name") {
				return apis.NewBadRequestError("You are not the host.", err)
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

					if players[i].Name == user.GetString("name") {
						players[i].Drawable = true
					}

					for j := 0; j < rules.Count; j++ {
						index := rand.Intn(len(stack) - 1)
						hand = append(hand, stack[index])
						stack = append(stack[:index], stack[index+1:]...)
					}

					players[i].Cards = rules.Count

					user, err := app.Dao().FindFirstRecordByData("players", "name", players[i].Name)
					if err != nil {
						return apis.NewApiError(500, "Couldn't retrieve player "+players[i].Name+".", err)
					}

					handUpdate, err := json.Marshal(hand)
					if err != nil {
						return apis.NewApiError(500, "Couldn't generate player hand update.", err)
					}

					user.Set("hand", handUpdate)
					err = app.Dao().SaveRecord(user)
					if err != nil {
						return apis.NewApiError(500, "Couldn't assign player hand.", err)
					}
				}

				stackUpdate, err := json.Marshal(stack)
				if err != nil {
					return apis.NewApiError(500, "Couldn't get game stack update.", err)
				}

				game.Set("stack", stackUpdate)
			} else {
				for i := 0; i < len(players); i++ {
					var hand []string

					if players[i].Name == user.GetString("name") {
						players[i].Drawable = true
					}

					for j := 0; j < rules.Count; j++ {
						index := rand.Intn(len(DECK) - 1)
						hand = append(hand, DECK[index])
					}

					user, err := app.Dao().FindFirstRecordByData("players", "name", players[i].Name)
					if err != nil {
						return apis.NewApiError(500, "Couldn't retrieve player "+players[i].Name+".", err)
					}

					handUpdate, err := json.Marshal(hand)
					if err != nil {
						return apis.NewApiError(500, "Couldn't generate player hand update.", err)
					}

					user.Set("hand", handUpdate)
					err = app.Dao().SaveRecord(user)
					if err != nil {
						return apis.NewApiError(500, "Couldn't assign player hand.", err)
					}
				}
			}

			playersUpdate, err := json.Marshal(players)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get player update.", err)
			}

			game.Set("live", user.GetString("name"))
			game.Set("players", playersUpdate)
			err = app.Dao().SaveRecord(game)
			if err != nil {
				return apis.NewApiError(500, "Couldn't start game.", err)
			}

			return c.JSON(http.StatusOK, Status{Status: "ok"})
		})

		e.Router.POST("/session/rules", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Can't find user.", err)
			}

			if len(user.GetString("game")) == 0 {
				return apis.NewBadRequestError("You are not participating in this game.", err)
			}

			game, err := app.Dao().FindRecordById("games", user.GetString("game"))
			if err != nil {
				return apis.NewBadRequestError("Can't find specified game.", err)
			}

			var rules Rules
			err = json.Unmarshal([]byte(c.Request().Header.Get("rules")), &rules)
			if err != nil {
				return apis.NewBadRequestError("Invalid rules provided.", err)
			}

			game.Set("rules", rules)
			err = app.Dao().SaveRecord(game)
			if err != nil {
				return apis.NewApiError(500, "Couldn't save rules for game.", err)
			}

			return c.JSON(http.StatusOK, Status{Status: "ok"})
		})

		e.Router.POST("/session/leave", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Can't find user.", err)
			}

			if len(user.GetString("game")) != 0 {
				// Check for ongoing game
				game, err := app.Dao().FindRecordById("games", user.GetString("game"))
				if err != nil {
					return apis.NewApiError(500, "User registered for game that is absent.", err)
				}

				// Retrieve ongoing game player data
				var players []Player
				err = json.Unmarshal([]byte(game.GetString("players")), &players)
				if err != nil {
					return apis.NewApiError(500, "Couldn't get ongoing players.", err)
				}

				// Remove player from ongoing game
				for i := 0; i < len(players); i++ {
					if players[i].Name == user.Get("name") {
						players = append(players[:i], players[i+1:]...)

						// If no players are left, purge game
						if len(players) == 0 {
							err = app.Dao().DeleteRecord(game)
							if err != nil {
								return apis.NewApiError(500, "Couldn't delete empty game.", err)
							}
							break
						}

						updated, err := json.Marshal(players)
						if err != nil {
							return apis.NewApiError(500, "Couldn't generate ongoing update request.", err)
						}

						game.Set("players", updated)
						err = app.Dao().SaveRecord(game)
						if err != nil {
							return apis.NewApiError(500, "Couldn't remove player from ongoing game.", err)
						}
						break
					}
				}

				// Remove ongoing game from player
				user.Set("game", "")
				err = app.Dao().SaveRecord(user)
				if err != nil {
					return apis.NewApiError(500, "Couldn't update player game.", err)
				}
			}

			return c.JSON(http.StatusOK, Status{Status: "ok"})
		})

		e.Router.POST("/session/ongoing", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Can't find user.", err)
			}

			if len(user.GetString("game")) == 0 {
				return c.JSON(http.StatusOK, Session{Game: ""})
			}

			game, err := app.Dao().FindRecordById("games", user.GetString("game"))
			if err != nil {
				return apis.NewBadRequestError("User participating in absent game.", err)
			}

			return c.JSON(http.StatusOK, Session{Game: game.Id})
		})

		e.Router.POST("/game/draw", func(c echo.Context) error {
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

			// Retrieving player status
			var player Player
			for i := 0; i < len(players); i++ {
				if players[i].Name == user.GetString("name") {
					player = players[i]
				}
			}

			if game.GetString("live") != user.GetString("name") {
				return apis.NewBadRequestError("It's not your turn.", nil)
			}

			if !player.Drawable {
				return apis.NewBadRequestError("You can't draw anymore cards.", nil)
			}

			var drawn []string

			if stack[len(stack)-1][0] == 'p' && player.Drawable {
				// Drawing 2 * n cards
				for i := 1; i > 0; i++ {
					for j := 0; j < 2; j++ {
						if rules.Ordered {
							drawn = append(drawn, resetCard(stack[0]))
							stack = append(stack, stack[1:]...)
						} else {
							index := rand.Intn(len(stack) - 2)
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
			} else if stack[len(stack)-1][0] == 'j' && player.Drawable {
				// Drawing 4 * n cards
				for i := 1; i > 0; i++ {
					for j := 0; j < 4; j++ {
						if rules.Ordered {
							drawn = append(drawn, resetCard(stack[0]))
							stack = append(stack, stack[1:]...)
						} else {
							index := rand.Intn(len(stack) - 2)
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
						drawn = append(drawn, resetCard(stack[0]))
						stack = append(stack, stack[1:]...)
						if len(stack) > 1 && drawn[len(drawn)-1][1] != stack[len(stack)-1][1] {
							break
						}
					}
				} else {
					for {
						index := rand.Intn(len(stack) - 2)
						drawn = append(drawn, resetCard(stack[index]))
						stack = append(stack[:index], stack[index+1:]...)
						if len(stack) <= 1 && drawn[len(drawn)-1][1] != stack[len(stack)-1][1] {
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

			cards = append(cards, drawn...)

			// Saving card to arrays and setting player state
			for i := 0; i < len(players); i++ {
				if players[i].Name == user.GetString("name") {
					players[i].Cards = len(cards)
					if player.Stacking {
						players[i].Stacking = false
					}

					if rules.Unlimited {
						for j := 0; j < len(drawn); j++ {
							if drawn[j][0] == stack[len(stack)-1][0] || drawn[j][1] == stack[len(stack)-1][1] {
								players[i].Drawable = false

								// Shifting turn to next player
								next := nextPlayer(user.GetString("name"), players, rules)
								if next < 0 {
									return apis.NewApiError(500, "Couldn't evaluate next player.", err)
								}
								players[next].Drawable = true
								game.Set("live", players[next].Name)
								break
							}
						}
					} else {
						players[i].Drawable = false

						// Shifting turn to next player
						next := nextPlayer(user.GetString("name"), players, rules)
						if next < 0 {
							return apis.NewApiError(500, "Couldn't evaluate next player.", err)
						}
						players[next].Drawable = true
						game.Set("live", players[next].Name)
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
				return apis.NewApiError(500, "Couldn't update player record.", err)
			}

			return c.JSON(http.StatusOK, Status{Status: "ok"})
		})

		e.Router.POST("/game/play", func(c echo.Context) error {
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
			if !player.Drawable && (stack[len(stack)-1][0] == 'w' && stack[len(stack)-1][1] == 'd') && (stack[len(stack)-1][0] == 'w' && stack[len(stack)-1][1] == 'd') {
				return apis.NewBadRequestError("You are currently wishing.", nil)
			}

			// Checking if previous card requires draw / stack
			if player.Stacking {
				if stack[len(stack)-1][0] == 'p' {
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
				} else if stack[len(stack)-1][0] == 'j' && player.Stacking {
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
			if card[0] != 'w' && card[0] != 'j' && stack[len(stack)-1][0] != card[0] && stack[len(stack)-1][1] != card[1] {
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
		})

		e.Router.POST("/game/throw", func(c echo.Context) error {
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

			// Checking if card is wish or if previous card has matching color
			if card[0] != 'w' && card[0] != 'j' && stack[len(stack)-1][0] != card[0] && stack[len(stack)-1][1] != card[1] {
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

			// Saving player to array and clean up last player
			for i := 0; i < len(players); i++ {
				if players[i].Name == user.GetString("name") {
					players[i] = player
				}

				if players[i].Name == game.GetString("live") {
					players[i].Drawable = false
					players[i].Stacking = false
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

				// Setting next player
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
		})

		e.Router.POST("/game/hold", func(c echo.Context) error {
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
			if stack[len(stack)-1][0] != 'w' && stack[len(stack)-1][0] != 'j' {
				return apis.NewBadRequestError("Previous card is not a wish card.", nil)
			}

			// Checking if color is valid
			color := c.Request().Header.Get("color")[0]
			if color != 'y' && color != 'g' && color != 'b' && color != 'p' {
				return apis.NewBadRequestError("Invalid card color.", nil)
			}

			// Update wish color
			stack[len(stack)-1] = string(stack[len(stack)-1][0]) + string(c.Request().Header.Get("color")[0])

			// Advancing turn
			next := nextPlayer(user.GetString("name"), players, rules)
			if next < 0 {
				return apis.NewApiError(500, "Couldn't evaluate next player.", err)
			}

			// Applying traits for next player
			players[next].Drawable = true
			if stack[len(stack)-1][0] == 'j' {
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
							cards = append(cards, stack[0])
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
		})

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

func nextPlayer(name string, players []Player, rules Rules) int {
	if rules.Direction {
		for i := 0; i < len(players); i++ {
			if players[i].Name == name {
				if i == len(players)-1 {
					return 0
				} else {
					return i + 1
				}
			}
		}
	} else {
		for i := len(players) - 1; i >= 0; i-- {
			if players[i].Name == name {
				if i == 0 {
					return len(players) - 1
				} else {
					return i - 1
				}
			}
		}
	}

	return -1
}

func resetCard(card string) string {
	if card[0] == 'j' || card[0] == 'w' {
		card = string(card[0]) + string('d')
	}

	return card
}
