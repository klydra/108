import React, { Component } from "react";
import CardFront from "../components/CardFront";
import { CardColor, CardFace, CardType } from "../models/Card";
import CardBack from "../components/CardBack";
import PocketBase from "pocketbase";

interface GameProps {
  code: string;
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
            player: undefined
        };

        this.pocketbase = new PocketBase("https://api.108.cards");
    }

    async componentDidMount() {
        const player = localStorage.getItem("token") ? (await this.pocketbase
            .collection("players")
            .getOne(localStorage.getItem("token")!)) as Object as PlayerType : undefined;

        const game = (await this.pocketbase
            .collection("games")
            .getOne(this.props.code)) as Object as GameType;

        if (!this.state.player) await this.pocketbase
            .collection("players")
            .subscribe(localStorage.getItem("token")!, (change) =>
                this.setState({player: change.record as Object as PlayerType})
            );

        if (!this.state.game) await this.pocketbase
            .collection("games")
            .subscribe(this.props.code, (change) =>
                this.setState({game: change.record as Object as GameType})
            );

        this.setState({player, game});
    }

    componentDidUpdate(
        _: Readonly<GameProps>,
        __: Readonly<GameState>,
        ___?: any
    ) {
        console.log(this.state.game?.stack);
    }

    async componentWillUnmount() {
        if (localStorage.getItem("token"))
            await this.pocketbase.collection("players").unsubscribe(localStorage.getItem("token")!);
        await this.pocketbase.collection("games").unsubscribe(this.props.code);
    }

    render() {
        const card: CardType = {
            face: CardFace.NUMBER_3,
            color: CardColor.PURPLE,
        };

        return (
            <>
                {/* Table */}
                <div className="flex justify-center items-center bg-background h-[100vh] w-[100vw] px-[5%] py-[5%]">
                    <div
                        className="bg-table-background h-full w-full rounded-2xl drop-shadow-[0_5px_5px_rgba(255,255,255,0.25)] shadow-card-yellow"></div>
                </div>

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
                <div
                    className="fixed w-44 h-[80%] inset-y-[10%] left-[1%] rotate-180 flex flex-col justify-center items-end">
                    <div
                        className="w-full duration-100 ease-out aria-disabled:-translate-x-60 aria-disabled:scale-0 aria-disabled:duration-300 aria-disabled:opacity-0 "
                        aria-disabled={false}
                    >
                        <CardBack rotated/>
                    </div>
                </div>

                {/* Right card row */}
                <div className="fixed w-44 h-[80%] inset-y-[10%] right-[1%] flex flex-col justify-center items-end">
                    <div
                        className="w-full duration-100 ease-out aria-disabled:-translate-x-60 aria-disabled:scale-0 aria-disabled:duration-300 aria-disabled:opacity-0"
                        aria-disabled={false}
                    >
                        <CardBack rotated/>
                    </div>
                </div>

                {/* Top card row */}
                <div className="fixed w-[80%] h-44 inset-x-[10%] top-[1%] gap-2 flex justify-center items-start">
                    <div
                        className="h-full duration-100 ease-out aria-disabled:translate-y-60 aria-disabled:scale-0 aria-disabled:duration-300 aria-disabled:opacity-0"
                        aria-disabled={false}
                    >
                        <CardBack/>
                    </div>
                    <CardBack/>
                    <CardBack/>
                </div>

                {/* Sort button */}
                <div className="fixed flex h-[12.5%] left-[10%] right-[80%] bottom-[6%]"></div>

                {/* Call button */}
                <div className="fixed flex h-[12.5%] left-[80%] right-[10%] bottom-[6%]"></div>

                {/* Draw stack */}
                <div
                    className="fixed flex inset-y-1/2 left-[37.5%] right-[50%] inset-y-[42%] flex justify-center items-center">
                    <div
                        className="h-full duration-700 ease-out aria-disabled:scale-[166%] aria-disabled:opacity-0 absolute"
                        aria-disabled={false}
                    >
                        <CardBack/>
                    </div>
                    <CardBack/>
                </div>

                {/* Play stack  */}
                <div
                    className="fixed flex inset-y-1/2 right-[37.5%] left-[50%] inset-y-[42%] flex justify-center items-center">
                    <div className="scale-75">
                        <CardFront card={card}/>
                    </div>
                    <div
                        className="scale-75 duration-700 ease-out aria-disabled:scale-125 aria-disabled:opacity-50 absolute "
                        aria-disabled={false}
                    >
                        <CardFront card={card}/>
                    </div>
                </div>
            </>
        );
    }
}
