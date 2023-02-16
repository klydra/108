import { Button, Input, Modal } from "@mantine/core";
import {
  API_NOTIFICATION_NOTICE_TIMEOUT,
  createGame,
  ensureRegistered,
  sessionJoin,
} from "../../api/API";
import { Groups, MoreHoriz, PlayArrow } from "@mui/icons-material";
import React, { ChangeEvent, useState } from "react";
import { showNotification } from "@mantine/notifications";
import { NavigateFunction } from "react-router";

export default function HomePlay(props: {
  modal: boolean;
  setModal: Function;
  theme: string;
  navigate: NavigateFunction;
}) {
  const [game, setGame] = useState("");

  return (
    <Modal
      centered
      withCloseButton={false}
      opened={props.modal}
      onClose={() => props.setModal(false)}
      radius="xl"
      size="auto"
    >
      <div className="h-[15rem] w-[47rem] bg-background flex justify-evenly items-center">
        <div className="h-full w-[35%] flex flex-col justify-evenly items-center">
          <b className="select-none text-card-accent text-[2rem] font-default">
            Start fresh
          </b>
          <div className="min-w-full h-1/2 flex justify-center items-center">
            <Button
              uppercase
              className={
                "h-24 w-24 rounded-[10rem] text-background hover:bg-card-" +
                props.theme +
                " bg-card-" +
                props.theme
              }
              onClick={async () => {
                if (!(await ensureRegistered())) return;
                const game = await createGame();
                props.navigate("/" + game);
              }}
            >
              <div className="w-full h-full flex p-2 justify-center items-center">
                <PlayArrow style={{ width: "100%", height: "100%" }} />
              </div>
            </Button>
          </div>
        </div>
        <div className="w-[0.25rem] h-[72%] rounded-2xl bg-contrast opacity-20"></div>
        <div className="h-full w-[55%] flex flex-col justify-evenly items-center">
          <b className="select-none text-card-accent text-[2rem] font-default">
            Join in
          </b>
          <div className="min-w-full px-12 h-1/2 flex justify-center items-center">
            <Input
              className="rounded-2xl w-full"
              size="lg"
              value={game}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setGame(event.target.value)
              }
              icon={<Groups />}
              iconWidth={52}
              placeholder="Code"
              maxLength={15}
              rightSection={
                <Button
                  uppercase
                  className={
                    "w-full h-full aspect-[1] rounded-lg text-background hover:bg-card-" +
                    props.theme +
                    " bg-card-" +
                    props.theme
                  }
                  onClick={async () => {
                    if (game.length !== 15) {
                      showNotification({
                        autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
                        message: "The specified code is invalid.",
                        color: "red",
                        icon: <MoreHoriz />,
                      });
                      return;
                    }

                    if (!(await ensureRegistered())) return;

                    const join = await sessionJoin(game);
                    if (join["code"] !== 200) {
                      showNotification({
                        autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
                        message: join["message"],
                        color: "red",
                        icon: <PlayArrow />,
                      });
                      return;
                    }

                    props.navigate("/" + game);
                  }}
                >
                  <div className="w-full h-full flex justify-center items-center">
                    <PlayArrow style={{ width: "150%", height: "150%" }} />
                  </div>
                </Button>
              }
              rightSectionWidth={52}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
