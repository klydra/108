import React from "react";

export default function LobbyCode(props: { game: string }) {
  return (
    <div className="absolute bottom-[1.5%] inset-x-1/2 flex justify-center items-center gap-x-3">
      <p className="whitespace-nowrap">Others can join using code </p>
      <b>{props.game}</b>
    </div>
  );
}
