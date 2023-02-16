import React, { useState } from "react";
import { CardColor } from "../models/Card";
import { NavigateFunction } from "react-router";
import Header from "../components/home/Header";
import Play from "../components/home/Play";
import Mechanics from "../components/home/Mechanics";
import Rules from "../components/home/Rules";
import Contact from "../components/home/Contact";

export default function Home(props: { navigate: NavigateFunction }) {
  const [theme, _] = useState(
    Math.floor(Math.random() * Object.keys(CardColor).length - 1)
  );
  const [themeName, ___] = useState(getThemeName(theme));
  const [themeColor, __] = useState(getThemeColor(theme));

  const [modal, setModal] = useState(false);

  return (
    <>
      <div className="bg-background w-full flex justify-center">
        <div className="w-full max-w-[120rem]">
          <Header theme={themeName} setModal={setModal} />
          <Mechanics theme={themeColor} />
          <Rules theme={themeColor} />
          <Contact />
        </div>
      </div>
      <Play
        modal={modal}
        setModal={setModal}
        theme={themeName}
        navigate={props.navigate}
      />
    </>
  );
}

function getThemeName(theme: number) {
  switch (theme) {
    case 0:
      return "yellow";
    case 1:
      return "green";
    case 2:
      return "blue";
    case 3:
    default:
      return "purple";
  }
}

function getThemeColor(theme: number) {
  switch (theme) {
    case 0:
      return CardColor.YELLOW;
    case 1:
      return CardColor.GREEN;
    case 2:
      return CardColor.BLUE;
    case 3:
    default:
      return CardColor.PURPLE;
  }
}
