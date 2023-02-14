type GameType = {
  players: GamePlayer[];
  live: string;
  rules: GameRules;
  stack: string[];
};

type GamePlayer = {
  name: string;
  cards: number;
  called: boolean;
  drawing: boolean;
  swapping: boolean;
};

type GameRules = {
  direction: boolean;
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
