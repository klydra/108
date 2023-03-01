import { sessionLast, SessionType } from "../../../../models/Session";
import {
  API_NOTIFICATION_GAME_TIMEOUT,
  gameAppeal,
  gameSwitch,
} from "../../../../api/API";
import { showNotification } from "@mantine/notifications";
import { SwapHoriz } from "@mui/icons-material";
import React from "react";
import { calledAvatar, EnemyCard } from "../SessionRows";

export default function RowTop(props: { session: SessionType; scale: number }) {
  const swapping = props.session.me.live && props.session.globals.swapping;

  const full =
    props.session.enemies.length === 1 || props.session.enemies.length === 3;
  const enemy = full
    ? props.session.enemies.find(
        (item) => item.spot === (props.session.enemies.length === 1 ? 1 : 2)
      )
    : null;
  const callable = full
    ? !enemy!.called &&
      enemy!.cards < 2 &&
      enemy!.name === sessionLast(props.session)
    : null;
  const offset = !full ? Math.round(props.session.enemies.length / 3) : null;
  const divide = !full
    ? Array.from(
        {
          length:
            props.session.enemies.length -
            Math.round(props.session.enemies.length / 3) * 2,
        },
        (_, i) => offset! + i + 1
      )
    : null;

  if (full)
    return (
      <div className="fixed w-[80%] h-44 inset-x-[10%] top-[1%] flex gap-x-3 justify-center items-start">
        <div
          className="h-20 w-20 mr-6 drop-shadow-2xl"
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
                      message: swap["message"] ?? "An unknown error occurred.",
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
            className="h-20 w-20 rounded-xl overflow-hidden absolute z-10"
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
        {[...Array(enemy!.cards)].map((_, index) => {
          return (
            <div
              key={index}
              style={{
                zIndex: index,
                maxWidth: (1 / enemy!.cards) * props.scale + "rem",
              }}
              className=""
            >
              <EnemyCard />
            </div>
          );
        })}
      </div>
    );

  return (
    <div className="fixed w-[80%] h-44 inset-x-[10%] top-[1%] flex gap-x-4 justify-center items-start">
      {divide!.map((index) => {
        const enemy = props.session.enemies.find((item) => item.spot === index);

        return (
          <div className="mt-2 flex flex-col justify-center items-center">
            <div className="w-full h-16 mb-3.5 flex justify-end drop-shadow-2xl">
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
            <div className="flex justify-center items-center rounded-[50%] w-10 h-10 p-2 font-bold text-background font-[1.1rem] aspect-square bg-contrast">
              {enemy!.cards}
            </div>
          </div>
        );
      })}
    </div>
  );
}
