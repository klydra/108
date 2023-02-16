import React from "react";
import { Column, Heading, Row } from "./HomeLayout";
import { HomeDiscord, HomeGithub, HomeMail } from "./HomeSymbols";

export default function HomeContact() {
  return (
    <>
      <Heading title="contact" />
      <Row>
        <Column>
          <div className="h-[5rem] flex w-full justify-center items-center">
            <p className="px-2 text-[2.2rem] text-card-accent font-semibold tracking-[.01em] font-default">
              Jan Klinge (@klydra)
            </p>
          </div>
        </Column>
        <Column>
          <div className="h-[5rem] flex w-full justify-center items-center">
            <p className="px-2 text-[2.2rem] text-card-accent font-semibold tracking-[.01em] font-default">
              Justin Lippold (@fluvacc)
            </p>
          </div>
        </Column>
        <Column>
          <div className="mt-16 grid gap-[8rem] grid-cols-3">
            <Contact link="mailto:jan@108.cards">
              <HomeMail />
              Mail
            </Contact>
            <Contact link="https://discord.com/users/454335808497909760">
              <HomeDiscord />
              Discord
            </Contact>
            <Contact link="https://github.com/klydra">
              <HomeGithub />
              GitHub
            </Contact>
          </div>
        </Column>
        <Column>
          <div className="mt-16 grid gap-[8rem] grid-cols-2">
            <Contact link="mailto:justin@108.cards">
              <HomeMail />
              Mail
            </Contact>
            <Contact link="https://discord.com/users/323172856143806476">
              <HomeDiscord />
              Discord
            </Contact>
          </div>
        </Column>
      </Row>
    </>
  );
}

function Contact(props: { link: string; children: React.ReactNode }) {
  return (
    <div
      onClick={() => window.open(props.link, "_blank")}
      className="cursor-pointer text-[1rem] text-card-accent font-semibold tracking-[.01em] font-default duration-200 ease-in-out hover:scale-125 flex flex-col justify-center items-center"
    >
      {props.children}
    </div>
  );
}
