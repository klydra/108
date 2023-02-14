package main

import (
	"encoding/json"
	"github.com/labstack/echo/v5"
	"github.com/oklog/ulid/v2"
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

type Registration struct {
	Name  string `json:"name" xml:"name"`
	Token string `json:"token" xml:"token"`
}

type Session struct {
	Code string `json:"code" xml:"code"`
}

type Hand struct {
	Cards []string `json:"cards" xml:"cards"`
}

type Player struct {
	Name     string `json:"name" xml:"name"`
	Cards    int    `json:"cards" xml:"cards"`
	Called   bool   `json:"called" xml:"called"`
	Drawing  bool   `json:"drawing" xml:"drawing"`
	Swapping bool   `json:"switching" xml:"switching"`
}

type Rules struct {
	Direction bool `json:"direction" xml:"direction"` // Direction of turns of players (true is clockwise)
	Count     int  `json:"count" xml:"count"`         // Number of cards every player gets at start
	Stack2    bool `json:"stack2" xml:"stack2"`       // Draw 2 cards are stackable
	Stack4    bool `json:"stack4" xml:"stack4"`       // Draw 4 cards are stackable
	Swap      bool `json:"swap" xml:"swap"`           // Players selects who to swap hands with when a 7 is played
	Throw     bool `json:"throw" xml:"throw"`         // Players can throw identical cards in anytime
	Unlimited bool `json:"unlimited" xml:"unlimited"` // Players draw until card is playable
	Ordered   bool `json:"ordered" xml:"ordered"`     // Players draw from bottom of stack
	Hold      bool `json:"hold" xml:"hold"`           // Players can hold matching card after drawn
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

	app.RootCmd.ParseFlags(os.Args[1:])

	// ---------------------------------------------------------------
	// Custom routes:
	// ---------------------------------------------------------------

	app.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		// Attention: API safety checks intentionally removed to save on resources in enclosed system

		e.Router.POST("/user/register", func(c echo.Context) error {
			collection, err := app.Dao().FindCollectionByNameOrId("players")
			if err != nil {
				return apis.NewApiError(500, "Couldn't access player database.", err)
			}

			record := models.NewRecord(collection)
			record.Set("name", ulid.Make().String())
			record.Set("hand", "[]")

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
				return apis.NewBadRequestError("Couldn't find user.", err)
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
				Drawing:  false,
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

			record := models.NewRecord(collection)
			record.Set("code", ulid.Make().String())
			record.Set("players", players)
			record.Set("rules", rules)
			record.Set("stack", "[]")

			err = app.Dao().SaveRecord(record)
			if err != nil {
				return apis.NewApiError(500, "Couldn't create game record.", err)
			}

			return c.JSON(http.StatusOK, Session{Code: record.GetString("code")})
		})

		e.Router.POST("/session/join", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Couldn't find user.", err)
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

				// Remove ongoing game from player
				user.Set("game", "")
				err = app.Dao().SaveRecord(user)
				if err != nil {
					return apis.NewApiError(500, "Couldn't update player game.", err)
				}
			}

			// Retrieve target game to join
			game, err := app.Dao().FindFirstRecordByData("games", "code", c.Request().Header.Get("code"))
			if err != nil {
				return apis.NewBadRequestError("Couldn't find game.", err)
			}

			var players []string
			err = json.Unmarshal([]byte(game.GetString("players")), &players)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get players for game.", err)
			}

			// Adding player to game
			updated, err := json.Marshal(append(players, user.GetString("name")))
			if err != nil {
				return apis.NewApiError(500, "Couldn't generate game update request.", err)
			}

			game.Set("players", updated)
			err = app.Dao().SaveRecord(game)
			if err != nil {
				return apis.NewApiError(500, "Couldn't add player to game.", err)
			}

			return c.NoContent(http.StatusOK)
		})

		e.Router.POST("/session/start", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Couldn't find user.", err)
			}

			if len(user.GetString("game")) == 0 {
				return apis.NewBadRequestError("User not participating in game.", err)
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

			if !rules.Unlimited {
				give := len(players) * rules.Count
				var stack []string

				for give*2 < len(stack) {
					stack = append(stack, DECK...)
				}

				rand.Shuffle(len(stack), func(i, j int) { stack[i], stack[j] = stack[j], stack[i] })

				for i := 0; i < len(players); i++ {
					var hand []string

					for i := 0; i < rules.Count; i++ {
						index := rand.Intn(len(stack) - 1)
						hand = append(hand, stack[index])
						stack = append(stack[:index], stack[index+1:]...)
					}

					user, err := app.Dao().FindFirstRecordByData("users", "name", players[i].Name)
					if err != nil {
						return apis.NewApiError(500, "Couldn't retrieve player "+players[i].Name+".", err)
					}

					cards, err := json.Marshal(append(players[:i], players[i+1:]...))
					if err != nil {
						return apis.NewApiError(500, "Couldn't generate player hand update.", err)
					}

					user.Set("hand", cards)
					err = app.Dao().SaveRecord(user)
					if err != nil {
						return apis.NewApiError(500, "Couldn't assign player hand.", err)
					}
				}
			} else {
				for i := 0; i < len(players); i++ {
					var hand []string

					for i := 0; i < rules.Count; i++ {
						index := rand.Intn(len(DECK) - 1)
						hand = append(hand, DECK[index])
					}

					user, err := app.Dao().FindFirstRecordByData("users", "name", players[i].Name)
					if err != nil {
						return apis.NewApiError(500, "Couldn't retrieve player "+players[i].Name+".", err)
					}

					cards, err := json.Marshal(append(players[:i], players[i+1:]...))
					if err != nil {
						return apis.NewApiError(500, "Couldn't generate player hand update.", err)
					}

					user.Set("hand", cards)
					err = app.Dao().SaveRecord(user)
					if err != nil {
						return apis.NewApiError(500, "Couldn't assign player hand.", err)
					}
				}
			}

			game.Set("live", user.GetString("name"))
			err = app.Dao().SaveRecord(game)
			if err != nil {
				return apis.NewApiError(500, "Couldn't start game.", err)
			}

			return c.NoContent(http.StatusOK)
		})

		e.Router.POST("/session/rules", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Couldn't find user.", err)
			}

			if len(user.GetString("game")) == 0 {
				return apis.NewBadRequestError("User not participating in game.", err)
			}

			game, err := app.Dao().FindRecordById("games", user.GetString("game"))
			if err != nil {
				return apis.NewBadRequestError("User not participating in game.", err)
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

			return c.NoContent(http.StatusOK)
		})

		e.Router.POST("/session/leave", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Couldn't find user.", err)
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

				// Remove ongoing game from player
				user.Set("game", "")
				err = app.Dao().SaveRecord(user)
				if err != nil {
					return apis.NewApiError(500, "Couldn't update player game.", err)
				}
			}

			return c.NoContent(http.StatusOK)
		})

		e.Router.POST("/session/ongoing", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Couldn't find user.", err)
			}

			if len(user.GetString("game")) == 0 {
				return apis.NewBadRequestError("User not participating in game.", err)
			}

			game, err := app.Dao().FindRecordById("games", user.GetString("game"))
			if err != nil {
				return apis.NewBadRequestError("User participating in absent game.", err)
			}

			return c.JSON(http.StatusOK, Session{Code: game.Id})
		})

		e.Router.POST("/session/hand", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Couldn't find user.", err)
			}

			var cards []string
			err = json.Unmarshal([]byte(user.GetString("hand")), &cards)
			if err != nil {
				return apis.NewApiError(500, "Couldn't get player hand.", err)
			}

			return c.JSON(http.StatusOK, Hand{Cards: cards})
		})

		e.Router.POST("/game/draw", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Couldn't find user.", err)
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

			if stack[len(stack)-1][0] == 'p' {
				// Drawing 2 * n cards
				if rules.Stack2 {
					stacked := 1
					for stack[len(stack)-stacked][0] == 'p' {
						stacked++
					}

					index := stacked*2 + 1
					cards = append(cards, stack[index:]...)
					stack = append(stack[:index])
				} else {
					index := len(stack) - 3
					cards = append(cards, stack[index:]...)
					stack = append(stack[:index])
				}
			} else if stack[len(stack)-1][0] == 'j' {
				// Drawing 4 * n cards
				if rules.Stack4 {
					stacked := 1
					for stack[len(stack)-stacked][0] == 'p' {
						stacked++
					}

					index := stacked*4 + 1
					cards = append(cards, stack[index:]...)
					stack = append(stack[:index])
				} else {
					index := len(stack) - 5
					cards = append(cards, stack[index:]...)
					stack = append(stack[:index])
				}
			} else if rules.Unlimited {
				// Drawing 1 card and then continue to draw until playable
				if rules.Ordered {
					cards = append(cards, stack[0])
					stack = append(stack, stack[1:]...)

					for len(stack) > 1 && cards[len(cards)-1][1] != stack[len(stack)-1][1] {
						cards = append(cards, stack[0])
						stack = append(stack, stack[1:]...)
					}
				} else {
					index := rand.Intn(len(stack) - 2)
					cards = append(cards, stack[index])
					stack = append(stack[:index], stack[index+1:]...)

					for len(stack) > 1 && cards[len(cards)-1][1] != stack[len(stack)-1][1] {
						index := rand.Intn(len(stack) - 2)
						cards = append(cards, stack[index])
						stack = append(stack[:index], stack[index+1:]...)
					}
				}
			} else {
				// Drawing 1 card
				if rules.Ordered {
					cards = append(cards, stack[0])
					stack = append(stack, stack[1:]...)
				} else {
					index := rand.Intn(len(stack) - 2)
					cards = append(cards, stack[index])
					stack = append(stack[:index], stack[index+1:]...)
				}
			}

			// Saving card to arrays and setting player state
			for i := 0; i < len(players); i++ {
				if players[i].Name == user.GetString("name") {
					players[i].Cards = len(cards)
					players[i].Drawing = false
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
			user.Set("stack", cardsUpdate)

			err = app.Dao().SaveRecord(game)
			if err != nil {
				return apis.NewApiError(500, "Couldn't update game record.", err)
			}

			err = app.Dao().SaveRecord(user)
			if err != nil {
				return apis.NewApiError(500, "Couldn't update player record.", err)
			}

			return c.JSON(http.StatusOK, Hand{Cards: cards})
		})

		e.Router.POST("/game/play", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Couldn't find user.", err)
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
				return apis.NewBadRequestError("It's not the user's turn.", nil)
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
				return apis.NewBadRequestError("Card not in player possession.", nil)
			}
			card := cards[index]

			// Checking if previous card is placeholder and removing
			if stack[len(stack)-1][0] == 'n' {
				stack = cards[:len(stack)-1]
			}

			// Checking if previous card requires draw
			if (stack[len(stack)-1][0] == 'p' && card[0] != 'p') || (stack[len(stack)-1][0] == 'p' && !rules.Stack2) {
				return apis.NewBadRequestError("Card cannot be stacked.", nil)
			}
			if (stack[len(stack)-1][0] == 'j' && card[0] != 'j') || (stack[len(stack)-1][0] == 'j' && !rules.Stack2) {
				return apis.NewBadRequestError("Card cannot be stacked.", nil)
			}

			// Checking if card is wish or if previous card has matching color
			if card[0] != 'w' && card[0] != 'j' && stack[len(stack)-1][1] != card[1] {
				return apis.NewBadRequestError("Card color not matching.", nil)
			}

			// Saving card to arrays and setting player state
			cards = append(cards[:index], cards[index+1:]...)
			stack = append(stack, card)
			for i := 0; i < len(players); i++ {
				if players[i].Name == user.GetString("name") {
					players[i].Cards = len(cards)
					players[i].Drawing = false
					if len(cards) > 1 {
						players[i].Called = false
					}
					if card[0] == '7' && rules.Swap {
						players[i].Swapping = true
					}
					break
				}
			}

			// If player action isn't pending, assigning next player
			if card[0] == 'j' || card[0] == 'w' || (card[0] == '7' && rules.Swap) {
				next := nextPlayer(user.GetString("name"), players, rules)
				if next < 0 {
					return apis.NewApiError(500, "Couldn't evaluate next player.", err)
				}
				if card[0] == 'b' {
					next = nextPlayer(players[next].Name, players, rules)
					if next < 0 {
						return apis.NewApiError(500, "Couldn't evaluate next player.", err)
					}
				}
				game.Set("live", players[next])
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

			return c.JSON(http.StatusOK, Hand{Cards: cards})
		})

		e.Router.POST("/game/hold", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Couldn't find user.", err)
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
				return apis.NewBadRequestError("It's not the user's turn.", nil)
			}

			// Update drawing status
			for i := 0; i < len(players); i++ {
				if players[i].Name == user.GetString("name") {
					if !players[i].Drawing {
						return apis.NewBadRequestError("User is not currently drawing.", err)
					}

					players[i].Drawing = false
					break
				}
			}

			// Shifting turn to next player
			next := nextPlayer(user.GetString("name"), players, rules)
			if next < 0 {
				return apis.NewApiError(500, "Couldn't evaluate next player.", err)
			}
			game.Set("live", players[next])

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

			return c.JSON(http.StatusOK, Hand{Cards: cards})
		})

		e.Router.POST("/game/wish", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Couldn't find user.", err)
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
				return apis.NewBadRequestError("It's not the user's turn.", nil)
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
				return apis.NewBadRequestError("Card not in player possession.", nil)
			}
			card := cards[index]

			cards = append(cards[:index], cards[index+1:]...)
			stack = append(stack, card)

			for i := 0; i < len(players); i++ {
				if players[i].Name == user.GetString("name") {
					players[i].Cards = len(cards)
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

			return c.JSON(http.StatusOK, Hand{Cards: cards})
		})

		e.Router.POST("/game/call", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Couldn't find user.", err)
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
				return apis.NewBadRequestError("It's not the user's turn.", nil)
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

			return c.JSON(http.StatusOK, Hand{Cards: cards})
		})

		e.Router.POST("/game/appeal", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Couldn't find user.", err)
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
					for len(stack) > 1 && draw > 0 {
						if rules.Ordered {
							cards = append(cards, stack[0])
							stack = append(stack, stack[1:]...)
						} else {
							index := rand.Intn(len(stack) - 2)
							cards = append(cards, stack[index])
							stack = append(stack[:index], stack[index+1:]...)
						}
						draw--
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

			return c.JSON(http.StatusOK, Hand{Cards: cards})
		})

		e.Router.POST("/game/switch", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Couldn't find user.", err)
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
				return apis.NewBadRequestError("It's not the user's turn.", nil)
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

			// Update game cards
			var cards1 int
			var cards2 int
			for i := 0; i < len(players); i++ {
				if players[i].Name == user.GetString("player") {
					cards1 = players[i].Cards
				}
				if players[i].Name == user.GetString("name") {
					cards2 = players[i].Cards
				}
			}
			for i := 0; i < len(players); i++ {
				if players[i].Name == user.GetString("player") {
					players[i].Cards = cards2
				}
				if players[i].Name == user.GetString("name") {
					players[i].Cards = cards1
				}
			}

			// Update hands
			hand1 := user.GetString("hand")
			hand2 := player.GetString("hand")
			user.Set("hand", hand2)
			user.Set("hand", hand1)

			// Shifting turn
			next := nextPlayer(user.GetString("name"), players, rules)
			if next < 0 {
				return apis.NewApiError(500, "Couldn't evaluate next player.", err)
			}
			game.Set("live", players[next])

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

			return c.NoContent(http.StatusOK)
		})

		e.Router.POST("/game/timeout", func(c echo.Context) error {
			// Retrieve target user
			user, err := app.Dao().FindRecordById("players", c.Request().Header.Get("token"))
			if err != nil {
				return apis.NewBadRequestError("Couldn't find user.", err)
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
			player.Set("hand", "[]")

			// Shifting turn if it was the player's turn
			if game.GetString("live") == player.GetString("name") {
				next := nextPlayer(user.GetString("name"), players, rules)
				if next < 0 {
					return apis.NewApiError(500, "Couldn't evaluate next player.", err)
				}
				game.Set("live", players[next])
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
			player.Set("hand", "[]")

			err = app.Dao().SaveRecord(game)
			if err != nil {
				return apis.NewApiError(500, "Couldn't update game record.", err)
			}

			err = app.Dao().SaveRecord(player)
			if err != nil {
				return apis.NewApiError(500, "Couldn't update player record.", err)
			}

			return c.NoContent(http.StatusOK)
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
		for i := len(players); i >= 0; i-- {
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
