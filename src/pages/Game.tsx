import React from "react";
import {Component} from "react";
import {supabase} from "../lib/supabase";

export default class Game extends Component<any, any> {
    constructor(props: any) {
        super(props);
    }

    render() {
        return <div onClick={() => {
            supabase.auth.onAuthStateChange()
        }}>sign</div>;
    }
}