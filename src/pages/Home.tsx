import React, { Component } from "react";
import { Button } from "@mantine/core";
import CardFront from "../components/CardFront";
import { CardColor, CardFace } from "../models/Card";
import CardBack from "../components/CardBack";


interface HomeProps {
}

interface HomeState {
  theme: CardColor;
}

export default class Home extends Component<HomeProps, HomeState> {
  constructor(props: any) {
    super(props);

    this.state = {
      theme: this.theme()
    };

    console.log(this.state.theme);
  }

  theme() {
    switch (Math.floor(Math.random() * Object.keys(CardColor).length)) {
      case 0:
        return CardColor.YELLOW;
      case 1:
        return CardColor.GREEN;
      case 2:
        return CardColor.BLUE;
      default:
      case 3:
        return CardColor.PURPLE;
    }
  }

  color(theme: CardColor) {
    switch (theme) {
      case CardColor.YELLOW:
        return "yellow";
      case CardColor.GREEN:
        return "green";
      case CardColor.BLUE:
        return "blue";
      case CardColor.PURPLE:
      default:
        return "purple";
    }
  }

  render() {
    return (
      <div className="bg-background w-full">

        <div className="h-[3rem]"></div>
        <div className="flex h-[20rem] flex justify-center items-end gap-[3rem]">
          <img src="/icon.svg" alt="" className="h-[20rem]" />
          <p className="text-card-accent text-[7rem]"> 108.cards </p>
        </div>
        <div className="h-[10rem] flex justify-center items-center">
          <p className="text-card-accent text-[3rem]"> The … game for everyone ! </p>
        </div>
        <div className="h-[3rem]"></div>
        <div className="h-[24rem] flex justify-center items-center">
          <Button radius="xl" size="xl" uppercase
                  className={"h-[10rem] w-[30rem] text-[7rem] outline-card-purple hover:bg-card-purple rounded-[10rem] text-background bg-card-" + this.color(this.state.theme)}> Play </Button>
          <div className="hidden bg-card-yellow bg-card-green bg-card-blue bg-card-purple"></div>
        </div>
        <div className="h-[2rem]">

        </div>
        <div className="h-[4rem] flex justify-start items-center pl-[9rem]">
          <p className="text-card-accent  text-[4rem]">
            rules
          </p>
        </div>
        <div className="grid grid-cols-2 py-[2rem] px-[2rem]">
          <div className="flex flex-col items-center gap-y-24">
            <div className="w-[70%] gap-x-[8%] flex justify-evenly items-center">
              <div className="flex min-w-[10rem] justify-evenly items-center">
                <div className="z-10">
                  <CardFront card={{
                    face: CardFace.NUMBER_7,
                    color: this.state.theme
                  }} />
                </div>
                <div className="-ml-[5rem]">
                  <CardFront card={{
                    face: CardFace.NUMBER_5,
                    color: this.state.theme
                  }} />
                </div>
              </div>
              <this.Rule title="match" text="When it is a player's turn, he can play a card if it has the same color, the same value or if it is a wish-card or plus-4-card." />
            </div>
            <div className="w-[70%] gap-x-[8%] flex justify-evenly items-center">
              <div className="flex min-w-[10rem] justify-evenly items-center">
                <div className="h-52">
                  <CardBack />
                </div>
              </div>
              <this.Rule title="draw" text="If a player can´t play a card he needs to draw a card." />
            </div>
            <div className="w-[70%] gap-x-[8%] flex justify-evenly items-center">
              <div className="flex min-w-[10rem] justify-evenly items-center">
                <CardFront card={{
                  face: CardFace.WISH,
                  color: this.state.theme
                }} />
              </div>
              <this.Rule title="wish" text="If a wish-card is played, the player can define the next played color." />
            </div>
            <div className="w-[70%] gap-x-[8%] flex justify-evenly items-center">
              <div className="flex min-w-[10rem] justify-evenly items-center">
                <CardFront card={{
                  face: CardFace.BLOCK,
                  color: this.state.theme
                }} />
              </div>
              <this.Rule title="block" text="If a block-card is played, the player whose turn it would be next must sit out." />
            </div>
            <div className="w-[70%] gap-x-[8%] flex justify-evenly items-center">
              <div className="flex min-w-[10rem] justify-evenly items-center">
                <CardFront card={{
                  face: CardFace.DIRECTION_CHANGE,
                  color: this.state.theme
                }} />
              </div>
              <this.Rule title="rotate" text="If a rotate-card is played, it is played in the opposite direction to the previous one." />
            </div>
          </div>
          <div className="flex flex-col items-center gap-y-24">
            <div className="w-[70%] gap-x-[8%] flex justify-evenly items-center">
              <div className="flex min-w-[10rem] justify-evenly items-center">
                <CardFront card={{
                  face: CardFace.PLUS_2,
                  color: this.state.theme
                }} />
              </div>
              <this.Rule title="plus 2" text="If a draw-2-card is played, the next player need´s to draw 2 cards. " />
            </div>
            <div className="w-[70%] gap-x-[8%] flex justify-evenly items-center">
              <div className="flex min-w-[10rem] justify-evenly items-center">
                <CardFront card={{
                  face: CardFace.WISH_PLUS_4,
                  color: this.state.theme
                }} />
              </div>
              <this.Rule title="plus 4" text="If a draw-4-card is played, the next player need´s to draw 4 cards and the previous player define the next played color. " />
            </div>
            <div className="w-[70%] gap-x-[8%] flex justify-evenly items-center">
              <div className="flex min-w-[10rem] justify-evenly items-center">
                <CardFront card={{
                  face: CardFace.NUMBER_1,
                  color: this.state.theme
                }} />
              </div>
              <this.Rule title={" \"ONE\" "} text="If a player only has one card left, he needs to say “ONE” if he get caught, don´t saying it, he need´s to draw 2 cards." />
            </div>
            <div className="w-[70%] gap-x-[8%] flex justify-evenly items-center">
              <div className="flex min-w-[10rem] justify-evenly items-center">
                <CardFront card={{
                  face: CardFace.NUMBER_0,
                  color: this.state.theme
                }} />
              </div>
              <this.Rule title="winner" text={"The first player with zero cards left wins. \"Winner Winner Chicken Dinner\" "} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  Rule(props: { title: string, text: string }) {
    return <div className="-mt-6">
        <div className="flex flex-col gap-y-2">
        <h3 className="text-[2.5rem] text-card-accent font-semibold tracking-[.01em]">{props.title}</h3>
        <p className="text-[1.5rem] text-card-accent leading-tight">{props.text}</p>
      </div>
    </div>
  }
}
