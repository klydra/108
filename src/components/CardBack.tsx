import React from "react";

export default function CardBack(props: { rotated?: boolean }) {
  if (props.rotated)
    return (
      <div className="overflow-hidden w-full aspect-[16/9] rounded-xl bg-card-accent flex justify-center items-center">
        <div className="w-[97%] h-[95%] flex flex-row">
          <div className="bg-card-back flex justify-center items-center w-[13%] h-full rounded-l-xl"></div>
          <div className="bg-card-back flex justify-center items-center w-[74%] h-full">
            <div className="-rotate-card-angle rounded-card-inner flex justify-center items-center bg-card-accent min-w-[115%] h-[85%]">
              <div className="-rotate-card-back-angle flex justify-center items-center w-full h-full">
                <div className="mr-9 ml-8">
                  <Icon />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card-back flex justify-center items-center w-[13%] h-full rounded-r-xl"></div>
        </div>
      </div>
    );

  return (
    <div className="overflow-hidden h-full aspect-[9/16] rounded-xl bg-card-accent flex justify-center items-center">
      <div className="w-[95%] h-[97%]">
        <div className="bg-card-back flex justify-center items-center w-full h-[13%] rounded-t-xl"></div>
        <div className="bg-card-back flex justify-center items-center w-full h-[74%]">
          <div className="-rotate-card-angle rounded-card-inner flex justify-center items-center bg-card-accent  w-[85%] h-[115%]">
            <div className="rotate-card-angle flex justify-center items-center w-full h-full">
              <div className="mr-0.5 -ml-0.5">
                <Icon />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-card-back flex justify-center items-center w-full h-[13%] rounded-b-xl"></div>
      </div>
    </div>
  );
}

function Icon() {
  return (
    <svg className="w-full h-full" viewBox="0 0 1960 1201.05799">
      <g>
        <path
          className="fill-card-blue"
          d="M1583.58269,511.22015,1936.0081,714.65551a78.99763,78.99763,0,0,1,28.91693,107.8738l-423.13638,732.75113a78.99764,78.99764,0,0,1-107.87381,28.91693l-352.42542-203.43529a78.99764,78.99764,0,0,1-28.91693-107.87381l423.13639-732.75119A78.95191,78.95191,0,0,1,1583.549,511.20071Z"
          transform="translate(-20.50457 -398.71891)"
        />
      </g>
      <g>
        <path
          className="fill-card-yellow"
          d="M1056.752,404.92774l400.65794,70.711a79.01037,79.01037,0,0,1,64.04649,91.49506l-146.95685,833.2828a79.01025,79.01025,0,0,1-91.49506,64.04649l-400.658-70.711a79.01039,79.01039,0,0,1-64.04656-91.49506l146.95685-833.2828A79.01052,79.01052,0,0,1,1056.752,404.92774Z"
          transform="translate(-20.50457 -398.71891)"
        />
      </g>
      <g>
        <path
          className="fill-card-green"
          d="M543.476,475.63874l400.658-70.711a79.01049,79.01049,0,0,1,91.49513,64.04652l146.95686,833.2828a79.01035,79.01035,0,0,1-64.04649,91.49506l-400.658,70.711a79.01041,79.01041,0,0,1-91.49506-64.04649L479.54234,567.1338a78.87369,78.87369,0,0,1,63.82917-91.47651Z"
          transform="translate(-20.50457 -398.71891)"
        />
      </g>
      <g>
        <path
          className="fill-card-purple"
          d="M64.99066,714.65544l352.4254-203.43536A79.02432,79.02432,0,0,1,525.28987,540.137l423.13645,732.75126a79.02432,79.02432,0,0,1-28.91693,107.87381L567.084,1584.19737a79.02417,79.02417,0,0,1-107.8738-28.91693L36.0737,822.41631a78.89248,78.89248,0,0,1,28.914-107.75915Z"
          transform="translate(-20.50457 -398.71891)"
        />
      </g>
    </svg>
  );
}
