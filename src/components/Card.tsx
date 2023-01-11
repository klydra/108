import React from "react";
import {CardType} from "../models/Card"

export default function Card(props: { card: CardType }) {
  console.log(props.card)

  return <div className="h-52 aspect-[9/16] rounded p-1 bg-card-accent">
    <div className="rounded bg-card-purple w-full h-full">
      <div className="text-[6rem] flex justify-center items-center w-full h-full">
        <p className="leading-none">5</p>
      </div>
    </div>
  </div>
}