import React, { Component } from "react";

interface HomeProps {}

interface HomeState {}

export default class Home extends Component<HomeProps, HomeState> {
  render() {
    return (
      <div className="bg-background w-screen h-screen flex flex-column justify-center items-center"></div>
    );
  }
}
