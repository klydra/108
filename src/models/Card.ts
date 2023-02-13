export enum CardColor {
  YELLOW = "yellow",
  GREEN = "green",
  BLUE = "blue",
  PURPLE = "purple",
}

export enum CardFace {
  NUMBER_0 = "0",
  NUMBER_1 = "1",
  NUMBER_2 = "2",
  NUMBER_3 = "3",
  NUMBER_4 = "4",
  NUMBER_5 = "5",
  NUMBER_6 = "6",
  NUMBER_7 = "7",
  NUMBER_8 = "8",
  NUMBER_9 = "9",
  BLOCK = "block",
  DIRECTION_CHANGE = "direction",
  WISH = "wish",
  PLUS_2 = "plus2",
  WISH_PLUS_4 = "plus4",
}

export enum CardIconWeight {
  INNER,
  OUTER,
}

export type CardType = {
  color: CardColor;
  face: CardFace;
};