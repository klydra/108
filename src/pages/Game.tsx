import React, { Component, useEffect, useState } from "react";
import CardFront from "../components/CardFront";
import { CardColor, CardType, codeToType, typeToCode } from "../models/Card";
import CardBack from "../components/CardBack";
import PocketBase from "pocketbase";
import {
  API_HOST,
  API_NOTIFICATION_GAME_TIMEOUT,
  API_NOTIFICATION_NOTICE_TIMEOUT,
  ensureRegistered,
  gameDraw,
  gamePlay,
  gameWish,
  joinGame,
  sessionOngoing,
  sessionStart,
} from "../api/API";
import { NavigateFunction } from "react-router";
import { showNotification } from "@mantine/notifications";
import { PlayArrow, SettingsOutlined, Wifi } from "@mui/icons-material";
import { Button, Modal } from "@mantine/core";
import { createAvatar } from "@dicebear/core";
import { loreleiNeutral } from "@dicebear/collection";

interface GameProps {
  game: string;
  navigate: NavigateFunction;
}

interface GameState {
  game: GameType | undefined;
  player: PlayerType | undefined;
  subscribed: boolean;
  animation: {
    appear: boolean;
    disappear: boolean;
  };
}

export default class Game extends Component<GameProps, GameState> {
  private pocketbase: PocketBase;

