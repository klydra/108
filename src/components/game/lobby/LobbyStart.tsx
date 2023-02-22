import { SessionType } from "../../../models/Session";
import { Button } from "@mantine/core";
import {
  API_NOTIFICATION_NOTICE_TIMEOUT,
  sessionStart,
} from "../../../api/API";
import { showNotification } from "@mantine/notifications";
import { PlayArrow, SettingsOutlined } from "@mui/icons-material";
import React from "react";

export default function LobbyStart(props: { session: SessionType }) {
  return (
    <div className="h-full max-h-full max-w-[12rem] flex flex-col flex-grow flex-wrap justify-center items-center gap-4">
      <Button
        disabled={!props.session.me.host || props.session.enemies.length === 0}
        uppercase
        className={
          "h-24 w-24 rounded-[10rem] text-card-accent hover:bg-background bg-background"
        }
        onClick={async () => {
          const start = await sessionStart();
          if (start["code"] !== 200) {
            showNotification({
              autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
              message: start["message"],
              color: "red",
              icon: <SettingsOutlined />,
            });
            return;
          }

          showNotification({
            autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
            message: "Starting game...",
            color: "green",
            icon: <SettingsOutlined />,
          });
        }}
      >
        <div className="w-full h-full flex p-1 justify-center items-center">
          <PlayArrow style={{ width: "100%", height: "100%" }} />
        </div>
      </Button>
    </div>
  );
}
