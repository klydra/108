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
	Name   string `json:"name" xml:"name"`
	Cards  int    `json:"cards" xml:"cards"`
	Called bool   `json:"called" xml:"called"`
}

type Rules struct {
	Count     int  `json:"count" xml:"count"`
	Hole      bool `json:"hole" xml:"hole"`
	Stack2    bool `json:"stack2" xml:"stack2"`
	Stack4    bool `json:"stack4" xml:"stack4"`
	Swap      bool `json:"swap" xml:"swap"`
	Rotate    bool `json:"rotate" xml:"rotate"`
	Throw     bool `json:"throw" xml:"throw"`
	Unlimited bool `json:"unlimited" xml:"unlimited"`
	Ordered   bool `json:"ordered" xml:"ordered"`
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
	"pd", "pd", "pd", "pd",
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
			record.Set("cards", "[]")

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

			collection, err := app.Dao().FindCollectionByNameOrId("games")
			if err != nil {
				return apis.NewApiError(500, "Couldn't access game database.", err)
			}

			players, err := json.Marshal(Player{Name: user.GetString("name"), Cards: 0, Called: false})
			if err != nil {
				return apis.NewApiError(500, "Couldn't generate default rules.", err)
			}

			rules, err := json.Marshal(Rules{
				Count:     7,
				Hole:      false,
				Stack2:    false,
				Stack4:    false,
				Swap:      false,
				Rotate:    false,
				Throw:     false,
				Unlimited: false,
				Ordered:   false,
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
				return apis.NewApiError(500, "Couldn't create player record.", err)
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

				for i := 0; i < len(players); i++ {
					var hand []string

					for i := 0; i < rules.Count; i++ {
						index := rand.Intn(len(stack))
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
						index := rand.Intn(len(DECK))
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
			err = json.Unmarshal([]byte(user.GetString("cards")), &cards)
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

			index := rand.Intn(len(stack))
			card := stack[index]
			stack = append(stack[:index], stack[index+1:]...)

			cards = append(cards, card)

			for i := 0; i < len(players); i++ {
				if players[i].Name == user.GetString("name") {
					players[i].Cards = len(cards)
					break
				}
			}

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
				return apis.NewApiError(500, "Couldn't create player record.", err)
			}

			err = app.Dao().SaveRecord(user)
			if err != nil {
				return apis.NewApiError(500, "Couldn't create player record.", err)
			}

			return c.JSON(http.StatusOK, Hand{Cards: cards})
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
