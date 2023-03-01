import { sessionLast, SessionType } from "../../../../models/Session";
import {
  API_NOTIFICATION_GAME_TIMEOUT,
  gameAppeal,
  gameSwitch,
} from "../../../../api/API";
import { showNotification } from "@mantine/notifications";
import { SwapHoriz } from "@mui/icons-material";
import React from "react";
import { calledAvatar, EnemyCardRotated } from "../SessionRows";

export default function RowRight(props: {
  session: SessionType;
  scale: number;
}) {
  const swapping = props.session.me.live && props.session.globals.swapping;

  const full =
    props.session.enemies.length === 2 || props.session.enemies.length === 3;
  const enemy = full
    ? props.session.enemies.find(
        (item) => item.spot === (props.session.enemies.length === 2 ? 2 : 3)
      )
    : null;
  const callable = full
    ? !enemy!.called &&
      enemy!.cards < 2 &&
      enemy!.name === sessionLast(props.session)
    : null;
  const offset = !full
    ? props.session.enemies.length -
      Math.round(props.session.enemies.length / 3)
    : null;
  const divide = !full
    ? Array.from(
        { length: Math.round(props.session.enemies.length / 3) },
        (_, i) => offset! + i + 1
      )
    : null;

  if (full)
    return (
      <div className="fixed w-44 h-[80%] inset-y-[10%] right-[1%] flex flex-col gap-y-3 justify-center items-start">
        {[...Array(enemy!.cards)].map((_, index) => {
          return (
            <div
              style={{
                zIndex: index,
                maxHeight: (1 / enemy!.cards) * props.scale + "rem",
              }}
              className="duration-200"
            >
              <EnemyCardRotated />
            </div>
          );
        })}
        <div className="w-full h-20 mt-16 flex justify-end drop-shadow-2xl">
          <div
            className="h-20 w-20 rotate-180 rounded-xl"
            style={{
              cursor: swapping || callable! ? "pointer" : "",
            }}
            onClick={
              swapping
                ? async () => {
                    const swap = await gameSwitch(enemy!.name);
                    if (swap["code"] !== 200) {
                      showNotification({
                        autoClose: API_NOTIFICATION_GAME_TIMEOUT,
                        message:
                          swap["message"] ?? "An unknown error occurred.",
                        color: "red",
                        icon: <SwapHoriz />,
                      });
                    }
                  }
                : callable!
                ? async () => {
                    const appeal = await gameAppeal(enemy!.name);
                    if (appeal["code"] !== 200) {
                      showNotification({
                        autoClose: API_NOTIFICATION_GAME_TIMEOUT,
                        message:
                          appeal["message"] ?? "An unknown error occurred.",
                        color: "red",
                        icon: <SwapHoriz />,
                      });
                    }
                  }
                : undefined
            }
          >
            <div
              className="h-20 w-20 rounded-xl overflow-hidden absolute z-10 rotate-180"
              dangerouslySetInnerHTML={{
                __html: enemy!.called
                  ? calledAvatar(enemy!.avatar)
                  : enemy!.avatar,
              }}
            ></div>
            <div
              className="m-2 h-16 w-16 rounded-xl bg-contrast duration-300 absolute animate-ping"
              style={{
                display: enemy!.live || swapping || callable! ? "" : "none",
                backgroundColor: enemy!.called
                  ? "gold"
                  : swapping
                  ? "orange"
                  : callable!
                  ? "red"
                  : "",
              }}
            ></div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="fixed w-44 h-[80%] inset-y-[10%] right-[1%] flex flex-col gap-y-4 justify-center items-end">
      {divide!.map((index) => {
        const enemy = props.session.enemies.find((item) => item.spot === index);

        return (
          <div className="mr-2 flex justify-center items-center">
            <div className="flex justify-center items-center rounded-[50%] w-10 h-10 p-2 font-bold text-background font-[1.1rem] aspect-square bg-contrast">
              {enemy!.cards}
            </div>
            <div className="w-full h-16 ml-3.5 flex justify-end drop-shadow-2xl">
              <div
                className="h-16 w-16 rotate-180 rounded-xl"
                style={{
                  cursor: swapping || callable! ? "pointer" : "",
                }}
                onClick={
                  swapping
                    ? async () => {
                        const swap = await gameSwitch(enemy!.name);
                        if (swap["code"] !== 200) {
                          showNotification({
                            autoClose: API_NOTIFICATION_GAME_TIMEOUT,
                            message:
                              swap["message"] ?? "An unknown error occurred.",
                            color: "red",
                            icon: <SwapHoriz />,
                          });
                        }
                      }
                    : callable!
                    ? async () => {
                        const appeal = await gameAppeal(enemy!.name);
                        if (appeal["code"] !== 200) {
                          showNotification({
                            autoClose: API_NOTIFICATION_GAME_TIMEOUT,
                            message:
                              appeal["message"] ?? "An unknown error occurred.",
                            color: "red",
                            icon: <SwapHoriz />,
                          });
                        }
                      }
                    : undefined
                }
              >
                <div
                  className="h-16 w-16 rounded-xl overflow-hidden absolute z-10 rotate-180"
                  dangerouslySetInnerHTML={{
                    __html: enemy!.called
                      ? calledAvatar(enemy!.avatar)
                      : enemy!.avatar,
                  }}
                ></div>
                <div
                  className="m-2 h-12 w-12 rounded-xl bg-contrast duration-300 absolute animate-ping"
                  style={{
                    display: enemy!.live || swapping || callable! ? "" : "none",
                    backgroundColor: enemy!.called
                      ? "gold"
                      : swapping
                      ? "orange"
                      : callable!
                      ? "red"
                      : "",
                  }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
