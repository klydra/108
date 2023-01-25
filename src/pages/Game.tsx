import React from "react";
import {Component} from "react";

export default class Game extends Component<any, any> {
  constructor(props: any) {
    super(props);
  }

  render() {
    return <>
      <div className="flex justify-center items-center bg-background h-[100vh] w-[100vw] p-6">
        <div className="bg-table-background h-full w-full rounded-2xl drop-shadow-[0_5px_5px_rgba(255,255,255,0.25)] shadow-card-yellow">
        </div>
      </div>

      <div className="fixed flex h-1/4 left-[25%] right-[25%] bottom-0">

      </div>
      <div className="fixed flex w-1/4 inset-y-0 left-0">

      </div>
      <div className="fixed flex w-1/4 inset-y-0 right-0">

      </div>
      <div className="fixed flex w-3/4 h-1/4 inset-x-[12.5%] top-0">

      </div>
      <div className="fixed flex h-[12.5%] left-[12.5%] right-[75%] bottom-[6%]">

      </div>
      <div className="fixed flex h-[12.5%] left-[75%] right-[12.5%] bottom-[6%]">

      </div>
      <div className="fixed flex inset-y-1/2 left-[37.5%] right-[50%] inset-y-[42%]">

      </div>
      <div className="fixed flex inset-y-1/2 right-[37.5%] left-[50%] inset-y-[42%]">

      </div>
    </>
  }
}