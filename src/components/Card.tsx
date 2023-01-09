import React from "react";
import {CardType} from "../models/Card"

export default function Card(props: { card: CardType }) {
  return <div className="bg-card-yellow p-4 border-2 border-card-purple hover:border-4">{props.card.color}</div>
}