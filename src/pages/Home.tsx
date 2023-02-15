import React, { Component } from "react";
import { Button } from "@mantine/core";
import CardFront from "../components/CardFront";
import { CardColor, CardFace } from "../models/Card";
import CardBack from "../components/CardBack";
import { ArrowCircleDown, PlayArrow } from "@mui/icons-material";

interface HomeProps {}

interface HomeState {}

export default class Home extends Component<HomeProps, HomeState> {
  private readonly theme: number;

  constructor(props: any) {
    super(props);

    this.theme = Math.floor(Math.random() * Object.keys(CardColor).length - 1);
  }

  themeColor() {
    switch (this.theme) {
      case 0:
        return CardColor.YELLOW;
      case 1:
        return CardColor.GREEN;
      case 2:
        return CardColor.BLUE;
      case 3:
      default:
        return CardColor.PURPLE;
    }
  }

  themeName() {
    switch (this.theme) {
      case 0:
        return "yellow";
      case 1:
        return "green";
      case 2:
        return "blue";
      case 3:
      default:
        return "purple";
    }
  }

  render() {
    return (
      <div className="bg-background w-full">
        <div className="w-full h-[100vh] flex flex-col justify-evenly items-center">
          <div className="w-full h-full flex flex-col justify-evenly items-center gap-y-32">
            <div className="flex flex-col justify-center items-center gap-y-16">
              <div className="flex justify-center items-end gap-x-4">
                <img src="/icon.svg" alt="" className="h-[20rem]" />
                <b className="text-card-accent text-[7rem] font-default">
                  108.cards
                </b>
              </div>
              <p className="text-card-accent text-[3rem] font-default">
                The <b>classic game</b> for <b>everyone</b>!
              </p>
            </div>
            <div className="flex justify-center items-center">
              <Button
                uppercase
                className={
                  "h-52 w-52 rounded-[10rem] text-background hover:bg-card-" +
                  this.themeName() +
                  " bg-card-" +
                  this.themeName()
                }
              >
                <div className="w-full h-full p-8 flex justify-center items-center">
                  <PlayArrow style={{ width: "100%", height: "100%" }} />
                </div>
              </Button>
              <div className="hidden bg-card-yellow bg-card-green bg-card-blue bg-card-purple hover:bg-card-yellow hover:bg-card-green hover:bg-card-blue hover:bg-card-purple"></div>
            </div>
          </div>
          <div className="w-full h-[10%] flex justify-center items-center">
            <div className="animate-bounce opacity-50 ease-in-out text-contrast h-16 w-16">
              <ArrowCircleDown style={{ width: "100%", height: "100%" }} />
            </div>
          </div>
        </div>
        <this.Heading title="mechanics" />
        <this.Row>
          <this.Column>
            <this.Rule
              title="draw"
              text="If a player can´t play a card he needs to draw a card."
            >
              <div className="h-52">
                <CardBack />
              </div>
            </this.Rule>
            <this.Rule
              title="match"
              text="When it is a player's turn, he can play a card if it has the same color, the same value or if it is a wish-card or plus-4-card."
            >
              <div className="z-10">
                <CardFront
                  card={{
                    face: CardFace.NUMBER_7,
                    color: this.themeColor(),
                  }}
                />
              </div>
              <div className="-ml-[5rem]">
                <CardFront
                  card={{
                    face: CardFace.NUMBER_5,
                    color: this.themeColor(),
                  }}
                />
              </div>
            </this.Rule>
            <this.Rule
              title="wish"
              text="If a wish-card is played, the player can define the next played color."
            >
              <CardFront
                card={{
                  face: CardFace.WISH,
                  color: this.themeColor(),
                }}
              />
            </this.Rule>
            <this.Rule
              title="block"
              text="If a block-card is played, the player whose turn it would be next must sit out."
            >
              <CardFront
                card={{
                  face: CardFace.BLOCK,
                  color: this.themeColor(),
                }}
              />
            </this.Rule>
            <this.Rule
              title="rotate"
              text="If a rotate-card is played, it is played in the opposite direction to the previous one."
            >
              <CardFront
                card={{
                  face: CardFace.DIRECTION_CHANGE,
                  color: this.themeColor(),
                }}
              />
            </this.Rule>
          </this.Column>
          <this.Column>
            <this.Rule
              title="plus 2"
              text="If a draw-2-card is played, the next player need´s to draw 2 cards. "
            >
              <CardFront
                card={{
                  face: CardFace.PLUS_2,
                  color: this.themeColor(),
                }}
              />
            </this.Rule>
            <this.Rule
              title="plus 4"
              text="If a draw-4-card is played, the next player need´s to draw 4 cards and the previous player define the next played color. "
            >
              <CardFront
                card={{
                  face: CardFace.WISH_PLUS_4,
                  color: this.themeColor(),
                }}
              />
            </this.Rule>
            <this.Rule
              title={' "ONE" '}
              text="If a player only has one card left, he needs to say “ONE” if he get caught, don´t saying it, he need´s to draw 2 cards."
            >
              <CardFront
                card={{
                  face: CardFace.NUMBER_1,
                  color: this.themeColor(),
                }}
              />
            </this.Rule>
            <this.Rule
              title="winner"
              text={
                'The first player with zero cards left wins. "Winner Winner Chicken Dinner" '
              }
            >
              <CardFront
                card={{
                  face: CardFace.NUMBER_0,
                  color: this.themeColor(),
                }}
              />
            </this.Rule>
          </this.Column>
        </this.Row>
        <this.Heading title="custom rules" />
        <this.Row>
          <this.Column>
            <this.Rule
              title="random cards"
              text="order cards …..gsfdagfgsafdgasfgdfasgfdgasfg"
            >
              <div className="h-52">
                <CardBack />
              </div>
            </this.Rule>
            <this.Rule
              title="short match"
              text="the game ends when the first player plays all his cards"
            >
              <CardFront
                card={{
                  face: CardFace.NUMBER_0,
                  color: this.themeColor(),
                }}
              />
            </this.Rule>
            <this.Rule
              title="to good to go"
              text="if you draw a matching card you can play it or hold it"
            >
              <CardFront
                card={{
                  face: CardFace.WISH_PLUS_4,
                  color: this.themeColor(),
                }}
              />
            </this.Rule>
            <this.Rule
              title="million cards"
              text="you can draw as long cards as you didn´t got a matching one"
            >
              <div className="h-52">
                <CardBack />
              </div>
            </this.Rule>
          </this.Column>
          <this.Column>
            <this.Rule
              title="stacks"
              text="Draw-2-cards and draw-4-cards are stackable, that the next player needs to draw 2, 3, 4, … times as much cards."
            >
              <CardFront
                card={{
                  face: CardFace.PLUS_2,
                  color: this.themeColor(),
                }}
              />
            </this.Rule>
            <this.Rule
              title="magic 7"
              text="If a 7 is played, the player can choose one opponent to switch cards with."
            >
              <CardFront
                card={{
                  face: CardFace.NUMBER_7,
                  color: this.themeColor(),
                }}
              />
            </this.Rule>
            <this.Rule
              title="fast, faster, next one"
              text="If a card is played, and a player has the identical card the player can play the identical card and from him the game continues."
            >
              <div className="z-10">
                <CardFront
                  card={{
                    face: CardFace.NUMBER_6,
                    color: this.themeColor(),
                  }}
                />
              </div>
              <div className="-ml-[5rem]">
                <CardFront
                  card={{
                    face: CardFace.NUMBER_6,
                    color: this.themeColor(),
                  }}
                />
              </div>
            </this.Rule>
          </this.Column>
        </this.Row>
        <this.Heading title="contact" />
      </div>
    );
  }

  Row(props: { children: React.ReactNode }) {
    return (
      <div className="grid grid-cols-2 pt-[5rem] pb-[8rem] px-[2rem]">
        {props.children}
      </div>
    );
  }

  Column(props: { children: React.ReactNode }) {
    return (
      <div className="flex flex-col items-center gap-y-24">
        {props.children}
      </div>
    );
  }

  Heading(props: { title: string }) {
    return (
      <div className="pb-12 pt-40 flex w-full justify-center items-center">
        <p className="text-card-accent text-[4.5rem] font-semibold font-default">
          {props.title}
        </p>
      </div>
    );
  }

  Rule(props: { children: React.ReactNode; title: string; text: string }) {
    return (
      <div className="w-[70%] gap-x-[8%] flex justify-evenly items-center">
        <div className="flex min-w-[10rem] justify-evenly items-center">
          {props.children}
        </div>
        <div className="-mt-6">
          <div className="flex flex-col gap-y-2">
            <h3 className="text-[2.5rem] text-card-accent font-semibold tracking-[.01em] font-default">
              {props.title}
            </h3>
            <p className="text-[1.5rem] text-card-accent leading-tight font-default">
              {props.text}
            </p>
          </div>
        </div>
      </div>
    );
  }
}
