package main

import (
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

type Player struct {
	Name string `json:"name" xml:"name"`
	Pass string `json:"pass" xml:"pass"`
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
		// or you can also use the shorter e.Router.GET("/articles/:slug", handler, middlewares...)
		e.Router.POST("/user/register", func(c echo.Context) error {
			collection, err := app.Dao().FindCollectionByNameOrId("players")
			if err != nil {
				return apis.NewApiError(500, "Couldn't access player database.", err)
			}

			name := ulid.Make().String()
			pass := ulid.Make().String()

			record := models.NewRecord(collection)
			record.Set("name", name)
			record.Set("pass", pass)

			err = app.Dao().SaveRecord(record)
			if err != nil {
				return apis.NewApiError(500, "Couldn't create player record.", err)
			}

			return c.JSON(http.StatusOK, Player{Name: name, Pass: pass})
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
