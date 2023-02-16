import { SessionType } from "../../../models/Session";
import { Button } from "@mantine/core";
import { API_NOTIFICATION_NOTICE_TIMEOUT, gameCall } from "../../../api/API";
import { showNotification } from "@mantine/notifications";
import { SettingsOutlined } from "@mui/icons-material";
import React from "react";

export default function SessionCall(props: { session: SessionType }) {
  return (
    <div className="fixed flex h-[12.5%] right-[80%] left-[10%] bottom-[6%] justify-center items-center">
      {props.session.me.hand.length === 2 &&
      !props.session.me.called &&
      props.session.me.live ? (
        <Button
          uppercase
          className={
            "h-28 w-28 rounded-[10rem] text-card-accent ease-out duration-100 hover:scale-110 hover:bg-contrast bg-contrast shadow-background drop-shadow-2xl"
          }
          onClick={async () => {
            const call = await gameCall();
            if (call["code"] !== 200) {
              showNotification({
                autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
                message: call["message"],
                color: "red",
                icon: <SettingsOutlined />,
              });
              return;
            }

            showNotification({
              autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
              message: "Called ONE!",
              color: "green",
              icon: <SettingsOutlined />,
            });
          }}
        >
          <div className="w-full h-full flex justify-center items-center text-[1.6rem] text-background font-default font-semibold">
            ONE
          </div>
        </Button>
      ) : null}
    </div>
  );
}