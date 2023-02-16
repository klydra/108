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
import { Code, PlayArrow, Wifi } from "@mui/icons-material";
import {
  patchGame,
  patchPlayer,
  sessionConstruct,
  SessionType,
} from "../models/Session";
import LobbyPlayers from "../components/game/lobby/LobbyPlayers";
import LobbySettings from "../components/game/lobby/LobbySettings";
import LobbyStart from "../components/game/lobby/LobbyStart";
import SessionRows from "../components/game/session/SessionRows";
import SessionCall from "../components/game/session/SessionCall";
import StackDraw from "../components/game/session/stacks/StackDraw";
import StackPlay from "../components/game/session/stacks/StackPlay";
import SessionWish from "../components/game/session/SessionWish";

interface GameProps {
  game: string;
  navigate: NavigateFunction;
}

interface GameState {
  session: SessionType | undefined;
  animator: AnimatorType;
}

export default class Game extends Component<GameProps, GameState> {
  private pocketbase: PocketBase;

  constructor(props: GameProps) {
    super(props);

    this.state = {
      session: undefined,
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
      .subscribe(localStorage.getItem("token")!, (change) => {
        const player = change.record as Object as PlayerType;

        if (this.state.session)
          this.setState({ session: patchPlayer(player, this.state.session!) });
        else
          showNotification({
            autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
            message: "Failed to patch players update.",
            color: "red",
            icon: <Code />,
          });
      });

    await this.pocketbase
      .collection("games")
      .subscribe(this.props.game, (change) => {
        const game = change.record as Object as GameType;

        if (this.state.session)
          this.setState({ session: patchGame(game, this.state.session!) });
        else
          showNotification({
            autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
            message: "Failed to patch game update.",
            color: "red",
            icon: <Code />,
          });
      });

    if (!this.state.session) {
      const player = (await this.pocketbase
        .collection("players")
        .getOne(localStorage.getItem("token")!)) as Object as PlayerType;

      const game = (await this.pocketbase
        .collection("games")
        .getOne(this.props.game)) as Object as GameType;

      this.setState({ session: sessionConstruct(player, game) });
    }

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
    if (prevState.session && this.state.session) {
      if (prevState.session!.stack.length < this.state.session!.stack.length)
        this.setState({
          animator: {
            appear: !this.state.animator.appear,
            disappear: this.state.animator.disappear,
          },
        });

      if (prevState.session!.stack.length > this.state.session!.stack.length)
        this.setState({
          animator: {
            appear: this.state.animator.appear,
            disappear: !this.state.animator.disappear,
          },
        });
    }

    if (
      !prevState.session?.me.live &&
      this.state.session &&
      this.state.session.me.live
    )
      showNotification({
        autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
        message: "It's your turn!",
        color: "violet",
        icon: <PlayArrow />,
      });
  }

  render() {
    return (
      <>
        <div className="absolute flex justify-center items-center bg-background h-[100vh] w-[100vw] p-[5%]">
          <div className="bg-table-background h-full w-full rounded-2xl drop-shadow-[0_5px_5px_rgba(255,255,255,0.25)] shadow-card-yellow"></div>
        </div>

        {!this.state.session ? null : !!this.state.session.global.live ? (
          <>
            <SessionRows session={this.state.session!} />
            <SessionCall session={this.state.session!} />
            <StackDraw
              session={this.state.session!}
              animator={this.state.animator}
            />
            <StackPlay
              session={this.state.session!}
              animator={this.state.animator}
            />
            <SessionWish session={this.state.session!} />
          </>
        ) : (
          <div className="px-[5%] py-[8%] h-[100vh] w-[100vw] flex flex-row fixed justify-evenly items-center gap-x-[1.5rem]">
            <LobbyPlayers session={this.state.session} />
            <LobbySettings session={this.state.session} />
            <LobbyStart session={this.state.session} />
          </div>
        )}
      </>
    );
  }
}
