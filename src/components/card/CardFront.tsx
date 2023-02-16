import React from "react";
import {
  CardColor,
  CardFace,
  CardIconWeight,
  CardType,
} from "../../models/Card";

export default function CardFront(props: { card: CardType }) {
  switch (props.card.face) {
    case CardFace.WISH:
    case CardFace.WISH_PLUS_4:
      return <WishCard card={props.card} />;

    default:
      return <Card card={props.card} />;
  }
}

function color(color: CardColor) {
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

function Card(props: { card: CardType }) {
  return (
    <>
      <div className="select-none overflow-hidden h-52 min-h-fit min-w-fit aspect-[9/16] rounded-2xl p-0.5 bg-card-accent">
        {/* Top of card */}
        <div
          className={
            "w-full h-[14%] -mb-[1%] rounded-t-[0.9rem] bg-card-" +
            color(props.card.color)
          }
        >
          <div className="pr-1.5 pt-1 flex justify-end items-start w-full h-full text-background leading-none">
            <CardIcon face={props.card.face} weight={CardIconWeight.OUTER} />
          </div>
        </div>
        {/* Center ellipsis */}
        <div
          className={
            "flex justify-center items-center w-full h-[74%] bg-card-" +
            color(props.card.color)
          }
        >
          <div className="-rotate-card-angle rounded-card-inner flex justify-center items-center p-[0.2rem] bg-card-accent flex justify-center items-center w-[85%] h-[115%]">
            <div className="w-full h-full rounded-card-inner bg-card-inner">
              <div className="rotate-card-angle flex justify-center items-center w-full h-full">
                <CardIcon
                  face={props.card.face}
                  weight={CardIconWeight.INNER}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Bottom of card */}
        <div
          className={
            "w-full h-[14%] -mt-[1%] rounded-b-[0.9rem] bg-card-" +
            color(props.card.color)
          }
        >
          <div className="pl-1.5 pb-1 flex justify-start items-end w-full h-full">
            <CardIcon face={props.card.face} weight={CardIconWeight.OUTER} />
          </div>
        </div>
        {/* Preload bg-classes at compile time */}
      </div>
      {/* Preload bg-classes at compile time */}
      <div className="hidden bg-card-yellow bg-card-green bg-card-blue bg-card-purple"></div>
    </>
  );
}

function CardIcon(props: { face: CardFace; weight: CardIconWeight }) {
  switch (props.face) {
    case CardFace.PLUS_2:
      return <Plus content="+2" weight={props.weight} />;

    case CardFace.WISH_PLUS_4:
      return <Plus content="+4" weight={props.weight} />;

    case CardFace.BLOCK:
      return <Block weight={props.weight} />;

    case CardFace.DIRECTION_CHANGE:
      return <DirectionChange weight={props.weight} />;

    case CardFace.WISH:
      return <Wish weight={props.weight} />;

    default:
      return <Number content={props.face} weight={props.weight} />;
  }
}

function WishCard(props: { card: CardType }) {
  return (
    <>
      <div className="select-none overflow-hidden h-52 min-h-fit min-w-fit aspect-[9/16] rounded-2xl p-0.5 bg-card-accent">
        <div className="relative w-full h-full">
          <div className="absolute grid grid-cols-2 grid-rows-2 gap-0 h-full w-full rounded-[0.9rem]">
            <div
              className={
                "w-full h-full rounded-tl-[0.9rem] " +
                (props.card.color === CardColor.DARK
                  ? "bg-card-yellow"
                  : "bg-card-" + color(props.card.color))
              }
            ></div>
            <div
              className={
                "w-full h-full rounded-tr-[0.9rem] " +
                (props.card.color === CardColor.DARK
                  ? "bg-card-purple"
                  : "bg-card-" + color(props.card.color))
              }
            ></div>
            <div
              className={
                "w-full h-full rounded-bl-[0.9rem] " +
                (props.card.color === CardColor.DARK
                  ? "bg-card-blue"
                  : "bg-card-" + color(props.card.color))
              }
            ></div>
            <div
              className={
                "w-full h-full rounded-br-[0.9rem] " +
                (props.card.color === "d"
                  ? "bg-card-green"
                  : "bg-card-" + color(props.card.color))
              }
            ></div>
          </div>
          <div className="absolute h-full w-full">
            <div className="w-full h-[14%] -mb-[1%] rounded-t-[0.9rem]">
              <div className="font-card text-[1.5rem] pr-1.5 pt-1 flex justify-end items-start w-full h-full text-background leading-none">
                <CardIcon
                  face={props.card.face}
                  weight={CardIconWeight.OUTER}
                />
              </div>
            </div>
            <div className="flex justify-center items-center w-full h-[74%]">
              <div className="-rotate-card-angle rounded-card-inner flex justify-center items-center bg-card-accent p-[0.2rem] flex justify-center items-center w-[85%] h-[115%]">
                <div className="w-full h-full rounded-card-inner bg-card-inner">
                  <div className="rotate-card-angle flex justify-center items-center w-full h-full">
                    <CardIcon
                      face={props.card.face}
                      weight={CardIconWeight.INNER}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full h-[14%] -mt-[1%] rounded-b-[0.9rem]">
              <div className="pl-1.5 pb-1 flex justify-start items-end w-full h-full">
                <CardIcon
                  face={props.card.face}
                  weight={CardIconWeight.OUTER}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Preload bg-classes at compile time */}
      <div className="hidden bg-card-yellow bg-card-green bg-card-blue bg-card-purple"></div>
    </>
  );
}

