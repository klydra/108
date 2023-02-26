import React, { Component } from "react";
import PocketBase from "pocketbase";
import {
  API_HOST,
  API_NOTIFICATION_NOTICE_TIMEOUT,
  ensureRegistered,
  joinGame,
  sessionOngoing,
} from "../api/API";
import { NavigateFunction } from "react-router";
import { showNotification } from "@mantine/notifications";
import { PlayArrow, Wifi } from "@mui/icons-material";
import { sessionConstruct } from "../models/Session";
import LobbyPlayers from "../components/game/lobby/LobbyPlayers";
import LobbySettings from "../components/game/lobby/LobbySettings";
import LobbyStart from "../components/game/lobby/LobbyStart";
import SessionRows from "../components/game/session/SessionRows";
import SessionCall from "../components/game/session/SessionCall";
import StackDraw from "../components/game/session/stacks/StackDraw";
import StackPlay from "../components/game/session/stacks/StackPlay";
import SessionWish from "../components/game/session/SessionWish";
import SessionBackground from "../components/game/SessionBackground";

interface GameProps {
  game: string;
  navigate: NavigateFunction;
}

interface GameState {
  player: PlayerType | undefined;
  game: GameType | undefined;
  animator: AnimatorType;
}

export default class Game extends Component<GameProps, GameState> {
  private pocketbase: PocketBase;

  constructor(props: GameProps) {
    super(props);

    this.state = {
      player: undefined,
      game: undefined,
      animator: {
        appear: false,
        disappear: false,
      },
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
        autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
        message: ongoing["message"],
        color: "red",
        icon: <PlayArrow />,
      });

      this.props.navigate("/");
      return;
    }

    if (ongoing["game"] !== this.props.game) {
      if (ongoing["game"] !== "") {
        showNotification({
          autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
          message: "Participating in other game. Leaving...",
          color: "yellow",
          icon: <PlayArrow />,
        });
      }

      const join = await joinGame(this.props.game);
      if (join !== this.props.game) {
        this.props.navigate("/");
        return;
      }
    }

    await this.pocketbase
      .collection("players")
      .subscribe(localStorage.getItem("token")!, (change) =>
        this.setState({ player: change.record as Object as PlayerType })
      );

    await this.pocketbase
      .collection("games")
      .subscribe(this.props.game, (change) =>
        this.setState({ game: change.record as Object as GameType })
      );

    const player = (await this.pocketbase
      .collection("players")
      .getOne(localStorage.getItem("token")!)) as Object as PlayerType;

    const game = (await this.pocketbase
      .collection("games")
      .getOne(this.props.game)) as Object as GameType;

    this.setState({ player, game });

    showNotification({
      autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
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

  componentDidUpdate(
    _: Readonly<GameProps>,
    prevState: Readonly<GameState>,
    __?: any
  ) {
    if (prevState.game && this.state.game) {
      if (prevState.game!.stack.length < this.state.game!.stack.length)
        this.setState({
          animator: {
            appear: !this.state.animator.appear,
            disappear: this.state.animator.disappear,
          },
        });

      if (prevState.game!.stack.length > this.state.game!.stack.length)
        this.setState({
          animator: {
            appear: this.state.animator.appear,
            disappear: !this.state.animator.disappear,
          },
        });
    }

    if (
      this.state.player &&
      prevState.game?.globals.live &&
      this.state.game?.globals.live &&
      this.state.player.name !== prevState.game!.globals.live &&
      this.state.player.name === this.state.game!.globals.live
    )
      showNotification({
        autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
        message: "It's your turn!",
        color: "violet",
        icon: <PlayArrow />,
      });
  }

  render() {
    if (!this.state.player || !this.state.game) return <SessionBackground />;

    const session = sessionConstruct(this.state.player, this.state.game);
    console.log(session);

    return (
      <>
        <SessionBackground />
        {session.globals.live !== "" ? (
          <>
            <SessionRows session={session!} />
            <SessionCall session={session!} />
            <StackDraw session={session!} animator={this.state.animator} />
            <StackPlay session={session!} animator={this.state.animator} />
            <SessionWish session={session!} />
          </>
        ) : (
          <div className="px-[5%] py-[8%] h-[100vh] w-[100vw] flex flex-row fixed justify-evenly items-center gap-x-[1.5rem]">
            <LobbyPlayers session={session} />
            <LobbySettings session={session} />
            <LobbyStart session={session} />
          </div>
        )}
      </>
    );
  }
}
