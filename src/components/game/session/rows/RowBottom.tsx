import { SessionType } from "../../../../models/Session";
import { CardType, codeToType, typeToCode } from "../../../../models/Card";
import { API_NOTIFICATION_GAME_TIMEOUT, gamePlay } from "../../../../api/API";
import { showNotification } from "@mantine/notifications";
import { PlayArrow } from "@mui/icons-material";
import CardFront from "../../../card/front/CardFront";
import React from "react";

export default function RowBottom(props: {
  session: SessionType;
  scale: number;
  rotation: number;
  translation: number;
}) {
  return (
    <div className="fixed h-52 w-[60%] inset-x-[20%] bottom-[1.8%] flex gap-x-3 justify-center items-end">
      {props.session.me.hand.map(codeToType).map((card: CardType, index) => {
        const variation =
          -((props.session.me.hand.length - 1) / 2 - index) /
          props.session.me.hand.length;

        return (
          <div
            key={typeToCode(card) + index}
            style={{
              transform:
                "rotate(" +
                variation * props.rotation +
                "deg) translate(0," +
                Math.abs(variation) * props.translation +
                "rem)",
              zIndex: props.session.me.hand.length - index,
              maxWidth:
                (1 / props.session.me.hand.length) * props.scale + "rem",
            }}
          >
            <div
              className="cursor-pointer hover:-translate-y-3 hover:scale-110 duration-200 w-fit ease-out"
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
              <CardFront card={card} />
            </div>
          </div>
        );
      })}
      <div className="h-24 w-24 ml-8 drop-shadow-2xl">
        <div
          className="h-24 w-24 rounded-xl overflow-hidden absolute z-10"
          dangerouslySetInnerHTML={{
            __html: props.session.me.avatar,
          }}
        ></div>
        <div
          className="m-2 h-20 w-20 rounded-xl bg-contrast duration-300 absolute animate-ping"
          style={{
            display: props.session.me.live ? "" : "none",
          }}
        ></div>
      </div>
    </div>
  );
}
