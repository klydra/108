import React, { Component } from "react";
import { Button } from '@mantine/core';



interface HomeProps {}

interface HomeState {}

export default class Home extends Component<HomeProps, HomeState> {
  render() {
    return (
      <div className="bg-background w-screen">

        <div className="h-[3rem]"></div>
        <div className="flex h-[20rem] flex justify-center items-end gap-[3rem]">
          <img src="/icon.svg" alt="" className="h-[20rem]"/>
          <p className="text-card-accent text-[7rem]"> 108.cards </p>
        </div>
        <div className="h-[10rem] flex justify-center items-center">
          <p className="text-card-accent text-[3rem]"> The … game for everyone !  </p>
        </div>
        <div className="h-[3rem]"></div>
        <div className="h-[24rem] flex justify-center items-center">
          <Button radius="xl" size="xl" uppercase className="h-[10rem] w-[30rem] text-[7rem] outline-card-purple bg-card-purple hover:bg-card-purple rounded-[10rem] text-background"> Play </Button>
        </div>
        <div className="h-[55rem]">

        </div>
      </div>
    );
  }
}
