package main

import "github.com/pocketbase/pocketbase/apis"

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

func nextPlayer(name string, players []Player, globals Globals) int {
	if globals.Direction {
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
