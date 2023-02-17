package main

import (
	"encoding/json"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/models"
)

// ---------------------------------------------------------------
// defaults
// ---------------------------------------------------------------

func defaultPlayer(name string) Player {
	return Player{
		Name:   name,
		Cards:  0,
		Called: false,
	}
}

func defaultPlayers(name string) string {
	players, _ := json.Marshal([]Player{defaultPlayer(name)})
	return string(players)
}

func defaultGlobals() string {
	globals, _ := json.Marshal(Globals{
		Live:      "",
		Direction: true,
		Stacking:  false,
		Swapping:  false,
		Drawable:  false,
	})
	return string(globals)
}

func defaultRules() string {
	rules, _ := json.Marshal(Rules{
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
	return string(rules)
}

func defaultJson() string {
	return "[{}]"
}

// ---------------------------------------------------------------
// structs to strings
// ---------------------------------------------------------------

func handFromStruct(stack []string) (string, *apis.ApiError) {
	marshalled, err := json.Marshal(stack)
	if err != nil {
		return "", apis.NewApiError(500, "Can't parse hand.", err)
	}
	return string(marshalled), nil
}

func playersFromStruct(players []Player) (string, *apis.ApiError) {
	marshalled, err := json.Marshal(players)
	if err != nil {
		return "", apis.NewApiError(500, "Can't parse players.", err)
	}
	return string(marshalled), nil
}

func rulesFromStruct(rules Rules) (string, *apis.ApiError) {
	marshalled, err := json.Marshal(rules)
	if err != nil {
		return "", apis.NewApiError(500, "Can't parse rules.", err)
	}
	return string(marshalled), nil
}

func globalsFromStruct(globals Globals) (string, *apis.ApiError) {
	marshalled, err := json.Marshal(globals)
	if err != nil {
		return "", apis.NewApiError(500, "Can't parse globals.", err)
	}
	return string(marshalled), nil
}

func stackFromStruct(stack []string) (string, *apis.ApiError) {
	marshalled, err := json.Marshal(stack)
	if err != nil {
		return "", apis.NewApiError(500, "Can't parse stack.", err)
	}
	return string(marshalled), nil
}

// ---------------------------------------------------------------
// records to structs
// ---------------------------------------------------------------

func handFromPlayer(game *models.Record) ([]string, *apis.ApiError) {
	var hand []string
	if err := json.Unmarshal([]byte(game.GetString("players")), &hand); err != nil {
		return nil, apis.NewApiError(500, "Can't parse hand.", err)
	}
	return hand, nil
}

func playersFromGame(game *models.Record) ([]Player, *apis.ApiError) {
	var players []Player
	if err := json.Unmarshal([]byte(game.GetString("players")), &players); err != nil {
		return nil, apis.NewApiError(500, "Can't parse players.", err)
	}
	return players, nil
}

func rulesFromGame(game *models.Record) (Rules, *apis.ApiError) {
	var rules Rules
	if err := json.Unmarshal([]byte(game.GetString("rules")), &rules); err != nil {
		return Rules{}, apis.NewApiError(500, "Can't parse rules.", err)
	}
	return rules, nil
}

func globalsFromGame(game *models.Record) (Globals, *apis.ApiError) {
	var globals Globals
	if err := json.Unmarshal([]byte(game.GetString("globals")), &globals); err != nil {
		return Globals{}, apis.NewApiError(500, "Can't parse globals.", err)
	}
	return globals, nil
}

func stackFromGame(game *models.Record) ([]string, *apis.ApiError) {
	var stack []string
	if err := json.Unmarshal([]byte(game.GetString("stack")), &stack); err != nil {
		return nil, apis.NewApiError(500, "Can't parse stack.", err)
	}
	return stack, nil
}

// ---------------------------------------------------------------
// retrieve collections
// ---------------------------------------------------------------

func getPlayers(app *pocketbase.PocketBase) (*models.Collection, *apis.ApiError) {
	players, err := app.Dao().FindCollectionByNameOrId("players")
	if err != nil {
		return nil, apis.NewApiError(500, "Can't access player database.", err)
	}
	return players, nil
}

func getGames(app *pocketbase.PocketBase) (*models.Collection, *apis.ApiError) {
	games, err := app.Dao().FindCollectionByNameOrId("games")
	if err != nil {
		return nil, apis.NewApiError(500, "Can't access game database.", err)
	}
	return games, nil
}

// ---------------------------------------------------------------
// retrieve records
// ---------------------------------------------------------------

func getPlayerRecordByToken(app *pocketbase.PocketBase, token string) (*models.Record, *apis.ApiError) {
	player, err := app.Dao().FindRecordById("players", token)
	if err != nil {
		return nil, apis.NewBadRequestError("Can't find player.", err)
	}
	return player, nil
}

func getPlayerRecordByName(app *pocketbase.PocketBase, name string) (*models.Record, *apis.ApiError) {
	player, err := app.Dao().FindFirstRecordByData("players", "name", name)
	if err != nil {
		return nil, apis.NewBadRequestError("Can't find player.", err)
	}
	return player, nil
}

func getGameRecordByCode(app *pocketbase.PocketBase, code string) (*models.Record, *apis.ApiError) {
	game, err := app.Dao().FindRecordById("games", code)
	if err != nil {
		return nil, apis.NewBadRequestError("Can't find game.", err)
	}
	return game, nil
}

// ---------------------------------------------------------------
// save records
// ---------------------------------------------------------------

func savePlayer(app *pocketbase.PocketBase, player *models.Record) *apis.ApiError {
	if err := app.Dao().SaveRecord(player); err != nil {
		return apis.NewApiError(500, "Can't save player record.", err)
	}
	return nil
}

func saveGame(app *pocketbase.PocketBase, game *models.Record) *apis.ApiError {
	if err := app.Dao().SaveRecord(game); err != nil {
		return apis.NewApiError(500, "Can't save game record.", err)
	}
	return nil
}

// ---------------------------------------------------------------
// delete records
// ---------------------------------------------------------------

func deletePlayer(app *pocketbase.PocketBase, player *models.Record) *apis.ApiError {
	if err := app.Dao().DeleteRecord(player); err != nil {
		return apis.NewApiError(500, "Can't delete player record.", err)
	}
	return nil
}

func deleteGame(app *pocketbase.PocketBase, game *models.Record) *apis.ApiError {
	if err := app.Dao().DeleteRecord(game); err != nil {
		return apis.NewApiError(500, "Can't delete game record.", err)
	}
	return nil
}
