import React from "react";

export default function CardBack() {
  return <div className="overflow-hidden h-52 aspect-[9/16] rounded p-1 bg-card-accent">
    <div className="bg-card-back flex justify-center items-center w-full h-full">
      <div className="-rotate-card-angle rounded-card-inner flex justify-center items-center bg-card-accent flex justify-center items-center w-full h-[80%]">
        <p className="rotate-card-back-angle text-[4rem] flex justify-center items-center w-full h-full text-card-back-text font-bold leading-none">108</p>
      </div>
    </div>
  </div>
}