  constructor(props: GameProps) {
    super(props);

    this.state = {
      game: undefined,
      player: undefined,
      subscribed: false,
      animation: {
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

    if (!this.state.subscribed)
      await this.pocketbase
        .collection("players")
        .subscribe(localStorage.getItem("token")!, (change) =>
          this.setState({ player: change.record as Object as PlayerType })
        );

    if (!this.state.subscribed)
      await this.pocketbase
        .collection("games")
        .subscribe(this.props.game, (change) =>
          this.setState({ game: change.record as Object as GameType })
        );

    this.setState({ subscribed: true });

    if (!this.state.player || !this.state.game) {
      const player = (await this.pocketbase
        .collection("players")
        .getOne(localStorage.getItem("token")!)) as Object as PlayerType;

      const game = (await this.pocketbase
        .collection("games")
        .getOne(this.props.game)) as Object as GameType;

      if (game.live === player.name)
        showNotification({
          autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
          message: "It's your turn!",
          color: "violet",
          icon: <PlayArrow />,
        });

      this.setState({ player, game });
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
    if (
      (prevState.game &&
        this.state.game &&
        prevState.game!.stack.length < this.state.game!.stack.length) ||
      (prevState.player &&
        this.state.player &&
        prevState.player.hand.length > this.state.player.hand.length)
    )
      this.setState({
        animation: {
          appear: !this.state.animation.appear,
          disappear: this.state.animation.disappear,
        },
      });

    if (
      (prevState.game &&
        this.state.game &&
        prevState.game!.stack.length > this.state.game!.stack.length) ||
      (prevState.player &&
        this.state.player &&
        prevState.player.hand.length < this.state.player.hand.length)
    )
      this.setState({
        animation: {
          appear: this.state.animation.appear,
          disappear: !this.state.animation.disappear,
        },
      });

    if (
      prevState.game &&
      this.state.game &&
      this.state.player &&
      prevState.game.live != this.state.game.live &&
      this.state.game.live === this.state.player.name
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
        {/* Table */}
        <div className="absolute flex justify-center items-center bg-background h-[100vh] w-[100vw] p-[5%]">
          <div className="bg-table-background h-full w-full rounded-2xl drop-shadow-[0_5px_5px_rgba(255,255,255,0.25)] shadow-card-yellow"></div>
        </div>

        {this.state.game?.live ? this.Table() : this.Settings()}
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
            const start = await sessionStart();
            if (start["code"] !== 200) {
              showNotification({
                autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
                message: start["message"],
                color: "red",
                icon: <SettingsOutlined />,
              });
              return;
            }

            showNotification({
              autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
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
    const self = this.state.game?.players.find(
      (item) => item.name === this.state.player?.name
    );
    const enemies = this.state.game?.players.filter(
      (item) => item.name !== this.state.player?.name
    );

    const avatar = createAvatar(loreleiNeutral, {
      seed: this.state.player?.name,
    });
    const avatars = enemies?.map((enemy) =>
      createAvatar(loreleiNeutral, {
        seed: enemy.name,
      })
    );

    return (
      <>
        {/* Own card row */}
        <div className="fixed h-52 w-[60%] inset-x-[20%] bottom-[1%] flex gap-x-3 justify-center items-end">
          {this.state.player?.hand
            .map(codeToType)
            .map((card: CardType, index) => {
              return (
                <div
                  key={typeToCode(card) + index}
                  style={{
                    zIndex: this.state.player!.hand.length - index,
                    maxWidth: (1 / this.state.player!.hand.length) * 40 + "rem",
                  }}
                  className="cursor-pointer hover:-translate-y-3 hover:scale-110 duration-200 w-fit ease-out"
                  onClick={async () => {
                    const play = await gamePlay(typeToCode(card));
                    if (play["code"] !== 200) {
                      showNotification({
                        autoClose: API_NOTIFICATION_GAME_TIMEOUT,
                        message:
                          play["message"] ?? "An unknown error occurred.",
                        color: "red",
                        icon: <PlayArrow />,
                      });
                    }
                  }}
                >
                  <CardFront card={card} />
                </div>
              );
            })}
          {avatars ? (
            <div className="h-24 w-24 ml-8">
              <div
                className="h-24 w-24 rounded-xl overflow-hidden absolute z-10"
                dangerouslySetInnerHTML={{
                  __html: avatar.toString(),
                }}
              ></div>
              <div
                style={{
                  display:
                    this.state.game?.live === this.state.player?.name
                      ? ""
                      : "none",
                }}
                className="m-2 h-20 w-20 rounded-xl bg-contrast duration-300 absolute animate-ping"
              ></div>
            </div>
          ) : null}
        </div>

        {/* Left card row */}
        <div className="fixed w-44 h-[80%] inset-y-[10%] left-[1%] rotate-180 flex flex-col gap-y-3 justify-center items-start">
          {enemies && (enemies.length === 2 || enemies.length === 3) ? (
            <>
              {avatars ? (
                <div className="w-full mb-6 h-20 flex justify-end">
                  <div className="h-20 w-20">
                    <div
                      className="h-20 w-20 rounded-xl overflow-hidden absolute z-10 rotate-180"
                      dangerouslySetInnerHTML={{
                        __html: avatars[0].toString(),
                      }}
                    ></div>
                    <div
                      style={{
                        display:
                          this.state.game?.live === enemies[0].name
                            ? ""
                            : "none",
                      }}
                      className="m-2 h-16 w-16 rounded-xl bg-contrast duration-300 absolute animate-ping"
                    ></div>
                  </div>
                </div>
              ) : null}
              {[...Array(enemies[0].cards)].map((_, index) => {
                return (
                  <div
                    style={{
                      zIndex: index,
                      maxHeight: (1 / enemies[0].cards) * 30 + "rem",
                    }}
                    className=""
                  >
                    <EnemyCardRotated />
                  </div>
                );
              })}
            </>
          ) : null}
        </div>

        {/* Right card row */}
        <div className="fixed w-44 h-[80%] inset-y-[10%] right-[1%] flex flex-col gap-y-3 justify-center items-start">
          {enemies && (enemies.length === 2 || enemies.length === 3) ? (
            <>
              {[...Array(enemies[1].cards)].map((_, index) => {
                return (
                  <div
                    style={{
                      zIndex: index,
                      maxHeight: (1 / enemies[1].cards) * 30 + "rem",
                    }}
                    className="duration-200"
                  >
                    <EnemyCardRotated />
                  </div>
                );
              })}
              {avatars ? (
                <div className="w-full h-20 mt-16 flex justify-end">
                  <div className="h-20 w-20 rotate-180 rounded-xl">
                    <div
                      className="h-20 w-20 rounded-xl overflow-hidden absolute z-10 rotate-180"
                      dangerouslySetInnerHTML={{
                        __html: avatars[1].toString(),
                      }}
                    ></div>
                    <div
                      style={{
                        display:
                          this.state.game?.live === enemies[1].name
                            ? ""
                            : "none",
                      }}
                      className="m-2 h-16 w-16 rounded-xl bg-contrast duration-300 absolute animate-ping"
                    ></div>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        {/* Top card row */}
        <div className="fixed w-[80%] h-44 inset-x-[10%] top-[1%] flex gap-x-3 justify-center items-start">
          {enemies && (enemies.length === 1 || enemies.length === 3) ? (
            <>
              {avatars ? (
                <div className="h-20 w-20 mr-6">
                  <div
                    className="h-20 w-20 rounded-xl overflow-hidden absolute z-10"
                    dangerouslySetInnerHTML={{
                      __html: avatars[enemies.length === 1 ? 0 : 2].toString(),
                    }}
                  ></div>
                  <div
                    style={{
                      display:
                        this.state.game?.live ===
                        enemies[enemies.length === 1 ? 0 : 2].name
                          ? ""
                          : "none",
                    }}
                    className="m-2 h-16 w-16 rounded-xl bg-contrast duration-300 absolute animate-ping"
                  ></div>
                </div>
              ) : null}
              {[...Array(enemies[enemies.length === 1 ? 0 : 2].cards)].map(
                (_, index) => {
                  return (
                    <div
                      style={{
                        zIndex: index,
                        maxWidth:
                          (1 / enemies[enemies.length === 1 ? 0 : 2].cards) *
                            30 +
                          "rem",
                      }}
                      className=""
                    >
                      <EnemyCard />
                    </div>
                  );
                }
              )}
            </>
          ) : null}
        </div>

        {/* Call button */}
        <div className="fixed flex h-[12.5%] left-[80%] right-[10%] bottom-[6%]"></div>

        {/* Draw stack */}
        <div className="fixed flex inset-y-1/2 left-[37.5%] right-[50%] inset-y-[42%] flex justify-center items-center">
          <div
            key={this.state.animation.disappear.toString()}
            className="cursor-pointer h-full absolute z-10"
            onClick={async () => {
              const play = await gameDraw();
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
            <DisappearCard />
          </div>
          <CardBack />
        </div>

        {/* Play stack */}
        <div className="fixed flex inset-y-1/2 right-[37.5%] left-[50%] inset-y-[42%] flex justify-center items-center">
          <AppearCard
            key={this.state.game!.stack.length}
            card={codeToType(
              this.state.game!.stack[this.state.game!.stack.length - 1]
            )}
          />
          {/*<div
            key={this.state.animation.appear.toString()}
            className="scale-95 absolute"
          >
            <CardFront
              card={codeToType(
                this.state.game!.stack[this.state.game!.stack.length - 2]
              )}
            />
          </div>*/}
        </div>

        <Modal
          opened={!!self?.swapping}
          onClose={() => {}}
          closeOnClickOutside={false}
          centered
          withCloseButton={false}
          radius="xl"
          size="auto"
        ></Modal>

        <Modal
          opened={
            !!this.state.player &&
            !!this.state.game &&
            this.state.player!.name === this.state.game!.live &&
            this.state.game!.stack.pop()?.charAt(1) === CardColor.DARK
          }
          onClose={() => {}}
          closeOnClickOutside={false}
          centered
          withCloseButton={false}
          radius="xl"
          size="auto"
        >
          <div className="h-52 w-52 grid grid-rows-2 grid-cols-2 rounded-2xl gap-[0.3rem]">
            <div
              onClick={async () => {
                const wish = await gameWish("y");
                if (wish["code"] !== 200) {
                  showNotification({
                    autoClose: API_NOTIFICATION_GAME_TIMEOUT,
                    message: wish["message"] ?? "An unknown error occurred.",
                    color: "red",
                    icon: <PlayArrow />,
                  });
                }
              }}
              className="h-full w-full cursor-pointer rounded-tl-2xl duration-200 hover:scale-110 hover:z-10 bg-card-yellow"
            ></div>
            <div
              onClick={async () => {
                const wish = await gameWish("g");
                if (wish["code"] !== 200) {
                  showNotification({
                    autoClose: API_NOTIFICATION_GAME_TIMEOUT,
                    message: wish["message"] ?? "An unknown error occurred.",
                    color: "red",
                    icon: <PlayArrow />,
                  });
                }
              }}
              className="h-full w-full cursor-pointer rounded-tr-2xl duration-200 hover:scale-110 hover:z-10 bg-card-green"
            ></div>
            <div
              onClick={async () => {
                const wish = await gameWish("b");
                if (wish["code"] !== 200) {
                  showNotification({
                    autoClose: API_NOTIFICATION_GAME_TIMEOUT,
                    message: wish["message"] ?? "An unknown error occurred.",
                    color: "red",
                    icon: <PlayArrow />,
                  });
                }
              }}
              className="h-full w-full cursor-pointer rounded-bl-2xl duration-200 hover:scale-110 hover:z-10 bg-card-blue"
            ></div>
            <div
              onClick={async () => {
                const wish = await gameWish("p");
                if (wish["code"] !== 200) {
                  showNotification({
                    autoClose: API_NOTIFICATION_GAME_TIMEOUT,
                    message: wish["message"] ?? "An unknown error occurred.",
                    color: "red",
                    icon: <PlayArrow />,
                  });
                }
              }}
              className="h-full w-full cursor-pointer rounded-br-2xl duration-200 hover:scale-110 hover:z-10 bg-card-purple"
            ></div>
          </div>
        </Modal>
      </>
    );
  }
}

function DisappearCard() {
  const [disappear, setDisappear] = useState(false);
  useEffect(() => setDisappear(true), []);

  return (
    <div
      className="h-full duration-700 ease-out aria-disabled:scale-[125%] aria-disabled:opacity-0"
      aria-disabled={disappear}
    >
      <CardBack />
    </div>
  );
}

function AppearCard(props: { card: CardType }) {
  const [appear, setAppear] = useState(true);
  useEffect(() => setAppear(false), []);

  return (
    <div
      className="scale-95 duration-700 ease-out aria-disabled:scale-125 aria-disabled:opacity-50 absolute"
      aria-disabled={appear}
    >
      <CardFront card={props.card} />
    </div>
  );
}

function EnemyCard() {
  const [visible, setVisible] = useState(true);
  useEffect(() => setVisible(false), []);

  return (
    <div
      className="h-44 duration-200 ease-out aria-disabled:translate-y-60 aria-disabled:scale-0 aria-disabled:duration-300 aria-disabled:opacity-0"
      aria-disabled={visible}
    >
      <CardBack />
    </div>
  );
}

function EnemyCardRotated() {
  const [visible, setVisible] = useState(true);
  useEffect(() => setVisible(false), []);

  return (
    <div
      className="w-44 duration-200 ease-out aria-disabled:-translate-x-60 aria-disabled:scale-0 aria-disabled:duration-300 aria-disabled:opacity-0"
      aria-disabled={visible}
    >
      <CardBack rotated />
    </div>
  );
}
