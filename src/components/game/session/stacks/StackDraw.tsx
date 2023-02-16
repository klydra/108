import { SessionType } from "../../../../models/Session";
import { API_NOTIFICATION_GAME_TIMEOUT, gameDraw } from "../../../../api/API";
import { showNotification } from "@mantine/notifications";
import { PlayArrow } from "@mui/icons-material";
import CardBack from "../../../card/back/CardBack";
import React, { useEffect, useState } from "react";

export default function StackDraw(props: {
  session: SessionType;
  animator: AnimatorType;
}) {
  return (
    <div className="fixed flex inset-y-1/2 left-[37.5%] right-[50%] inset-y-[42%] justify-center items-center">
      <div
        key={props.animator.disappear.toString()}
        className="cursor-pointer h-full absolute z-10"
        onClick={async () => {
          const play = await gameDraw();
          if (play["code"] !== 200) {
            showNotification({
              autoClose: API_NOTIFICATION_GAME_TIMEOUT,
              message: play["message"] ?? "An unknown error occurred.",
              color: "red",
              icon: <PlayArrow />,
            });
          }
        }}
      >
        <DisappearCard />
      </div>
      <CardBack />
    </div>
  );
}

function DisappearCard() {
  const [disappear, setDisappear] = useState(false);
  useEffect(() => setDisappear(true), []);

  return (
    <div
      className="h-full duration-700 ease-out aria-disabled:scale-[125%] aria-disabled:opacity-0"
      aria-disabled={disappear}
    >
      <CardBack />
    </div>
  );
}
