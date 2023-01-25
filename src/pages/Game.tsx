import React from "react";
import {Component} from "react";

export default class Game extends Component<any, any> {
    constructor(props: any) {
        super(props);
    }

    render() {
        return <div className="flex justify-center items-center bg-background h-[100vh] w-[100vw] p-6">
          <div className="bg-table-background h-full w-full rounded-2xl drop-shadow-[0_5px_5px_rgba(255,255,255,0.25)] shadow-card-yellow">
            <div className="flex w-1/4 h-1/4 left-[37.5] absolute bottom-0">

            </div>
            <div className="flex w-1/4 inset-y-0 left-0">

            </div>
            <div className="flex w-1/4 inset-y-0 right-0">

            </div>
            <div className="flex w-3/4 h-[12.5%] left-[12.5%] absolute top-0">

            </div>
            <div className="flex w-[12.5%] h-[12.5%] left-1/4 bottom-[6%]">

            </div>
            <div className="flex w-[12.5%] h-[12.5%] right-1/4 bottom-[6%]">

            </div>
            <div className="flex inset-y-1/2 left-[40]">

            </div>
            <div className="flex inset-y-1/2 right-[40]">

            </div>
          </div>
        </div>

    }
}