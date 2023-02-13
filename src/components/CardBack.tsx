import React from "react";

export default function CardBack(props: { rotated?: boolean }) {
  if (props.rotated) return null;

  return (
    <div className="overflow-hidden h-full aspect-[9/16] rounded-xl bg-card-accent flex justify-center items-center">
      <div className="w-[95%] h-[97%]">
        <div className="bg-card-back flex justify-center items-center w-full h-[13%] rounded-t-xl"></div>
        <div className="bg-card-back flex justify-center items-center w-full h-[74%]">
          <div className="-rotate-card-angle rounded-card-inner flex justify-center items-center bg-card-accent  w-[85%] h-[115%]">
            <div className="rotate-card-angle flex justify-center items-center w-full h-full">
              <img src="/icon.svg" alt="" className="mr-0.5 -ml-0.5" />
            </div>
          </div>
        </div>
        <div className="bg-card-back flex justify-center items-center w-full h-[13%] rounded-b-xl"></div>
      </div>
    </div>
  );
}
