import React from "react";
import { Column, Heading, Row } from "./HomeLayout";

export default function HomeContact() {
  return (
    <>
      <Heading title="contact" />
      <Row>
        <Column>
          <div className="h-[5rem] flex w-full justify-center items-center">
            <p className="px-2 pb-2 text-[2.2rem] text-card-accent font-semibold tracking-[.01em] font-default">
              {" "}
              Jan Klinge (Klydra){" "}
            </p>
          </div>
        </Column>
        <Column>
          <div className="h-[5rem] flex w-full justify-center items-center">
            <p className="px-2 pb-2 text-[2.2rem] text-card-accent font-semibold tracking-[.01em] font-default">
              {" "}
              Justin Lippold (FluVacc){" "}
            </p>
          </div>
        </Column>
        <Column>
          <div className="grid gap-[5rem] grid-cols-3">
            <div className="text-[1rem] text-card-accent font-semibold tracking-[.01em] font-default hover:scale-125 flex flex-col justify-center items-center">
              <img className="h-[4rem]" src="mail.svg" />
              Mail
            </div>
            <div className="text-[1rem] text-card-accent font-semibold tracking-[.01em] font-default hover:scale-125 flex flex-col justify-center items-center">
              <img className="h-[4rem]" src="discord.svg" />
              Discord
            </div>
            <div className="text-[1rem] text-card-accent font-semibold tracking-[.01em] font-default hover:scale-125 flex flex-col justify-center items-center">
              <img className="h-[4rem]" src="octocat.svg" />
              GitHub
            </div>
          </div>
        </Column>
        <Column>
          <div className="grid gap-[5rem] grid-cols-2">
            <div className="text-[1rem] text-card-accent font-semibold tracking-[.01em] font-default hover:scale-125 flex flex-col justify-center items-center">
              <img className="h-[4rem]" src="mail.svg" />
              Mail
            </div>
            <div className="text-[1rem] text-card-accent font-semibold tracking-[.01em] font-default hover:scale-125 flex flex-col justify-center items-center">
              <img className="h-[4rem]" src="discord.svg" />
              Discord
            </div>
          </div>
        </Column>
      </Row>
      <div className="flex justify-center items-center h-[1rem] text-card-accent font-semibold tracking-[.01em] font-default pb-[3rem]">
        Copyright 2023, Jan Klinge
      </div>
    </>
  );
}
