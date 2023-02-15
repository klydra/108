import React, { ChangeEvent, Component } from "react";
import { Button, Input, Modal } from "@mantine/core";
import CardFront from "../components/CardFront";
import { CardColor, CardFace } from "../models/Card";
import CardBack from "../components/CardBack";
import {
  AccountCircle,
  ArrowCircleDown,
  Groups,
  MoreHoriz,
  PlayArrow,
} from "@mui/icons-material";
import { sessionCreate, sessionJoin, userRegister } from "../api/api";
import { showNotification } from "@mantine/notifications";

interface HomeProps {}

interface HomeState {
  modal: boolean;
  code: string;
}

export default class Home extends Component<HomeProps, HomeState> {
  private readonly theme: number;

  constructor(props: any) {
    super(props);

    this.state = {
      modal: false,
      code: "",
    };

    this.theme = Math.floor(Math.random() * Object.keys(CardColor).length - 1);
  }

  themeColor() {
    switch (this.theme) {
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

  themeName() {
    switch (this.theme) {
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

  render() {
    return (
      <div className="bg-background w-full flex justify-center">
        <div className="w-full max-w-[120rem]">
          <div className="w-full h-[100vh] flex flex-col justify-evenly items-center">
            <div className="w-full h-full flex flex-col justify-evenly items-center gap-y-32">
              <div className="-mt-12 px-12 w-full flex flex-col justify-center items-center gap-y-16">
                <div className="flex justify-center items-end gap-x-12">
                  <img src="/icon.svg" alt="" className="h-3/4" />
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
                    this.themeName() +
                    " bg-card-" +
                    this.themeName()
                  }
                  onClick={() => this.setState({ modal: true })}
                >
                  <div className="w-full h-full flex p-2 justify-center items-center">
                    <PlayArrow style={{ width: "100%", height: "100%" }} />
                  </div>
                </Button>
                <this.Play
                  opened={this.state.modal}
                  setOpened={(opened: boolean) =>
                    this.setState({ modal: opened })
                  }
                  code={this.state.code}
                  setCode={(code: string) => this.setState({ code })}
                  theme={this.themeName()}
                />
                <div className="hidden bg-card-yellow bg-card-green bg-card-blue bg-card-purple hover:bg-card-yellow hover:bg-card-green hover:bg-card-blue hover:bg-card-purple"></div>
              </div>
            </div>
            <div className="w-full h-[10%] flex justify-center items-center">
              <div className="animate-bounce opacity-50 ease-in-out text-contrast h-16 w-16">
                <ArrowCircleDown style={{ width: "100%", height: "100%" }} />
              </div>
            </div>
          </div>
          <this.Heading title="mechanics" />
          <this.Row>
            <this.Column>
              <this.Rule
                title="draw"
                text="If a player can´t play a card he needs to draw a card."
              >
                <div className="h-52">
                  <CardBack />
                </div>
              </this.Rule>
              <this.Rule
                title="match"
                text="When it is a player's turn, he can play a card if it has the same color, the same value or if it is a wish-card or plus-4-card."
              >
                <div className="z-10">
                  <CardFront
                    card={{
                      face: CardFace.NUMBER_7,
                      color: this.themeColor(),
                    }}
                  />
                </div>
                <div className="-ml-[5rem]">
                  <CardFront
                    card={{
                      face: CardFace.NUMBER_5,
                      color: this.themeColor(),
                    }}
                  />
                </div>
              </this.Rule>
              <this.Rule
                title="wish"
                text="If a wish-card is played, the player can define the next played color."
              >
                <CardFront
                  card={{
                    face: CardFace.WISH,
                    color: this.themeColor(),
                  }}
                />
              </this.Rule>
              <this.Rule
                title="block"
                text="If a block-card is played, the player whose turn it would be next must sit out."
              >
                <CardFront
                  card={{
                    face: CardFace.BLOCK,
                    color: this.themeColor(),
                  }}
                />
              </this.Rule>
              <this.Rule
                title="rotate"
                text="If a rotate-card is played, it is played in the opposite direction to the previous one."
              >
                <CardFront
                  card={{
                    face: CardFace.DIRECTION_CHANGE,
                    color: this.themeColor(),
                  }}
                />
              </this.Rule>
            </this.Column>
            <this.Column>
              <this.Rule
                title="plus 2"
                text="If a draw-2-card is played, the next player need´s to draw 2 cards. "
              >
                <CardFront
                  card={{
                    face: CardFace.PLUS_2,
                    color: this.themeColor(),
                  }}
                />
              </this.Rule>
              <this.Rule
                title="plus 4"
                text="If a draw-4-card is played, the next player need´s to draw 4 cards and the previous player define the next played color. "
              >
                <CardFront
                  card={{
                    face: CardFace.WISH_PLUS_4,
                    color: this.themeColor(),
                  }}
                />
              </this.Rule>
              <this.Rule
                title={' "ONE" '}
                text="If a player only has one card left, he needs to say “ONE” if he get caught, don´t saying it, he need´s to draw 2 cards."
              >
                <CardFront
                  card={{
                    face: CardFace.NUMBER_1,
                    color: this.themeColor(),
                  }}
                />
              </this.Rule>
              <this.Rule
                title="winner"
                text={
                  'The first player with zero cards left wins. "Winner Winner Chicken Dinner" '
                }
              >
                <CardFront
                  card={{
                    face: CardFace.NUMBER_0,
                    color: this.themeColor(),
                  }}
                />
              </this.Rule>
            </this.Column>
          </this.Row>
          <this.Heading title="custom rules" />
          <this.Row>
            <this.Column>
              <this.Rule
                title="random cards"
                text="order cards …..gsfdagfgsafdgasfgdfasgfdgasfg"
              >
                <div className="h-52">
                  <CardBack />
                </div>
              </this.Rule>
              <this.Rule
                title="short match"
                text="the game ends when the first player plays all his cards"
              >
                <CardFront
                  card={{
                    face: CardFace.NUMBER_0,
                    color: this.themeColor(),
                  }}
                />
              </this.Rule>
              <this.Rule
                title="to good to go"
                text="if you draw a matching card you can play it or hold it"
              >
                <CardFront
                  card={{
                    face: CardFace.WISH_PLUS_4,
                    color: this.themeColor(),
                  }}
                />
              </this.Rule>
              <this.Rule
                title="million cards"
                text="you can draw as long cards as you didn´t got a matching one"
              >
                <div className="h-52">
                  <CardBack />
                </div>
              </this.Rule>
            </this.Column>
            <this.Column>
              <this.Rule
                title="stacks"
                text="Draw-2-cards and draw-4-cards are stackable, that the next player needs to draw 2, 3, 4, … times as much cards."
              >
                <CardFront
                  card={{
                    face: CardFace.PLUS_2,
                    color: this.themeColor(),
                  }}
                />
              </this.Rule>
              <this.Rule
                title="magic 7"
                text="If a 7 is played, the player can choose one opponent to switch cards with."
              >
                <CardFront
                  card={{
                    face: CardFace.NUMBER_7,
                    color: this.themeColor(),
                  }}
                />
              </this.Rule>
              <this.Rule
                title="fast, faster, next one"
                text="If a card is played, and a player has the identical card the player can play the identical card and from him the game continues."
              >
                <div className="z-10">
                  <CardFront
                    card={{
                      face: CardFace.NUMBER_6,
                      color: this.themeColor(),
                    }}
                  />
                </div>
                <div className="-ml-[5rem]">
                  <CardFront
                    card={{
                      face: CardFace.NUMBER_6,
                      color: this.themeColor(),
                    }}
                  />
                </div>
              </this.Rule>
            </this.Column>
          </this.Row>
          <this.Heading title="contact" />
        </div>
      </div>
    );
  }

  Row(props: { children: React.ReactNode }) {
    return (
      <div className="grid grid-cols-2 pt-[5rem] pb-[8rem] px-[2rem]">
        {props.children}
      </div>
    );
  }

  Column(props: { children: React.ReactNode }) {
    return (
      <div className="flex flex-col items-center gap-y-24">
        {props.children}
      </div>
    );
  }

  Heading(props: { title: string }) {
    return (
      <div className="pb-12 pt-40 flex w-full justify-center items-center">
        <p className="text-card-accent text-[4rem] font-semibold font-default">
          {props.title}
        </p>
      </div>
    );
  }

  Rule(props: { children: React.ReactNode; title: string; text: string }) {
    return (
      <div className="w-[80%] gap-x-[8%] flex justify-evenly items-center">
        <div className="flex min-w-[10rem] justify-evenly items-center">
          {props.children}
        </div>
        <div className="-mt-6">
          <div className="flex flex-col gap-y-2">
            <h3 className="text-[2.2rem] text-card-accent font-semibold tracking-[.01em] font-default">
              {props.title}
            </h3>
            <p className="text-[1.3rem] text-card-accent leading-tight font-default">
              {props.text}
            </p>
          </div>
        </div>
      </div>
    );
  }

  Play(props: {
    opened: boolean;
    setOpened: Function;
    code: string;
    setCode: Function;
    theme: string;
  }) {
    return (
      <Modal
        centered
        withCloseButton={false}
        opened={props.opened}
        onClose={() => props.setOpened(false)}
        radius="xl"
        size="auto"
      >
        <div className="w-full h-[14rem] w-[46rem] h-full bg-background flex justify-evenly items-center">
          <div className="h-full w-[35%] flex flex-col justify-evenly items-center">
            <b className="select-none text-card-accent text-[2rem] font-default">
              Start fresh
            </b>
            <div className="min-w-full h-1/2 flex justify-center items-center">
              <Button
                uppercase
                className={
                  "h-24 w-24 rounded-[10rem] text-background hover:bg-card-" +
                  props.theme +
                  " bg-card-" +
                  props.theme
                }
                onClick={async () => {
                  if (!localStorage.getItem("token")) {
                    const user = await userRegister();

                    if (user["code"]) {
                      showNotification({
                        title: "Error",
                        message: user["message"],
                        color: "red",
                        icon: <AccountCircle />,
                      });
                      return;
                    }

                    showNotification({
                      title: "Success",
                      message: "Created user.",
                      color: "green",
                      icon: <AccountCircle />,
                    });

                    localStorage.setItem("token", user["token"]);
                  }

                  const create = await sessionCreate();
                  if (create["code"].length !== 15) {
                    showNotification({
                      title: "Error",
                      message: create["message"],
                      color: "red",
                      icon: <PlayArrow />,
                    });
                    return;
                  }

                  console.log(create["code"]);

                  showNotification({
                    title: "Success",
                    message: "Joining game...",
                    color: "green",
                    icon: <PlayArrow />,
                  });
                }}
              >
                <div className="w-full h-full flex p-2 justify-center items-center">
                  <PlayArrow style={{ width: "100%", height: "100%" }} />
                </div>
              </Button>
            </div>
          </div>
          <div className="w-[0.25rem] h-[72%] rounded-2xl bg-contrast opacity-20"></div>
          <div className="h-full w-[55%] flex flex-col justify-evenly items-center">
            <b className="select-none text-card-accent text-[2rem] font-default">
              Join in
            </b>
            <div className="min-w-full px-8 h-1/2 flex justify-center items-center">
              <Input
                className="rounded-2xl w-full"
                size="lg"
                value={props.code}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  props.setCode(event.target.value)
                }
                icon={<Groups />}
                iconWidth={52}
                placeholder="Code"
                maxLength={15}
                rightSection={
                  <Button
                    uppercase
                    className={
                      "w-full h-full aspect-[1] rounded-lg text-background hover:bg-card-" +
                      props.theme +
                      " bg-card-" +
                      props.theme
                    }
                    onClick={async () => {
                      if (props.code.length !== 15) {
                        showNotification({
                          title: "Error",
                          message: "The specified code is invalid.",
                          color: "red",
                          icon: <MoreHoriz />,
                        });
                        return;
                      }

                      if (!localStorage.getItem("token")) {
                        const user = await userRegister();

                        if (user["code"]) {
                          showNotification({
                            title: "Error",
                            message: user["message"],
                            color: "red",
                            icon: <AccountCircle />,
                          });
                          return;
                        }

                        showNotification({
                          title: "Success",
                          message: "Created user.",
                          color: "green",
                          icon: <AccountCircle />,
                        });

                        localStorage.setItem("token", user["token"]);
                      }

                      const join = await sessionJoin(props.code);
                      if (join["code"] !== 200) {
                        showNotification({
                          title: "Error",
                          message: join["message"],
                          color: "red",
                          icon: <PlayArrow />,
                        });
                        return;
                      }

                      showNotification({
                        title: "Success",
                        message: "Joining game...",
                        color: "green",
                        icon: <PlayArrow />,
                      });
                    }}
                  >
                    <div className="w-full h-full flex justify-center items-center">
                      <PlayArrow style={{ width: "150%", height: "150%" }} />
                    </div>
                  </Button>
                }
                rightSectionWidth={52}
              />
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}
