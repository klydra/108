import React from "react";
import {CardType} from "../models/Card"

export default function Card(props: { card: CardType }) {
  console.log(props.card)

  return <div className="h-52 aspect-[9/16] rounded p-1 bg-card-accent">
    <div className="rounded bg-card-purple flex justify-center items-center w-full h-full">
      <div className="rounded-card-inner flex justify-center items-center bg-card-accent flex justify-center items-center w-5/6 h-5/6">
        <div className="text-[7rem] flex justify-center items-center w-full h-full text-background">
          <p className="leading-none">7</p>
        </div>
      </div>
    </div>
  </div>
}