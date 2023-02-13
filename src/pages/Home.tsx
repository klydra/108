import React, { Component } from "react";
import CardBack from "../components/CardBack";

interface HomeProps {}

interface HomeState {}

export default class Home extends Component<HomeProps, HomeState> {
  render() {
    return (
      <div className="bg-background w-screen h-screen flex flex-column justify-center items-center">
        <CardBack />
      </div>
    );
  }
}
