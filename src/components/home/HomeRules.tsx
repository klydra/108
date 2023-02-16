import React from "react";
import { Column, Entry, Heading, Row } from "./HomeLayout";
import CardBack from "../card/back/CardBack";
import CardFront from "../card/front/CardFront";
import { CardColor, CardFace } from "../../models/Card";

export default function HomeRules(props: { theme: CardColor }) {
  return (
    <>
      <Heading title="custom rules" />
      <Row>
        <Column>
          <Entry
            title="random cards"
            text="order cards …..gsfdagfgsafdgasfgdfasgfdgasfg"
          >
            <div className="h-52">
              <CardBack />
            </div>
          </Entry>
          <Entry
            title="short match"
            text="the game ends when the first player plays all his cards"
          >
            <CardFront
              card={{
                face: CardFace.NUMBER_0,
                color: props.theme,
              }}
            />
          </Entry>
          <Entry
            title="to good to go"
            text="if you draw a matching card you can play it or hold it"
          >
            <CardFront
              card={{
                face: CardFace.WISH_PLUS_4,
                color: props.theme,
              }}
            />
          </Entry>
          <Entry
            title="million cards"
            text="you can draw as long cards as you didn´t got a matching one"
          >
            <div className="h-52">
              <CardBack />
            </div>
          </Entry>
        </Column>
        <Column>
          <Entry
            title="stacks"
            text="Draw-2-cards and draw-4-cards are stackable, that the next player needs to draw 2, 3, 4, … times as much cards."
          >
            <CardFront
              card={{
                face: CardFace.PLUS_2,
                color: props.theme,
              }}
            />
          </Entry>
          <Entry
            title="magic 7"
            text="If a 7 is played, the player can choose one opponent to switch cards with."
          >
            <CardFront
              card={{
                face: CardFace.NUMBER_7,
                color: props.theme,
              }}
            />
          </Entry>
          <Entry
            title="fast, faster, next one"
            text="If a card is played, and a player has the identical card the player can play the identical card and from him the game continues."
          >
            <div className="z-10">
              <CardFront
                card={{
                  face: CardFace.NUMBER_6,
                  color: props.theme,
                }}
              />
            </div>
            <div className="-ml-[5rem]">
              <CardFront
                card={{
                  face: CardFace.NUMBER_6,
                  color: props.theme,
                }}
              />
            </div>
          </Entry>
        </Column>
      </Row>
    </>
  );
}
