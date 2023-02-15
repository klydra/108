import React, { ChangeEvent, Component } from "react";
import { Button, Input, Modal } from "@mantine/core";
import CardFront from "../components/CardFront";
import { CardColor, CardFace } from "../models/Card";
import CardBack from "../components/CardBack";
import {
  ArrowCircleDown,
  Groups,
  MoreHoriz,
  PlayArrow,
} from "@mui/icons-material";
import {
  API_NOTIFICATION_TIMEOUT,
  createGame,
  ensureRegistered,
  sessionJoin,
} from "../api/API";
import { showNotification } from "@mantine/notifications";
import { NavigateFunction } from "react-router";

interface HomeProps {
  navigate: NavigateFunction;
}

interface HomeState {
  modal: boolean;
  game: string;
}

export default class Home extends Component<HomeProps, HomeState> {
  private readonly theme: number;

  constructor(props: any) {
    super(props);

    this.state = {
      modal: false,
      game: "",
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
            <div className="w-full h-full flex flex-col justify-evenly items-center gap-y-16">
              <div className="mt-12 px-12 w-full flex flex-col justify-center items-center gap-y-16">
                <div className="flex justify-center items-end gap-x-12">
                  <div className="h-[150%]">
                    <this.Icon />
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
                  game={this.state.game}
                  setGame={(game: string) => this.setState({ game })}
                  theme={this.themeName()}
                  navigate={this.props.navigate}
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
          <this.Row>
            <this.Column>
              <div className="h-[5rem] flex w-full justify-center items-center">
                <p className="px-2 pb-2 text-[2.2rem] text-card-accent font-semibold tracking-[.01em] font-default">
                  {" "}
                  Jan Klinge (Klydra){" "}
                </p>
              </div>
            </this.Column>
            <this.Column>
              <div className="h-[5rem] flex w-full justify-center items-center">
                <p className="px-2 pb-2 text-[2.2rem] text-card-accent font-semibold tracking-[.01em] font-default">
                  {" "}
                  Justin Lippold (FluVacc){" "}
                </p>
              </div>
            </this.Column>
            <this.Column>
              <div className="grid gap-[5rem] grid-cols-3">
                <div className="hover:scale-125"></div>
                <div className="hover:scale-125"></div>
                <div className="hover:scale-125"></div>
                <div className="text-[1rem] text-card-accent font-semibold tracking-[.01em] font-default">
                  Email
                </div>
                <div className="text-[1rem] text-card-accent font-semibold tracking-[.01em] font-default">
                  Discord
                </div>
                <div className="text-[1rem] text-card-accent font-semibold tracking-[.01em] font-default">
                  Github
                </div>
              </div>
            </this.Column>
            <this.Column>
              <div className="grid gap-[8rem] grid-cols-2">
                <div className="hover:scale-125"></div>
                <div className="hover:scale-125"></div>
                <div className="text-[1rem] text-card-accent font-semibold tracking-[.01em] font-default">
                  Email
                </div>
                <div className="text-[1rem] text-card-accent font-semibold tracking-[.01em] font-default">
                  Discord
                </div>
              </div>
            </this.Column>
          </this.Row>
          <div className="h-[3rem]"></div>
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

  Icon() {
    return (
      <svg className="h-full" viewBox="0 0 1960 1201.05799">
        <g>
          <path
            className="fill-card-blue stroke-card-accent stroke-card-icon-border"
            d="M1583.58269,511.22015,1936.0081,714.65551a78.99763,78.99763,0,0,1,28.91693,107.8738l-423.13638,732.75113a78.99764,78.99764,0,0,1-107.87381,28.91693l-352.42542-203.43529a78.99764,78.99764,0,0,1-28.91693-107.87381l423.13639-732.75119A78.95191,78.95191,0,0,1,1583.549,511.20071Z"
            transform="translate(-20.50457 -398.71891)"
          />
          <ellipse
            className="fill-card-inner stroke-card-accent stroke-card-icon-border"
            cx="1488.30073"
            cy="648.93335"
            rx="227.83394"
            ry="397.60816"
          />
          <path
            className="fill-card-symbol"
            d="M1874.33368,831.90465a36.54951,36.54951,0,0,1-12.31232-10.95683,25.9436,25.9436,0,0,1-4.8572-13.216,22.11737,22.11737,0,0,1,3.16284-13.216,20.91548,20.91548,0,0,1,6.77742-7.22927,23.06585,23.06585,0,0,1,9.14947-3.50164,24.99631,24.99631,0,0,1,10.392.56479l22.81723,13.216a26.80979,26.80979,0,0,1,5.64785,8.6977,23.98139,23.98139,0,0,1,1.69435,9.60133,20.52407,20.52407,0,0,1-2.82392,9.37541,22.85294,22.85294,0,0,1-10.05319,9.60133,25.92557,25.92557,0,0,1-13.89375,2.37207A39.87524,39.87524,0,0,1,1874.33368,831.90465Zm5.53492-9.71426a20.64654,20.64654,0,0,0,8.47176,2.711,14.408,14.408,0,0,0,7.907-1.46843,14.25676,14.25676,0,0,0,5.76077-5.53491,13.384,13.384,0,0,0,1.80729-7.3422,15.76987,15.76987,0,0,0-2.711-7.45512,20.99911,20.99911,0,0,0-6.55155-6.43856,22.38435,22.38435,0,0,0-8.81069-2.37206,15.7989,15.7989,0,0,0-7.794,1.46842,13.36927,13.36927,0,0,0-5.64784,5.309,13.664,13.664,0,0,0-1.92022,7.68105,15.03317,15.03317,0,0,0,2.711,7.56812A22.96856,22.96856,0,0,0,1879.8686,822.19039Zm6.32555-35.69435a26.96669,26.96669,0,0,1-5.422-8.1329,20.76682,20.76682,0,0,1-1.69435-9.03655,19.81773,19.81773,0,0,1,2.59806-8.92362,22.12694,22.12694,0,0,1,9.4884-9.03655,25.61262,25.61262,0,0,1,13.2159-2.25914,37.64239,37.64239,0,0,1,14.79732,4.97013,35.10961,35.10961,0,0,1,11.74754,10.279,24.39089,24.39089,0,0,1,4.63121,12.53818,21.46918,21.46918,0,0,1-3.16285,12.87711,19.19164,19.19164,0,0,1-6.43849,6.66449,20.4529,20.4529,0,0,1-8.58469,2.93685,28.35736,28.35736,0,0,1-9.71426-.56479Zm13.55483,1.2425a23.24786,23.24786,0,0,0,8.13284,2.25914,15.7582,15.7582,0,0,0,7.34219-1.2425,12.30951,12.30951,0,0,0,5.422-5.08306,12.978,12.978,0,0,0,1.12957-10.95683,17.61831,17.61831,0,0,0-8.01991-9.03655,17.05014,17.05014,0,0,0-11.86048-2.48506,12.37766,12.37766,0,0,0-8.92361,6.43855,12.02655,12.02655,0,0,0-1.69436,7.22927,15.654,15.654,0,0,0,2.59807,7.00334A20.74258,20.74258,0,0,0,1899.749,787.73854Z"
            transform="translate(-20.50457 -398.71891)"
          />
          <path
            className="fill-card-symbol"
            d="M1118.53933,1328.35007a33.34693,33.34693,0,0,1-11.18276-9.94026,23.75147,23.75147,0,0,1-4.51827-12.08633,21.029,21.029,0,0,1,2.82392-12.08633,19.59809,19.59809,0,0,1,6.21263-6.66448,23.34709,23.34709,0,0,1,8.35883-3.16285,22.71911,22.71911,0,0,1,9.48841.56478l20.78409,11.9734a25.94289,25.94289,0,0,1,5.196,7.907,20.13478,20.13478,0,0,1,1.46849,8.8107,19.46382,19.46382,0,0,1-2.59806,8.47176,20.57091,20.57091,0,0,1-9.14948,8.69762,23.69012,23.69012,0,0,1-12.65111,2.14621A31.47556,31.47556,0,0,1,1118.53933,1328.35007Zm5.08306-8.81055a18.52838,18.52838,0,0,0,7.794,2.485,13.1907,13.1907,0,0,0,7.22927-1.35543,12.10824,12.10824,0,0,0,5.30892-5.08306,11.01613,11.01613,0,0,0,1.58142-6.66448,14.18545,14.18545,0,0,0-2.485-6.77741,20.76184,20.76184,0,0,0-5.8737-5.8737,19.81112,19.81112,0,0,0-8.01991-2.14621,16.31106,16.31106,0,0,0-7.11634,1.2425,11.101,11.101,0,0,0-5.083,4.8572,11.354,11.354,0,0,0-1.69436,7.00327,14.58588,14.58588,0,0,0,2.485,6.89034A17.0655,17.0655,0,0,0,1123.62239,1319.53952Zm5.64784-32.41871a24.6042,24.6042,0,0,1-4.97013-7.45512,20.45207,20.45207,0,0,1-1.58142-8.13284,17.785,17.785,0,0,1,2.37207-8.13284,19.20926,19.20926,0,0,1,8.58469-8.13284,23.39348,23.39348,0,0,1,11.9734-2.03328,34.44976,34.44976,0,0,1,13.4419,4.51828,32.0623,32.0623,0,0,1,10.618,9.37547,23.24447,23.24447,0,0,1,4.29241,11.40862,19.81019,19.81019,0,0,1-2.82392,11.63461,16.64435,16.64435,0,0,1-5.76077,6.0997,18.90437,18.90437,0,0,1-7.794,2.711,26.98756,26.98756,0,0,1-8.92362-.56479Zm12.42526,1.12957a18.45684,18.45684,0,0,0,7.45512,2.03328,14.3197,14.3197,0,0,0,6.66449-1.12957,10.65222,10.65222,0,0,0,4.8572-4.6312,11.12937,11.12937,0,0,0,1.01664-9.94026,16.10063,16.10063,0,0,0-7.3422-8.24591,15.70689,15.70689,0,0,0-10.7309-2.25914,11.47912,11.47912,0,0,0-8.13284,5.76078,10.68057,10.68057,0,0,0-1.58143,6.55155,13.58829,13.58829,0,0,0,2.37207,6.32556A20.96912,20.96912,0,0,0,1141.69549,1288.25038Z"
            transform="translate(-20.50457 -398.71891)"
          />
          <path
            className="fill-card-symbol"
            d="M1423.071,1196.19054q-28.9734-16.77393-44.84382-39.76076c-10.618-15.36211-16.6046-31.40207-17.84724-48.1196-1.2425-16.71767,2.485-32.75749,11.40862-48.23253a76.103,76.103,0,0,1,24.62465-26.43193,85.02669,85.02669,0,0,1,33.32227-12.53819,94.49479,94.49479,0,0,1,37.95348,2.03321l82.91037,47.89367a94.13986,94.13986,0,0,1,20.55809,31.74085,87.10049,87.10049,0,0,1,6.0997,35.12956,72.944,72.944,0,0,1-10.279,34q-13.72422,23.89055-36.59805,34.9037c-15.24918,7.3422-32.07978,10.279-50.60473,8.58469C1461.36341,1213.69885,1442.38661,1207.37329,1423.071,1196.19054Zm20.33224-35.24249a72.339,72.339,0,0,0,30.9502,10.05319,54.61728,54.61728,0,0,0,28.804-5.196,48.29585,48.29585,0,0,0,21.01-20.21931,44.99715,44.99715,0,0,0,6.32556-26.88378c-.67771-9.26241-3.95349-18.412-9.82719-27.33551a82.82809,82.82809,0,0,0-23.72094-23.608c-10.84383-5.196-21.57474-8.13284-32.07978-8.5847a60.95033,60.95033,0,0,0-28.57814,5.196,45.26182,45.26182,0,0,0-20.44517,19.20267,48.27982,48.27982,0,0,0-6.89034,28.12628,55.64525,55.64525,0,0,0,9.94026,27.44858C1424.7655,1147.84522,1433.23713,1155.07421,1443.40325,1160.94805Zm22.81736-129.78746a100.91479,100.91479,0,0,1-19.65452-29.59472,74.80528,74.80528,0,0,1-6.0997-32.75749,70.33377,70.33377,0,0,1,9.60134-32.53156c8.58469-14.91032,20.10637-25.75415,34.56477-32.75749,14.45853-7.00334,30.38542-9.60133,48.00667-8.01991q26.26247,2.372,53.65451,18.186c18.299,10.505,32.41856,23.04322,42.58468,37.38869,10.16612,14.34554,15.814,29.59471,17.05646,45.5216,1.2425,16.03989-2.59806,31.51493-11.29569,46.65117a68.07387,68.07387,0,0,1-23.26908,24.39866,75.543,75.543,0,0,1-31.289,10.84383,100.20152,100.20152,0,0,1-35.46848-2.25914Zm49.475,4.6312a80.58517,80.58517,0,0,0,29.82064,8.01991,56.1533,56.1533,0,0,0,26.65779-4.6312,43.72179,43.72179,0,0,0,19.54159-18.412c7.56806-12.99,8.81069-26.31894,3.95349-39.76083-4.97013-13.44189-14.68439-24.39866-29.25585-32.87042s-28.91693-11.40862-43.03654-8.92362c-14.11961,2.48507-24.96344,10.16612-32.41856,23.26909-4.97013,8.58469-7.00328,17.28238-6.21263,26.093a55.28469,55.28469,0,0,0,9.26241,25.4153A77.96843,77.96843,0,0,0,1515.69564,1035.79179Z"
            transform="translate(-20.50457 -398.71891)"
          />
        </g>
        <g>
          <path
            className="fill-card-yellow stroke-card-accent stroke-card-icon-border"
            d="M1056.752,404.92774l400.65794,70.711a79.01037,79.01037,0,0,1,64.04649,91.49506l-146.95685,833.2828a79.01025,79.01025,0,0,1-91.49506,64.04649l-400.658-70.711a79.01039,79.01039,0,0,1-64.04656-91.49506l146.95685-833.2828A79.01052,79.01052,0,0,1,1056.752,404.92774Z"
            transform="translate(-20.50457 -398.71891)"
          />
          <ellipse
            className="fill-card-inner stroke-card-accent stroke-card-icon-border"
            cx="1169.91953"
            cy="934.73001"
            rx="227.83395"
            ry="397.60825"
            transform="translate(-269.63602 57.75782) rotate(-19.99877)"
          />
          <path
            className="fill-card-symbol"
            d="M1431.204,602.82814a29.77092,29.77092,0,0,1-16.8306-8.58469,34.69811,34.69811,0,0,1-8.5847-17.39539,63.40368,63.40368,0,0,1,.22586-23.94687,66.16527,66.16527,0,0,1,8.01991-22.8173,34.31528,34.31528,0,0,1,14.00668-13.32889,29.47489,29.47489,0,0,1,18.63788-2.25914c7.00327,1.2425,12.65112,4.06642,16.8306,8.58469a34.7307,34.7307,0,0,1,8.47177,17.16946c1.46849,7.00334,1.35542,15.13625-.22586,24.28573a66.37775,66.37775,0,0,1-8.01991,22.7043,34.06762,34.06762,0,0,1-13.89375,13.3289A29.2707,29.2707,0,0,1,1431.204,602.82814Zm1.92021-10.95683c6.43848,1.12957,11.86047-.90364,16.15288-6.21262s7.3422-13.103,9.26241-23.495c1.92021-10.618,1.69436-19.08974-.56478-25.41529s-6.55155-10.05319-12.99-11.18276q-9.48834-1.69435-15.92689,6.0997c-4.29242,5.196-7.3422,13.103-9.26241,23.72094-1.80728,10.392-1.69435,18.86381.56479,25.30236A15.67754,15.67754,0,0,0,1433.1242,591.87131Z"
            transform="translate(-20.50457 -398.71891)"
          />
          <path
            className="fill-card-symbol"
            d="M899.06416,1331.96477a26.763,26.763,0,0,1-15.24918-7.794,32.16658,32.16658,0,0,1-7.794-15.814,56.79373,56.79373,0,0,1,.22593-21.80073,60.79987,60.79987,0,0,1,7.34219-20.78409,31.51131,31.51131,0,0,1,12.65119-12.08633,26.74623,26.74623,0,0,1,16.94353-2.03328,27.08779,27.08779,0,0,1,15.3621,7.79405,30.74585,30.74585,0,0,1,7.681,15.701c1.3555,6.43849,1.2425,13.78068-.22592,22.02659-1.46843,8.13284-3.84056,15.02332-7.3422,20.67116a32.61291,32.61291,0,0,1-12.65118,12.1994C911.15056,1332.41649,905.50271,1333.09434,899.06416,1331.96477Zm1.80728-10.05319c5.87377,1.01664,10.7309-.79064,14.68439-5.64784,3.95349-4.74413,6.66448-11.86047,8.35884-21.46181s1.58142-17.39538-.56479-23.04322a14.47456,14.47456,0,0,0-11.86047-10.16612,14.305,14.305,0,0,0-14.45846,5.53491c-3.84056,4.74414-6.66448,11.86047-8.35884,21.57474-1.69435,9.4884-1.46842,17.16938.56479,22.93029C891.15718,1317.50624,895.11067,1320.89494,900.87144,1321.91158Z"
            transform="translate(-20.50457 -398.71891)"
          />
          <path
            className="fill-card-symbol"
            d="M1140.11406,1103.67884c-25.18943-4.40535-45.52167-14.91025-60.9967-31.17607q-23.21256-24.56813-31.06314-63.25584-7.794-38.80062.79064-87.31565c5.8737-32.98341,15.58811-60.54485,29.36879-82.91036,13.78068-22.36545,30.61128-38.51827,50.71766-48.34553q30.15955-14.91029,68-8.1329c25.52823,4.51827,45.97339,14.79732,61.33564,31.06313q23.04315,24.22923,30.95021,62.57813c5.30891,25.52823,4.97013,55.01-.90371,88.21929q-8.64136,48.96684-29.25586,82.45844-20.671,33.54826-50.60473,48.68438C1188.34673,1105.37319,1165.64229,1108.08418,1140.11406,1103.67884Zm7.11634-40.09969c23.382,4.17935,42.92361-3.38871,58.62464-22.47844q23.38215-28.63461,33.43521-85.62129,10.16611-57.77749-2.03328-92.3987-12.19926-34.56474-47.44189-40.7774-34.73422-6.09963-58.05985,22.13951-23.38215,28.29572-33.54813,86.07322c-6.66449,37.95348-5.98677,68.67776,2.1462,91.94691C1108.37321,1045.845,1124.07425,1059.51273,1147.2304,1063.57915Z"
            transform="translate(-20.50457 -398.71891)"
          />
        </g>
        <g>
          <path
            className="fill-card-green stroke-card-accent stroke-card-icon-border"
            d="M543.476,475.63874l400.658-70.711a79.01049,79.01049,0,0,1,91.49513,64.04652l146.95686,833.2828a79.01035,79.01035,0,0,1-64.04649,91.49506l-400.658,70.711a79.01041,79.01041,0,0,1-91.49506-64.04649L479.54234,567.1338a78.87369,78.87369,0,0,1,63.82917-91.47651Z"
            transform="translate(-20.50457 -398.71891)"
          />
          <ellipse
            className="fill-card-inner stroke-card-accent stroke-card-icon-border"
            cx="831.02799"
            cy="934.63835"
            rx="227.82801"
            ry="397.59775"
            transform="translate(-426.86182 354.16646) rotate(-40.00218)"
          />
          <path
            className="fill-card-symbol"
            d="M963.90136,530.42282,954.63888,477.672l-2.485-17.50831-11.86047,13.66775-13.103,14.91032-2.711-15.24918,27.90036-29.14285,9.37541-1.69436,15.13624,85.39536ZM935.43621,535.393l-1.92028-10.95683,60.43192-10.7309,1.92029,10.95683Z"
            transform="translate(-20.50457 -398.71891)"
          />
          <path
            className="fill-card-symbol"
            d="M711.32984,1399.287l-8.47177-47.89373-2.25914-15.92689-10.7309,12.42525-11.9734,13.55482-2.48506-13.89375,25.41529-26.54486,8.58469-1.46849,13.66783,77.71437Zm-25.86715,4.63121-1.80729-10.05319,55.01-9.71426,1.80728,10.05318Z"
            transform="translate(-20.50457 -398.71891)"
          />
          <path
            className="fill-card-symbol"
            d="M856.36648,1098.70885,822.47942,906.9081l-8.92362-63.5947-43.03654,49.81395-47.78074,54.33223-9.82726-55.57479L814.45951,785.81826l34.22591-6.0997,54.897,310.63131ZM752.672,1117.0078l-7.11627-40.09968,219.8141-38.85719,7.11627,40.09968Z"
            transform="translate(-20.50457 -398.71891)"
          />
        </g>
        <g>
          <path
            className="fill-card-purple stroke-card-accent stroke-card-icon-border"
            d="M64.99066,714.65544l352.4254-203.43536A79.02432,79.02432,0,0,1,525.28987,540.137l423.13645,732.75126a79.02432,79.02432,0,0,1-28.91693,107.87381L567.084,1584.19737a79.02417,79.02417,0,0,1-107.8738-28.91693L36.0737,822.41631a78.89248,78.89248,0,0,1,28.914-107.75915Z"
            transform="translate(-20.50457 -398.71891)"
          />
          <ellipse
            className="fill-card-inner stroke-card-accent stroke-card-icon-border"
            cx="492.06987"
            cy="1047.36852"
            rx="227.82898"
            ry="397.59947"
            transform="translate(-681.51613 551.09569) rotate(-59.99927)"
          />
          <circle
            className="fill-none stroke-card-symbol stroke-card-icon-outer"
            cx="433.17069"
            cy="186.93977"
            r="50.83059"
          />
          <line
            className="stroke-card-symbol stroke-card-icon-outer"
            x1="384.48624"
            y1="174.17566"
            x2="481.06436"
            y2="199.13917"
          />
          <circle
            className="fill-none stroke-card-symbol stroke-card-icon-outer"
            cx="508.73879"
            cy="1108.44193"
            r="50.83059"
          />
          <line
            className="stroke-card-symbol stroke-card-icon-outer"
            x1="460.73212"
            y1="1095.33896"
            x2="557.31024"
            y2="1120.41533"
          />
          <circle
            className="fill-none stroke-card-symbol stroke-card-icon-inner"
            cx="470.44645"
            cy="648.82042"
            r="169.4353"
          />
          <line
            className="stroke-card-symbol stroke-card-icon-inner"
            x1="308.35332"
            y1="606.34867"
            x2="630.16742"
            y2="689.71075"
          />
        </g>
      </svg>
    );
  }

  Play(props: {
    opened: boolean;
    setOpened: Function;
    game: string;
    setGame: Function;
    theme: string;
    navigate: NavigateFunction;
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
        <div className="h-[15rem] w-[47rem] bg-background flex justify-evenly items-center">
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
                  if (!(await ensureRegistered())) return;
                  const game = await createGame();
                  props.navigate("/" + game);
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
            <div className="min-w-full px-12 h-1/2 flex justify-center items-center">
              <Input
                className="rounded-2xl w-full"
                size="lg"
                value={props.game}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  props.setGame(event.target.value)
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
                      if (props.game.length !== 15) {
                        showNotification({
                          autoClose: API_NOTIFICATION_TIMEOUT,
                          message: "The specified code is invalid.",
                          color: "red",
                          icon: <MoreHoriz />,
                        });
                        return;
                      }

                      if (!(await ensureRegistered())) return;

                      const join = await sessionJoin(props.game);
                      if (join["code"] !== 200) {
                        showNotification({
                          autoClose: API_NOTIFICATION_TIMEOUT,
                          message: join["message"],
                          color: "red",
                          icon: <PlayArrow />,
                        });
                        return;
                      }

                      props.navigate("/" + props.game);
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
