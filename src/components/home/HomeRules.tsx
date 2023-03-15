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
            text="Cards drawn, given, etc. are taken from a random position in the stack."
          >
            <div className="h-52">
              <CardBack />
            </div>
          </Entry>
          <Entry
            title="unlimited cards"
            text="There is no cards deck. Every card drawn, given, etc. is purely random."
          >
            <div className="h-52">
              <CardBack />
            </div>
          </Entry>
          <Entry
            title="short match"
            text="The game ends when the first player has played out all their cards."
          >
            <CardFront
              card={{
                face: CardFace.NUMBER_0,
                color: props.theme,
              }}
            />
          </Entry>
          <Entry
            title="holding"
            text="If you draw a matching card you choose to play it instantly or hold onto it."
          >
            <CardFront
              card={{
                face: CardFace.WISH_PLUS_4,
                color: props.theme,
              }}
            />
          </Entry>
        </Column>
        <Column>
          <Entry
            title="stacks"
            text="Draw-2 cards and draw-4 cards are stackable and add their draw values together."
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
            text="If a 7 is played, the player can choose one opponent to swap cards with."
          >
            <CardFront
              card={{
                face: CardFace.NUMBER_7,
                color: props.theme,
              }}
            />
          </Entry>
          <Entry
            title="throwing"
            text="If a card is played and a player has the identical card, they may choose to throw it in, even if it isn't their turn. The game will then continue from the player after them."
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
          <Entry
            title="million cards"
            text="You need to draw again and again until you get a matching card."
          >
            <div className="h-52">
              <CardBack />
            </div>
          </Entry>
        </Column>
      </Row>
    </>
  );
}
