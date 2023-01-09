export enum CardColor {
  YELLOW,
  GREEN,
  BLUE,
  PURPLE,
}

export enum CardFace {
  NUMBER_0,
  NUMBER_1,
  NUMBER_2,
  NUMBER_3,
  NUMBER_4,
  NUMBER_5,
  NUMBER_6,
  NUMBER_7,
  NUMBER_8,
  NUMBER_9,
  BLOCK,
  DIRECTION_CHANGE,
  WISH,
  PLUS_2,
  WISH_PLUS_4,
}

export type CardType = {
  color: CardColor
  face: CardFace
}