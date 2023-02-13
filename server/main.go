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

type Player struct {
	Name   string `json:"name" xml:"name"`
	Cards  int    `json:"cards" xml:"cards"`
	Called bool   `json:"called" xml:"called"`
}

type Rules struct {
	Count  int  `json:"count" xml:"count"`
	Swap   bool `json:"swap" xml:"swap"`
	Rotate bool `json:"rotate" xml:"rotate"`
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

			err = app.Dao().SaveRecord(record)
			if err != nil {
				return apis.NewApiError(500, "Couldn't create player record.", err)
			}

			return c.JSON(http.StatusOK, Registration{Name: record.GetString("name"), Token: record.Id})
		})

		e.Router.POST("/session/create", func(c echo.Context) error {
			collection, err := app.Dao().FindCollectionByNameOrId("games")
			if err != nil {
				return apis.NewApiError(500, "Couldn't access game database.", err)
			}

			rules, err := json.Marshal(Rules{Count: 7, Swap: false, Rotate: false})
			if err != nil {
				return apis.NewApiError(500, "Couldn't generate default rules.", err)
			}

			record := models.NewRecord(collection)
			record.Set("code", ulid.Make().String())
			record.Set("rules", rules)

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
