package main

import (
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/models"
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
	if globals.Direction {
		for i := 0; i < len(players); i++ {
			if players[i].Name == name {
				if i == len(players)-1 {
					return 0, nil
				} else {
					return i + 1, nil
				}
			}
		}
	} else {
		for i := len(players) - 1; i >= 0; i-- {
			if players[i].Name == name {
				if i == 0 {
					return len(players) - 1, nil
				} else {
					return i - 1, nil
				}
			}
		}
	}

	return -1, apis.NewApiError(500, "Could not evaluate next player.", nil)
}

func resetCard(card string) string {
	if card[0] == 'j' || card[0] == 'w' {
		card = string(card[0]) + string('d')
	}

	return card
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
	if globals.Live == player.GetString("name") {
		return apis.NewBadRequestError("You are not the host.", nil)
	}
	return nil
}