function Number(props: { content: string; weight: CardIconWeight }) {
  switch (props.weight) {
    case CardIconWeight.OUTER:
      return (
        <p className="font-card text-[1.5rem] text-background leading-none">
          {props.content}
        </p>
      );
    case CardIconWeight.INNER:
      return (
        <p className="font-card text-[7rem] text-background leading-none">
          {props.content}
        </p>
      );
  }
}

function Plus(props: { content: string; weight: CardIconWeight }) {
  switch (props.weight) {
    case CardIconWeight.OUTER:
      return (
        <p className="font-card my-[0.04rem] text-[1.4rem] text-background leading-none">
          {props.content}
        </p>
      );
    case CardIconWeight.INNER:
      return (
        <p className="font-card text-[4.3rem] text-background leading-none">
          {props.content}
        </p>
      );
  }
}

function Wish(props: { weight: CardIconWeight }) {
  switch (props.weight) {
    case CardIconWeight.INNER:
      return (
        <svg
          className="w-16 h-16"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
        >
          <path
            className="fill-card-symbol"
            d="M512 256c0 .9 0 1.8 0 2.7c-.4 36.5-33.6 61.3-70.1 61.3H344c-26.5 0-48 21.5-48 48c0 3.4 .4 6.7 1 9.9c2.1 10.2 6.5 20 10.8 29.9c6.1 13.8 12.1 27.5 12.1 42c0 31.8-21.6 60.7-53.4 62c-3.5 .1-7 .2-10.6 .2C114.6 512 0 397.4 0 256S114.6 0 256 0S512 114.6 512 256zM128 288a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm0-96a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM288 96a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm96 96a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"
          />
        </svg>
      );

    case CardIconWeight.OUTER:
      return (
        <svg
          className="w-4 h-4 my-[0.15rem] -mx-[0.1rem] -scale-x-100"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 576 512"
        >
          <path
            className="fill-card-symbol"
            d="M339.3 367.1c27.3-3.9 51.9-19.4 67.2-42.9L568.2 74.1c12.6-19.5 9.4-45.3-7.6-61.2S517.7-4.4 499.1 9.6L262.4 187.2c-24 18-38.2 46.1-38.4 76.1L339.3 367.1zm-19.6 25.4l-116-104.4C143.9 290.3 96 339.6 96 400c0 3.9 .2 7.8 .6 11.6C98.4 429.1 86.4 448 68.8 448H64c-17.7 0-32 14.3-32 32s14.3 32 32 32H208c61.9 0 112-50.1 112-112c0-2.5-.1-5-.2-7.5z"
          />
        </svg>
      );
  }
}

function Block(props: { weight: CardIconWeight }) {
  switch (props.weight) {
    case CardIconWeight.INNER:
      return (
        <svg
          className="w-20 h-20"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1024 1024"
        >
          <ellipse
            className="fill-none stroke-card-symbol stroke-card-block-inner"
            cx="511.9"
            cy="512"
            rx="451.9"
            ry="452"
          />
          <line
            className="fill-none stroke-card-symbol stroke-card-block-inner"
            x1="194.04"
            y1="197.49"
            x2="826.32"
            y2="819.6"
          />
        </svg>
      );

    case CardIconWeight.OUTER:
      return (
        <svg
          className="w-5 h-5 my-0.5 -mx-[0.05rem]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1024 1024"
        >
          <ellipse
            className="fill-none stroke-card-symbol stroke-card-block-outer"
            cx="511.9"
            cy="512"
            rx="471.9"
            ry="472"
          />
          <line
            className="fill-none stroke-card-symbol stroke-card-block-outer"
            x1="179.97"
            y1="183.57"
            x2="840.23"
            y2="833.21"
          />
        </svg>
      );
  }
}

function DirectionChange(props: { weight: CardIconWeight }) {
  switch (props.weight) {
    case CardIconWeight.INNER:
      return (
        <svg
          className="h-[5.25rem] w-[5.25rem]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 845.56 1023.3"
        >
          <path
            className="fill-card-symbol"
            d="M393.91,442.48,752,712.16l69.77-90.62,109.7,398.25L514,1021.13l73.61-96.63L404.79,786.91c-19.7-17.1-55.57-53.39-71.85-110.42C297.9,553.94,386.34,451.09,393.91,442.48Z"
            transform="translate(-89.22 -0.35)"
          />
          <path
            className="fill-card-symbol"
            d="M630.09,581.62,272,311.94,202.2,402.56,92.5,4.21,510,2.87,436.42,99.5,619.31,237.09c19.7,17.1,55.58,53.39,71.85,110.42C726.1,470.16,637.66,573,630.09,581.62Z"
            transform="translate(-89.22 -0.35)"
          />
        </svg>
      );

    case CardIconWeight.OUTER:
      return (
        <svg
          className="w-4 h-4 my-1 -mx-0.5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 806.47165 1021.26336"
        >
          <path
            className="fill-card-symbol"
            d="M406.284,483.45426,728.11733,725.81832l62.71342-81.44273,98.58028,357.905L514.17308,1003.5l66.18559-86.85115L416.05824,793c-17.68673-15.36885-49.95106-47.98688-64.57519-99.23185C319.99135,583.62631,399.46994,491.18987,406.284,483.45426Z"
            transform="translate(-109.16946 -2.36832)"
          />
          <path
            className="fill-none stroke-card-symbol stroke-card-direction-outer"
            d="M618.52477,542.63883,296.6914,300.27476,233.978,381.71753,135.39773,23.71945,510.63571,22.5,444.4501,109.35116,608.84359,233c17.68673,15.36885,49.951,47.98689,64.57519,99.23188C704.81742,442.46678,625.33883,534.90321,618.52477,542.63883Z"
            transform="translate(-109.16946 -2.36832)"
          />
        </svg>
      );
  }
}
