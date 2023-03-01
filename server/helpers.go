package main

import (
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/models"
	"math/rand"
)

// ---------------------------------------------------------------
// Find methods
// ---------------------------------------------------------------

func playerStructByName(name string, players []Player) (Player, *apis.ApiError) {
	for i := 0; i < len(players); i++ {
		if players[i].Name == name {
			return players[i], nil
		}
	}
	return Player{}, apis.NewApiError(500, "Can't find player in struct.", nil)
}

func playerIndexByName(name string, players []Player) (int, *apis.ApiError) {
	for i := 0; i < len(players); i++ {
		if players[i].Name == name {
			return i, nil
		}
	}
	return -1, apis.NewApiError(500, "Can't find player in struct.", nil)
}

func nextPlayer(name string, players []Player, globals Globals) (int, *apis.ApiError) {
	index, err := playerIndexByName(name, players)
	if err != nil {
		return -1, nil
	}

	if globals.Direction {
		if index == len(players)-1 {
			if players[0].Cards == 0 {
				return nextPlayer(players[0].Name, players, globals)
			} else {
				return 0, nil
			}
		} else {
			if players[index+1].Cards == 0 {
				return nextPlayer(players[index+1].Name, players, globals)
			} else {
				return index + 1, nil
			}
		}
	} else {
		if index == 0 {
			if players[len(players)-1].Cards == 0 {
				return nextPlayer(players[len(players)-1].Name, players, globals)
			} else {
				return len(players) - 1, nil
			}
		} else {
			if players[index-1].Cards == 0 {
				return nextPlayer(players[index-1].Name, players, globals)
			} else {
				return index - 1, nil
			}
		}
	}
}

func resetCard(card string) string {
	if card[0] == 'j' || card[0] == 'w' {
		card = string(card[0]) + string('d')
	}

	return card
}

func randomCard() string {
	return DECK[rand.Intn(len(DECK)-1)]
}

func participating(player *models.Record) *apis.ApiError {
	if len(player.GetString("game")) == 0 {
		return apis.NewBadRequestError("You are not participating in this game.", nil)
	}
	return nil
}

func hosting(player *models.Record, players []Player) *apis.ApiError {
	if players[0].Name != player.GetString("name") {
		return apis.NewBadRequestError("You are not the host.", nil)
	}
	return nil
}

func playing(player *models.Record, globals Globals) *apis.ApiError {
	if globals.Live != player.GetString("name") {
		return apis.NewBadRequestError("It's not your turn.", nil)
	}
	return nil
}

func resetPlayers(app *pocketbase.PocketBase, players []Player) ([]Player, *apis.ApiError) {
	for i := 0; i < len(players); i++ {
		players[i].Called = false
		players[i].Cards = 0

		player, err := getPlayerRecordByName(app, players[i].Name)
		if err != nil {
			return nil, err
		}

		player.Set("hand", defaultJson())

		if err := savePlayer(app, player); err != nil {
			return nil, err
		}
	}
	return players, nil
}
