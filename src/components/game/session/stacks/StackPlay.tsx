import { SessionType } from "../../../../models/Session";
import { CardType, codeToType } from "../../../../models/Card";
import React, { useEffect, useState } from "react";
import CardFront from "../../../card/front/CardFront";

export default function StackPlay(props: {
  session: SessionType;
  animator: AnimatorType;
}) {
  return (
    <div className="fixed flex inset-y-1/2 right-[37.5%] left-[50%] inset-y-[42%] flex justify-center items-center">
      <AppearCard
        key={props.animator.appear.toString()}
        card={codeToType(props.session.stack[0])}
      />
    </div>
  );
}

function AppearCard(props: { card: CardType }) {
  const [appear, setAppear] = useState(true);
  useEffect(() => setAppear(false), []);

  return (
    <div
      className="scale-95 duration-700 ease-out aria-disabled:scale-125 aria-disabled:opacity-50 absolute"
      aria-disabled={appear}
    >
      <CardFront card={props.card} />
    </div>
  );
}
