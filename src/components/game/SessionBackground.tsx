import React from "react";

export default function SessionBackground() {
  return (
    <div className="absolute flex justify-center items-center bg-background h-[100vh] w-[100vw] p-[5%] -z-50">
      <div className="bg-table-background h-full w-full rounded-2xl drop-shadow-[0_5px_5px_rgba(255,255,255,0.25)] shadow-card-yellow -z-50"></div>
    </div>
  );
}
