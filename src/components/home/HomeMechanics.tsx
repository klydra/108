import CardBack from "../card/back/CardBack";
import CardFront from "../card/front/CardFront";
import { CardColor, CardFace } from "../../models/Card";
import { Column, Entry, Heading, Row } from "./HomeLayout";
import React from "react";

export default function HomeMechanics(props: { theme: CardColor }) {
  return (
    <>
      <Heading title="mechanics" />
      <Row>
        <Column>
          <Entry
            title="match"
            text="Depending on the previous card played, the player can play a card with matching color or value. Wish or draw-4 cards, may be played regardless of the previous card."
          >
            <div className="z-10">
              <CardFront
                card={{
                  face: CardFace.NUMBER_7,
                  color: props.theme,
                }}
              />
            </div>
            <div className="-ml-[5rem]">
              <CardFront
                card={{
                  face: CardFace.NUMBER_5,
                  color: props.theme,
                }}
              />
            </div>
          </Entry>
          <Entry
            title="draw"
            text="If a player can´t play a card he needs to draw a card."
          >
            <div className="h-52">
              <CardBack />
            </div>
          </Entry>
          <Entry
            title="wish"
            text="If a wish card is played, the color which needs to be played next can be chosen."
          >
            <CardFront
              card={{
                face: CardFace.WISH,
                color: props.theme,
              }}
            />
          </Entry>
          <Entry
            title="block"
            text="If a block card is played, the next player will be skipped."
          >
            <CardFront
              card={{
                face: CardFace.BLOCK,
                color: props.theme,
              }}
            />
          </Entry>
        </Column>
        <Column>
          <Entry
            title="plus 2"
            text="If a draw-2 card is played, the next player needs to draw 2 cards. "
          >
            <CardFront
              card={{
                face: CardFace.PLUS_2,
                color: props.theme,
              }}
            />
          </Entry>
          <Entry
            title="plus 4"
            text="If a draw-4 card is played, the color which needs to be played next can be chosen. The next player needs to draw 4 cards. "
          >
            <CardFront
              card={{
                face: CardFace.WISH_PLUS_4,
                color: props.theme,
              }}
            />
          </Entry>
          <Entry
            title={' "ONE" '}
            text="If a player only has one card left, he needs to say “ONE”. If forgotten, players can report by clicking on their profile picture and the player needs to draw 2 additional cards."
          >
            <CardFront
              card={{
                face: CardFace.NUMBER_1,
                color: props.theme,
              }}
            />
          </Entry>
          <Entry
            title="rotate"
            text="If a rotate card is played, the direction of the game is being swapped."
          >
            <CardFront
              card={{
                face: CardFace.DIRECTION_CHANGE,
                color: props.theme,
              }}
            />
          </Entry>
        </Column>
      </Row>
    </>
  );
}
