import React from "react";
import {Component} from "react";

export default class Game extends Component<any, any> {
    constructor(props: any) {
        super(props);
    }

    render() {
        return <div className="flex justify-center items-center bg-background h-[100vh] w-[100vw]">
            <div className="bg-table-background h-[90vh] w-[90vw] rounded-3xl drop-shadow-[0_35px_35px_rgba(255,255,255,0.25)] shadow-card-yellow"> </div>
        </div>

    }
}