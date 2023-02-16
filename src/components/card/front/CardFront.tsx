import React from "react";
import {
  CardColor,
  CardFace,
  CardIconWeight,
  CardType,
  colorToString,
} from "../../../models/Card";
import CardSymbol from "./CardSymbol";

export default function CardFront(props: { card: CardType }) {
  switch (props.card.face) {
    case CardFace.WISH:
    case CardFace.WISH_PLUS_4:
      return <WishCard card={props.card} />;

    default:
      return <Card card={props.card} />;
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
            colorToString(props.card.color)
          }
        >
          <div className="pr-1.5 pt-1 flex justify-end items-start w-full h-full text-background leading-none">
            <CardSymbol face={props.card.face} weight={CardIconWeight.OUTER} />
          </div>
        </div>
        {/* Center ellipsis */}
        <div
          className={
            "flex justify-center items-center w-full h-[74%] bg-card-" +
            colorToString(props.card.color)
          }
        >
          <div className="-rotate-card-angle rounded-card-inner flex justify-center items-center p-[0.2rem] bg-card-accent flex justify-center items-center w-[85%] h-[115%]">
            <div className="w-full h-full rounded-card-inner bg-card-inner">
              <div className="rotate-card-angle flex justify-center items-center w-full h-full">
                <CardSymbol
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
            colorToString(props.card.color)
          }
        >
          <div className="pl-1.5 pb-1 flex justify-start items-end w-full h-full">
            <CardSymbol face={props.card.face} weight={CardIconWeight.OUTER} />
          </div>
        </div>
      </div>
      {/* Preload bg-classes at compile time */}
      <div className="hidden bg-card-yellow bg-card-green bg-card-blue bg-card-purple"></div>
    </>
  );
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
                  : "bg-card-" + colorToString(props.card.color))
              }
            ></div>
            <div
              className={
                "w-full h-full rounded-tr-[0.9rem] " +
                (props.card.color === CardColor.DARK
                  ? "bg-card-purple"
                  : "bg-card-" + colorToString(props.card.color))
              }
            ></div>
            <div
              className={
                "w-full h-full rounded-bl-[0.9rem] " +
                (props.card.color === CardColor.DARK
                  ? "bg-card-blue"
                  : "bg-card-" + colorToString(props.card.color))
              }
            ></div>
            <div
              className={
                "w-full h-full rounded-br-[0.9rem] " +
                (props.card.color === "d"
                  ? "bg-card-green"
                  : "bg-card-" + colorToString(props.card.color))
              }
            ></div>
          </div>
          <div className="absolute h-full w-full">
            <div className="w-full h-[14%] -mb-[1%] rounded-t-[0.9rem]">
              <div className="font-card text-[1.5rem] pr-1.5 pt-1 flex justify-end items-start w-full h-full text-background leading-none">
                <CardSymbol
                  face={props.card.face}
                  weight={CardIconWeight.OUTER}
                />
              </div>
            </div>
            <div className="flex justify-center items-center w-full h-[74%]">
              <div className="-rotate-card-angle rounded-card-inner flex justify-center items-center bg-card-accent p-[0.2rem] flex justify-center items-center w-[85%] h-[115%]">
                <div className="w-full h-full rounded-card-inner bg-card-inner">
                  <div className="rotate-card-angle flex justify-center items-center w-full h-full">
                    <CardSymbol
                      face={props.card.face}
                      weight={CardIconWeight.INNER}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full h-[14%] -mt-[1%] rounded-b-[0.9rem]">
              <div className="pl-1.5 pb-1 flex justify-start items-end w-full h-full">
                <CardSymbol
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
