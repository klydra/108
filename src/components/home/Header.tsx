import { Button } from "@mantine/core";
import { ArrowCircleDown, PlayArrow } from "@mui/icons-material";
import React from "react";
import Icon from "./Icon";

export default function Header(props: { theme: string; setModal: Function }) {
  return (
    <div className="w-full h-[100vh] flex flex-col justify-evenly items-center">
      <div className="w-full h-full flex flex-col justify-evenly items-center gap-y-16">
        <div className="mt-12 px-12 w-full flex flex-col justify-center items-center gap-y-16">
          <div className="flex justify-center items-end gap-x-12">
            <div className="h-[150%]">
              <Icon />
            </div>
            <b className="text-card-accent text-[6rem] font-default">
              108.cards
            </b>
          </div>
          <p className="text-card-accent text-[2.5rem] font-default whitespace-nowrap">
            The <b>classic game</b> for <b>everyone</b>!
          </p>
        </div>
        <div className="flex justify-center items-center">
          <Button
            uppercase
            className={
              "h-36 w-36 rounded-[10rem] text-background hover:bg-card-" +
              props.theme +
              " bg-card-" +
              props.theme
            }
            onClick={() => props.setModal(true)}
          >
            <div className="w-full h-full flex p-2 justify-center items-center">
              <PlayArrow style={{ width: "100%", height: "100%" }} />
            </div>
          </Button>
          <div className="hidden bg-card-yellow bg-card-green bg-card-blue bg-card-purple hover:bg-card-yellow hover:bg-card-green hover:bg-card-blue hover:bg-card-purple"></div>
        </div>
      </div>
      <div className="w-full h-[10%] flex justify-center items-center">
        <div className="animate-bounce opacity-50 ease-in-out text-contrast h-16 w-16">
          <ArrowCircleDown style={{ width: "100%", height: "100%" }} />
        </div>
      </div>
    </div>
  );
}
