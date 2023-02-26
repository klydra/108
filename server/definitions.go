package main

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

type Globals struct {
	Live      string `json:"live" xml:"live"`
	Direction bool   `json:"direction" xml:"direction"` // Direction of turns of players (true is clockwise)
	Stacking  bool   `json:"stacking" xml:"stacking"`
	Swapping  bool   `json:"swapping" xml:"swapping"`
	Drawable  bool   `json:"drawable" xml:"drawable"`
}

type Rules struct {
	Count      int  `json:"count" xml:"count"`           // Number of cards every player gets at start
	Stack2     bool `json:"stack2" xml:"stack2"`         // Draw 2 cards are stackable
	Stack4     bool `json:"stack4" xml:"stack4"`         // Draw 4 cards are stackable
	Swap       bool `json:"swap" xml:"swap"`             // Players select who to swap hands with when a 7 is played
	Throw      bool `json:"throw" xml:"throw"`           // Players can throw identical cards in anytime
	Unlimited  bool `json:"unlimited" xml:"unlimited"`   // Players draw until card is playable
	Ordered    bool `json:"ordered" xml:"ordered"`       // Players draw from bottom of stack
	Bottomless bool `json:"bottomless" xml:"bottomless"` // There is no deck
	Hold       bool `json:"hold" xml:"hold"`             // Players can hold matching card after drawn
	King       bool `json:"king" xml:"king"`             // Game ends when the first player is finished
	Timeout    int  `json:"timeout" xml:"timeout"`       // Time each player has to take his turn (seconds)
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
