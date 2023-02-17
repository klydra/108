import { SessionType } from "../../../models/Session";
import { API_NOTIFICATION_GAME_TIMEOUT, gameWish } from "../../../api/API";
import { showNotification } from "@mantine/notifications";
import { PlayArrow } from "@mui/icons-material";
import { Modal } from "@mantine/core";
import React from "react";
import { CardColor } from "../../../models/Card";

export default function SessionWish(props: { session: SessionType }) {
  if (
    !props.session.me.live ||
    props.session.stack.length === 0 ||
    !(props.session.stack[0].charAt(1) === CardColor.DARK)
  )
    return null;

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
      <div className="h-52 w-52 grid grid-rows-2 grid-cols-2 rounded-2xl gap-[0.3rem]">
        <div
          onClick={async () => {
            const wish = await gameWish("y");
            if (wish["code"] !== 200) {
              showNotification({
                autoClose: API_NOTIFICATION_GAME_TIMEOUT,
                message: wish["message"] ?? "An unknown error occurred.",
                color: "red",
                icon: <PlayArrow />,
              });
            }
          }}
          className="h-full w-full cursor-pointer rounded-tl-2xl duration-200 hover:scale-110 hover:z-10 bg-card-yellow"
        ></div>
        <div
          onClick={async () => {
            const wish = await gameWish("g");
            if (wish["code"] !== 200) {
              showNotification({
                autoClose: API_NOTIFICATION_GAME_TIMEOUT,
                message: wish["message"] ?? "An unknown error occurred.",
                color: "red",
                icon: <PlayArrow />,
              });
            }
          }}
          className="h-full w-full cursor-pointer rounded-tr-2xl duration-200 hover:scale-110 hover:z-10 bg-card-green"
        ></div>
        <div
          onClick={async () => {
            const wish = await gameWish("b");
            if (wish["code"] !== 200) {
              showNotification({
                autoClose: API_NOTIFICATION_GAME_TIMEOUT,
                message: wish["message"] ?? "An unknown error occurred.",
                color: "red",
                icon: <PlayArrow />,
              });
            }
          }}
          className="h-full w-full cursor-pointer rounded-bl-2xl duration-200 hover:scale-110 hover:z-10 bg-card-blue"
        ></div>
        <div
          onClick={async () => {
            const wish = await gameWish("p");
            if (wish["code"] !== 200) {
              showNotification({
                autoClose: API_NOTIFICATION_GAME_TIMEOUT,
                message: wish["message"] ?? "An unknown error occurred.",
                color: "red",
                icon: <PlayArrow />,
              });
            }
          }}
          className="h-full w-full cursor-pointer rounded-br-2xl duration-200 hover:scale-110 hover:z-10 bg-card-purple"
        ></div>
      </div>
    </Modal>
  );
}
