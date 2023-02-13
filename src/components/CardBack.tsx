import React from "react";

export default function CardBack() {
  return <div className="overflow-hidden h-52 aspect-[9/16] rounded-2xl p-1 bg-card-accent">
    <div className="bg-card-back flex justify-center items-center w-full h-[13%] rounded-t-[0.9rem]"></div>
    <div className="bg-card-back flex justify-center items-center w-full h-[74%]">
      <div className="-rotate-card-angle rounded-card-inner flex justify-center items-center p-[0.2rem] bg-card-accent flex justify-center items-center w-[85%] h-[115%]">
        <div className="w-full h-full rounded-card-inner">
          <div className="rotate-card-angle flex justify-center items-center w-full h-full">
          <img src={"/icon.svg"} alt="" className="mr-0.5 -ml-0.5"/>
          </div>
        </div>
      </div>
    </div>
    <div className="bg-card-back flex justify-center items-center w-full h-[13%] rounded-b-[0.9rem]"></div>
  </div>
}