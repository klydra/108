import React from "react";
import { SessionType } from "../../../models/Session";

export default function LobbyPlayers(props: { session: SessionType }) {
  return (
    <div className="h-full max-h-full max-w-[20rem] flex flex-grow flex-col flex-wrap justify-center items-center gap-4 overflow-hidden">
      <Avatar avatar={props.session.me.avatar} />
      {props.session.enemies.map(({ avatar }) => (
        <Avatar avatar={avatar} />
      ))}
    </div>
  );
}

function Avatar(props: { avatar: string }) {
  return (
    <div className="h-16 w-16 rounded-2xl overflow-hidden">
      <div dangerouslySetInnerHTML={{ __html: props.avatar }}></div>
    </div>
  );
}
