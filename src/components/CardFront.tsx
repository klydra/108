import React from "react";
import {CardFace, CardType} from "../models/Card"

export default function CardFront(props: { card: CardType }) {
  console.log(props.card)

  return <div className="overflow-hidden h-52 aspect-[9/16] rounded-2xl p-0.5 bg-card-accent">
    <div className="w-full h-[13%] rounded-t-[0.9rem] bg-card-purple">
      <p className="font-card text-[1.5rem] pr-1.5 pt-1 flex justify-end items-start w-full h-full text-background leading-none"><Face face={props.card.face} /></p>
    </div>
    <div className="bg-card-purple flex justify-center items-center w-full h-[74%]">
      <div className="-rotate-card-angle rounded-card-inner flex justify-center items-center bg-card-accent flex justify-center items-center w-[85%] h-[115%]">
        <p className="font-card rotate-card-angle text-[7rem] flex justify-center items-center w-full h-full text-background leading-none"><Face face={props.card.face} /></p>
      </div>
    </div>
    <div className="w-full h-[13%] rounded-b-[0.9rem] bg-card-purple">
      <p className="font-card text-[1.5rem] pl-1.5 pb-1 flex justify-start items-end w-full h-full text-background leading-none"><Face face={props.card.face} /></p>
    </div>
  </div>
}

function Face(props: { face: CardFace }) {
  switch (props.face) {
    case CardFace.NUMBER_0: return <>0</>;
    case CardFace.NUMBER_1: return <>1</>;
    case CardFace.NUMBER_2: return <>2</>;
    case CardFace.NUMBER_3: return <>3</>;
    case CardFace.NUMBER_4: return <>4</>;
    case CardFace.NUMBER_5: return <>5</>;
    case CardFace.NUMBER_6: return <>6</>;
    case CardFace.NUMBER_7: return <>7</>;
    case CardFace.NUMBER_8: return <>8</>;
    case CardFace.NUMBER_9: return <>9</>;
    default: return null;
  }
}