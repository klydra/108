import React from "react";
import { SessionType } from "../../../models/Session";

export default function LobbyPlayers(props: { session: SessionType }) {
  return (
    <div className="h-full max-h-full max-w-[20rem] flex flex-grow flex-col flex-wrap justify-center items-center gap-4 overflow-hidden">
      <Avatar avatar={props.session.me.avatar} name={props.session.me.name} />
      {props.session.enemies.map(({ avatar, name }) => (
        <Avatar avatar={avatar} name={name} />
      ))}
    </div>
  );
}

function Avatar(props: { avatar: string; name: string }) {
  return (
    <div className="h-16 w-16 rounded-2xl overflow-hidden" key={props.name}>
      <div dangerouslySetInnerHTML={{ __html: props.avatar }}></div>
    </div>
  );
}
