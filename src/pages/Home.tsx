import React, { useState } from "react";
import { CardColor } from "../models/Card";
import { NavigateFunction } from "react-router";
import HomeHeader from "../components/home/HomeHeader";
import HomePlay from "../components/home/HomePlay";
import HomeMechanics from "../components/home/HomeMechanics";
import HomeRules from "../components/home/HomeRules";
import HomeContact from "../components/home/HomeContact";

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
          <HomeHeader theme={themeName} setModal={setModal} />
          <HomeMechanics theme={themeColor} />
          <HomeRules theme={themeColor} />
          <HomeContact />
        </div>
      </div>
      <HomePlay
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
