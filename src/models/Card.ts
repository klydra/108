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
  order?: number | undefined;
};

function codeToFace(card: string) {
  switch (card.charAt(0)) {
    default:
    case "0":
      return CardFace.NUMBER_0;
    case "1":
      return CardFace.NUMBER_1;
    case "2":
      return CardFace.NUMBER_2;
    case "3":
      return CardFace.NUMBER_3;
    case "4":
      return CardFace.NUMBER_4;
    case "5":
      return CardFace.NUMBER_5;
    case "6":
      return CardFace.NUMBER_6;
    case "7":
      return CardFace.NUMBER_7;
    case "8":
      return CardFace.NUMBER_8;
    case "9":
      return CardFace.NUMBER_9;
    case "b":
      return CardFace.BLOCK;
    case "d":
      return CardFace.DIRECTION_CHANGE;
    case "w":
      return CardFace.WISH;
    case "p":
      return CardFace.PLUS_2;
    case "j":
      return CardFace.WISH_PLUS_4;
  }
}

function codeToColor(card: string) {
  switch (card.charAt(1)) {
    default:
    case "d":
      return CardColor.DARK;
    case "y":
      return CardColor.YELLOW;
    case "g":
      return CardColor.GREEN;
    case "b":
      return CardColor.BLUE;
    case "p":
      return CardColor.PURPLE;
  }
}

export function codeToType(card: string) {
  const face = codeToFace(card);
  const color = codeToColor(card);

  const faceOrder = Object.values(CardFace).findIndex(
    (value) => value === face
  );
  const colorOrder = Object.values(CardColor).findIndex(
    (value) => value === color
  );

  return {
    face,
    color,
    order: Object.keys(CardColor).length * colorOrder + faceOrder,
  } as CardType;
}

export function typeToCode(card: CardType) {
  return card.face + card.color;
}

export function colorToString(color: CardColor) {
  switch (color) {
    case CardColor.YELLOW:
      return "yellow";
    case CardColor.GREEN:
      return "green";
    case CardColor.BLUE:
      return "blue";
    case CardColor.PURPLE:
      return "purple";
    case CardColor.DARK:
      return "dark";
  }
}
