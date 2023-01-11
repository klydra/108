import React from "react";
import {Component} from "react";
import Card from "../components/Card";
import {CardColor, CardFace, CardType} from "../models/Card";

export default class Home extends Component<any, any> {
    render() {
        const card: CardType = {
            color: CardColor.PURPLE,
            face: CardFace.NUMBER_0
        }

        return <div className="bg-background w-screen h-screen flex flex-column justify-center items-center">
            <Card card={card}/>
        </div>;
    }
}