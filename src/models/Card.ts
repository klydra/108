export enum CardColor {
  YELLOW = "y",
  GREEN = "g",
  BLUE = "b",
  PURPLE = "p",
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
  BLOCK = "d",
  DIRECTION_CHANGE = "d",
  WISH = "w",
  PLUS_2 = "p2",
  WISH_PLUS_4 = "p4",
}

export enum CardIconWeight {
  INNER,
  OUTER,
}

export type CardType = {
  color: CardColor;
  face: CardFace;
};
