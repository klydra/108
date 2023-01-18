import React from "react";
import {Component} from "react";
import CardBack from "../components/CardBack";

export default class Home extends Component<any, any> {
    render(){



        return <div className="bg-background w-screen h-screen flex flex-column justify-center items-center">
            <CardBack/>
        </div>;
    }
}