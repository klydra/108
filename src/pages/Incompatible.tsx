import React from "react";

export default function Incompatible() {
  return (
    <div className="h-[100vh] w-[100vw] flex flex-col gap-y-6 justify-center items-center">
      <b className="font-default text-[2rem] whitespace-nowrap">
        Browser incompatible
      </b>
      <p className="font-default text-[1.2rem] mx-10">
        Please try to view this website on a device with higher screen
        resolution.
      </p>
    </div>
  );
}
