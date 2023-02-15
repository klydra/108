import React, { Component } from "react";
import CardFront from "../components/CardFront";
import { CardColor, CardFace, CardType } from "../models/Card";
import CardBack from "../components/CardBack";
import PocketBase from "pocketbase";
import {
  API_HOST,
  API_NOTIFICATION_TIMEOUT,
  ensureRegistered,
  joinGame,
  sessionOngoing,
  sessionStart,
} from "../api/API";
import { NavigateFunction } from "react-router";
import { showNotification } from "@mantine/notifications";
import { PlayArrow, SettingsOutlined, Wifi } from "@mui/icons-material";
import { Button } from "@mantine/core";

interface GameProps {
  game: string;
  navigate: NavigateFunction;
}

interface GameState {
  game: GameType | undefined;
  player: PlayerType | undefined;
}

export default class Game extends Component<GameProps, GameState> {
  private pocketbase: PocketBase;

  constructor(props: GameProps) {
    super(props);

    this.state = {
      game: undefined,
      player: undefined,
    };

    this.pocketbase = new PocketBase(API_HOST);
  }

  async componentDidMount() {
    if (!(await ensureRegistered())) {
      this.props.navigate("/");
      return;
    }

    const ongoing = await sessionOngoing();
    if (!ongoing.hasOwnProperty("game")) {
      showNotification({
        autoClose: API_NOTIFICATION_TIMEOUT,
        message: ongoing["message"],
        color: "red",
        icon: <PlayArrow />,
      });

      this.props.navigate("/");
      return;
    }

    if (ongoing["game"] !== this.props.game && ongoing["game"] !== "")
      showNotification({
        autoClose: API_NOTIFICATION_TIMEOUT,
        message: "Participating in other game. Leaving...",
        color: "yellow",
        icon: <PlayArrow />,
      });

    const join = await joinGame(this.props.game);
    if (join !== this.props.game) {
      this.props.navigate("/");
      return;
    }

    const player = (await this.pocketbase
      .collection("players")
      .getOne(localStorage.getItem("token")!)) as Object as PlayerType;

    const game = (await this.pocketbase
      .collection("games")
      .getOne(this.props.game)) as Object as GameType;

    if (!this.state.player)
      await this.pocketbase
        .collection("players")
        .subscribe(localStorage.getItem("token")!, (change) =>
          this.setState({ player: change.record as Object as PlayerType })
        );

    if (!this.state.game)
      await this.pocketbase
        .collection("games")
        .subscribe(this.props.game, (change) =>
          this.setState({ game: change.record as Object as GameType })
        );

    this.setState({ player, game });

    showNotification({
      autoClose: API_NOTIFICATION_TIMEOUT,
      message: "Connected to game.",
      color: "green",
      icon: <Wifi />,
    });
  }

  async componentWillUnmount() {
    if (localStorage.getItem("token"))
      await this.pocketbase
        .collection("players")
        .unsubscribe(localStorage.getItem("token")!);
    await this.pocketbase.collection("games").unsubscribe(this.props.game);
  }

  render() {
    return (
      <>
        {/* Table */}
        <div className="absolute flex justify-center items-center bg-background h-[100vh] w-[100vw] px-[5%] py-[5%]">
          <div className="bg-table-background h-full w-full rounded-2xl drop-shadow-[0_5px_5px_rgba(255,255,255,0.25)] shadow-card-yellow"></div>
        </div>

        <this.Settings />
      </>
    );
  }

  Settings() {
    return (
      <div className="fixed h-full w-full flex justify-center items-center">
        <Button
          uppercase
          className={
            "h-36 w-36 rounded-[10rem] text-card-accent hover:bg-background bg-background"
          }
          onClick={async () => {
            const join = await sessionStart();
            if (join["code"] !== 200) {
              showNotification({
                autoClose: API_NOTIFICATION_TIMEOUT,
                message: join["message"],
                color: "red",
                icon: <SettingsOutlined />,
              });
              return;
            }

            showNotification({
              autoClose: API_NOTIFICATION_TIMEOUT,
              message: "Starting game...",
              color: "green",
              icon: <SettingsOutlined />,
            });
          }}
        >
          <div className="w-full h-full flex p-2 justify-center items-center">
            <PlayArrow style={{ width: "100%", height: "100%" }} />
          </div>
        </Button>
      </div>
    );
  }

  Table() {
    const card: CardType = {
      face: CardFace.NUMBER_3,
      color: CardColor.PURPLE,
    };

    return (
      <>
        {/* Own card row */}
        <div className="fixed h-52 w-[60%] inset-x-[20%] bottom-[1%] flex gap-x-3 justify-center items-end">
          {/*this.state.cards.map((index: number) => {
            console.log(index);

            return (
              <div
                style={{
                  zIndex: index,
                  maxWidth: (1 / this.state.cards.length) * 30 + "rem",
                }}
                className="hover:-translate-y-3 hover:scale-110 duration-100 w-fit ease-out aria-disabled:-translate-y-60 aria-disabled:scale-0 aria-disabled:duration-300 aria-disabled:opacity-0"
                aria-disabled={false}
              >
                <CardFront card={card} />
              </div>
            );
          })*/}
        </div>

        {/* Left card row */}
        <div className="fixed w-44 h-[80%] inset-y-[10%] left-[1%] rotate-180 flex flex-col justify-center items-end">
          <div
            className="w-full duration-100 ease-out aria-disabled:-translate-x-60 aria-disabled:scale-0 aria-disabled:duration-300 aria-disabled:opacity-0 "
            aria-disabled={false}
          >
            <CardBack rotated />
          </div>
        </div>

        {/* Right card row */}
        <div className="fixed w-44 h-[80%] inset-y-[10%] right-[1%] flex flex-col justify-center items-end">
          <div
            className="w-full duration-100 ease-out aria-disabled:-translate-x-60 aria-disabled:scale-0 aria-disabled:duration-300 aria-disabled:opacity-0"
            aria-disabled={false}
          >
            <CardBack rotated />
          </div>
        </div>

        {/* Top card row */}
        <div className="fixed w-[80%] h-44 inset-x-[10%] top-[1%] gap-2 flex justify-center items-start">
          <div
            className="h-full duration-100 ease-out aria-disabled:translate-y-60 aria-disabled:scale-0 aria-disabled:duration-300 aria-disabled:opacity-0"
            aria-disabled={false}
          >
            <CardBack />
          </div>
          <CardBack />
          <CardBack />
        </div>

        {/* Sort button */}
        <div className="fixed flex h-[12.5%] left-[10%] right-[80%] bottom-[6%]"></div>

        {/* Call button */}
        <div className="fixed flex h-[12.5%] left-[80%] right-[10%] bottom-[6%]"></div>

        {/* Draw stack */}
        <div className="fixed flex inset-y-1/2 left-[37.5%] right-[50%] inset-y-[42%] flex justify-center items-center">
          <div
            className="h-full duration-700 ease-out aria-disabled:scale-[166%] aria-disabled:opacity-0 absolute"
            aria-disabled={false}
          >
            <CardBack />
          </div>
          <CardBack />
        </div>

        {/* Play stack  */}
        <div className="fixed flex inset-y-1/2 right-[37.5%] left-[50%] inset-y-[42%] flex justify-center items-center">
          <div className="scale-75">
            <CardFront card={card} />
          </div>
          <div
            className="scale-75 duration-700 ease-out aria-disabled:scale-125 aria-disabled:opacity-50 absolute "
            aria-disabled={false}
          >
            <CardFront card={card} />
          </div>
        </div>
      </>
    );
  }
}
