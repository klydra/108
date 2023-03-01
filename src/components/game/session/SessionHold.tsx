import { SessionType } from "../../../models/Session";
import { Button, Modal } from "@mantine/core";
import React from "react";
import { codeToType, typeToCode } from "../../../models/Card";
import CardFront from "../../card/front/CardFront";
import {
  API_NOTIFICATION_GAME_TIMEOUT,
  gameHold,
  gamePlay,
} from "../../../api/API";
import { showNotification } from "@mantine/notifications";
import { PlayArrow } from "@mui/icons-material";

export default function SessionHold(props: { session: SessionType }) {
  if (
    !props.session.me.live ||
    props.session.globals.drawable ||
    !props.session.rules.hold
  )
    return null;

  const card = codeToType(
    props.session.me.hand[props.session.me.hand.length - 1]
  );

  return (
    <Modal
      opened={true}
      onClose={() => {}}
      closeOnClickOutside={false}
      centered
      withCloseButton={false}
      radius="xl"
      size="auto"
    >
      <div className="p-3 flex flex-col justify-between p-8 items-center gap-y-10">
        <Button
          className="rounded-[3rem] bg-contrast text-background text-[1.5rem] h-12 hover:bg-contrast"
          uppercase
          onClick={async () => {
            const play = await gamePlay(typeToCode(card));
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
          <div className="m-2">PLAY</div>
        </Button>
        <div className="h-52 scale-[135%] mx-8 my-12">
          <CardFront card={card} />
        </div>
        <Button
          className="rounded-[3rem] bg-contrast text-background text-[1.5rem] h-12 hover:bg-contrast"
          uppercase
          onClick={async () => {
            const play = await gameHold();
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
          <div className="m-2">HOLD</div>
        </Button>
      </div>
    </Modal>
  );
}
