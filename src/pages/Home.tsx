import React from "react";
import {Component} from "react";
import CardBack from "../components/CardBack";
import {supabase} from "../lib/supabase";
import {Session, Subscription, User} from "@supabase/supabase-js";

interface HomeProps {

}

interface HomeState {
    user: User | null,
    auth: Subscription | null,
    session: Session | null
}

export default class Home extends Component<HomeProps, HomeState> {
    constructor(props: HomeProps) {
        super(props);

        this.state = {
            session: null,
            auth: null,
            user: null
        }

    }

    componentDidMount() {
        this.setState({ session: supabase.auth.session() })

        const { data: auth } = supabase.auth.onAuthStateChange(
          async (_, session) => {
              this.setState({ user: session?.user ?? null })
          }
        )

        this.setState({ auth })
    }

    componentWillUnmount() {
        this.state.auth?.unsubscribe();
    }


    render() {
        return <div className="bg-background w-screen h-screen flex flex-column justify-center items-center">
            <CardBack/>
        </div>;
    }
}