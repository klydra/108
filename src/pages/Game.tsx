import React, { Component } from "react";
import CardFront from "../components/CardFront";
import { CardColor, CardFace, CardType } from "../models/Card";
import CardBack from "../components/CardBack";

export default class Game extends Component<any, any> {
  constructor(props: any) {
    super(props);
  }

  render() {
    const card: CardType = {
      face: CardFace.NUMBER_3,
      color: CardColor.PURPLE,
    };

    return (
      <>
        {/* Table */}
        <div className="flex justify-center items-center bg-background h-[100vh] w-[100vw] px-[5%] py-[5%]">
          <div className="bg-table-background h-full w-full rounded-2xl drop-shadow-[0_5px_5px_rgba(255,255,255,0.25)] shadow-card-yellow"></div>
        </div>

        {/* Own card row */}
        <div className="fixed h-52 w-[60%] inset-x-[20%] bottom-[1%] flex gap-2 justify-center items-end">
          <CardFront card={card} />
          <CardFront card={card} />
          <CardFront card={card} />
          <CardFront card={card} />
          <CardFront card={card} />
          <CardFront card={card} />
        </div>

        {/* Left card row */}
      <div className="fixed w-44 h-[80%] inset-y-[10%] left-[1%] rotate-180 flex flex-col justify-center items-end">
          <CardBack rotated />
        </div>

        {/* Right card row */}
        <div className="fixed w-44 h-[80%] inset-y-[10%] right-[1%] flex flex-col justify-center items-end">
          <CardBack rotated/>
        </div>

        {/* Top card row */}
        <div className="fixed w-[80%] h-44 inset-x-[10%] top-[1%] gap-2 flex justify-center items-start">
          <CardBack />
          <CardBack />
          <CardBack />
        </div>

        {/* Contest button */}
        <div className="fixed flex h-[12.5%] left-[10%] right-[80%] bottom-[6%]"></div>

        {/* Call button */}
        <div className="fixed flex h-[12.5%] left-[80%] right-[10%] bottom-[6%]"></div>

        {/* Draw stack */}
        <div className="fixed flex inset-y-1/2 left-[37.5%] right-[50%] inset-y-[42%]"></div>

        {/* Play stack  */}
        <div className="fixed flex inset-y-1/2 right-[37.5%] left-[50%] inset-y-[42%]"></div>
      </>
    );
  }
}
