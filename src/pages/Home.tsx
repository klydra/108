import React, {Component} from "react";
import CardFront from "../components/CardFront";
import {CardColor, CardFace, CardType} from "../models/Card";

interface HomeProps { }

interface HomeState { }

export default class Home extends Component<HomeProps, HomeState> {

  render() {
    const card: CardType = {
      face: CardFace.NUMBER_0,
      color: CardColor.GREEN
    }

        return <div className="bg-background w-screen h-screen flex flex-column justify-center items-center">
          <CardFront card={card}/>
        </div>;
    }
}