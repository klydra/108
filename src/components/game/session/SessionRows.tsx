import React, { useEffect, useState } from "react";
import { SessionType } from "../../../models/Session";
import RowBottom from "./rows/RowBottom";
import CardBack from "../../card/back/CardBack";
import RowTop from "./rows/RowTop";
import RowLeft from "./rows/RowLeft";
import RowRight from "./rows/RowRight";

export default function SessionRows(props: { session: SessionType }) {
  return (
    <>
      <RowTop session={props.session} scale={30} />
      <RowLeft session={props.session} scale={30} />
      <RowRight session={props.session} scale={30} />
      <RowBottom
        session={props.session}
        scale={38}
        rotation={15}
        translation={2}
      />
    </>
  );
}

export function EnemyCard() {
  const [visible, setVisible] = useState(true);
  useEffect(() => setVisible(false), []);

  return (
    <div
      className="h-44 duration-200 ease-out aria-disabled:translate-y-60 aria-disabled:scale-0 aria-disabled:duration-300 aria-disabled:opacity-0"
      aria-disabled={visible}
    >
      <CardBack />
    </div>
  );
}

export function EnemyCardRotated() {
  const [visible, setVisible] = useState(true);
  useEffect(() => setVisible(false), []);

  return (
    <div
      className="w-44 duration-200 ease-out aria-disabled:-translate-x-60 aria-disabled:scale-0 aria-disabled:duration-300 aria-disabled:opacity-0"
      aria-disabled={visible}
    >
      <CardBack rotated />
    </div>
  );
}
