type GameType = {
  players: GamePlayer[];
  globals: GameGlobals;
  rules: GameRules;
  stack: string[];
};

type GamePlayer = {
  name: string;
  cards: number;
  called: boolean;
};

type GameGlobals = {
  live: string;
  direction: boolean;
  stacking: boolean;
  swapping: boolean;
  drawable: boolean;
};

type GameRules = {
  count: number;
  stack2: boolean;
  stack4: boolean;
  swap: boolean;
  throw: boolean;
  unlimited: boolean;
  ordered: boolean;
  hold: boolean;
  king: boolean;
  timeout: number;
};
