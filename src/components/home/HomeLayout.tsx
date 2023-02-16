import React from "react";

export function Heading(props: { title: string }) {
  return (
    <div className="pb-12 pt-40 flex w-full justify-center items-center">
      <p className="text-card-accent text-[4rem] font-semibold font-default">
        {props.title}
      </p>
    </div>
  );
}

export function Row(props: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 pt-[5rem] pb-[8rem] px-[2rem]">
      {props.children}
    </div>
  );
}

export function Column(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-y-24">{props.children}</div>
  );
}

export function Entry(props: {
  children: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="w-[80%] gap-x-[8%] flex justify-evenly items-center">
      <div className="flex min-w-[10rem] justify-evenly items-center">
        {props.children}
      </div>
      <div className="-mt-6">
        <div className="flex flex-col gap-y-2">
          <h3 className="text-[2.2rem] text-card-accent font-semibold tracking-[.01em] font-default">
            {props.title}
          </h3>
          <p className="text-[1.3rem] text-card-accent leading-tight font-default">
            {props.text}
          </p>
        </div>
      </div>
    </div>
  );
}