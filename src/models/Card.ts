export enum CardColor {
  YELLOW = "y",
  GREEN = "g",
  BLUE = "b",
  PURPLE = "p",
  DARK = "d",
}

/* Wish cards and +4 cards have the default color of dark, but will be added to the stack with the color wished for */

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
  BLOCK = "b",
  DIRECTION_CHANGE = "d",
  WISH = "w",
  PLUS_2 = "p",
  WISH_PLUS_4 = "j",
}

export enum CardIconWeight {
  INNER,
  OUTER,
}

export type CardType = {
  color: CardColor;
  face: CardFace;
};
