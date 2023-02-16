import { sessionLast, SessionType } from "../../../../models/Session";
import { API_NOTIFICATION_GAME_TIMEOUT, gameSwitch } from "../../../../api/API";
import { showNotification } from "@mantine/notifications";
import { SwapHoriz } from "@mui/icons-material";
import React from "react";
import { EnemyCard } from "../SessionRows";

export default function RowTop(props: { session: SessionType; scale: number }) {
  const swapping = props.session.me.live && props.session.global.swapping;

  const full =
    props.session.enemies.length === 1 || props.session.enemies.length === 3;
  const enemy = full
    ? props.session.enemies[props.session.enemies.length === 1 ? 0 : 2]
    : null;
  const callable = full
    ? enemy!.live &&
      !enemy!.called &&
      enemy!.cards < 2 &&
      enemy!.name === sessionLast(props.session)
    : null;

  return (
    <div className="fixed w-[80%] h-44 inset-x-[10%] top-[1%] flex gap-x-3 justify-center items-start">
      {full ? (
        <>
          <div
            className="h-20 w-20 mr-6 drop-shadow-2xl"
            style={{
              cursor: swapping || callable! ? "pointer" : "",
            }}
            onClick={
              swapping || callable!
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
                : undefined
            }
          >
            <div
              className="h-20 w-20 rounded-xl overflow-hidden absolute z-10"
              dangerouslySetInnerHTML={{
                __html: enemy!.avatar,
              }}
            ></div>
            <div
              className="m-2 h-16 w-16 rounded-xl bg-contrast duration-300 absolute animate-ping"
              style={{
                display: enemy!.live || swapping || callable! ? "" : "none",
                backgroundColor: swapping || callable! ? "purple" : "",
              }}
            ></div>
          </div>
          {[...Array(enemy!.cards)].map((_, index) => {
            return (
              <div
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
        </>
      ) : null}
    </div>
  );
}
