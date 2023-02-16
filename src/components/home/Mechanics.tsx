import CardBack from "../card/CardBack";
import CardFront from "../card/CardFront";
import { CardColor, CardFace } from "../../models/Card";
import { Column, Entry, Heading, Row } from "./Layout";
import React from "react";

export default function Mechanics(props: { theme: CardColor }) {
  return (
    <>
      <Heading title="mechanics" />
      <Row>
        <Column>
          <Entry
            title="draw"
            text="If a player can´t play a card he needs to draw a card."
          >
            <div className="h-52">
              <CardBack />
            </div>
          </Entry>
          <Entry
            title="match"
            text="When it is a player's turn, he can play a card if it has the same color, the same value or if it is a wish-card or plus-4-card."
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
            title="wish"
            text="If a wish-card is played, the player can define the next played color."
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
            text="If a block-card is played, the player whose turn it would be next must sit out."
          >
            <CardFront
              card={{
                face: CardFace.BLOCK,
                color: props.theme,
              }}
            />
          </Entry>
          <Entry
            title="rotate"
            text="If a rotate-card is played, it is played in the opposite direction to the previous one."
          >
            <CardFront
              card={{
                face: CardFace.DIRECTION_CHANGE,
                color: props.theme,
              }}
            />
          </Entry>
        </Column>
        <Column>
          <Entry
            title="plus 2"
            text="If a draw-2-card is played, the next player need´s to draw 2 cards. "
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
            text="If a draw-4-card is played, the next player need´s to draw 4 cards and the previous player define the next played color. "
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
            text="If a player only has one card left, he needs to say “ONE” if he get caught, don´t saying it, he need´s to draw 2 cards."
          >
            <CardFront
              card={{
                face: CardFace.NUMBER_1,
                color: props.theme,
              }}
            />
          </Entry>
          <Entry
            title="winner"
            text={
              'The first player with zero cards left wins. "Winner Winner Chicken Dinner" '
            }
          >
            <CardFront
              card={{
                face: CardFace.NUMBER_0,
                color: props.theme,
              }}
            />
          </Entry>
        </Column>
      </Row>
    </>
  );
}