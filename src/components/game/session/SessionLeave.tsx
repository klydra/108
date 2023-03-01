import React from "react";
import { API_NOTIFICATION_GAME_TIMEOUT, sessionLeave } from "../../../api/API";
import { showNotification } from "@mantine/notifications";
import { SettingsOutlined } from "@mui/icons-material";
import { NavigateFunction } from "react-router";

export default function SessionLeave(props: { navigate: NavigateFunction }) {
  return (
    <div
      className="absolute top-[2rem] left-[2rem] p-3 -z-10 rounded-2xl w-16 aspect-square bg-table-leave duration-200 hover:scale-110 cursor-pointer"
      onClick={async () => {
        props.navigate("/");

        const swap = await sessionLeave();
        if (swap["code"] !== 200) {
          showNotification({
            autoClose: API_NOTIFICATION_GAME_TIMEOUT,
            message: swap["message"] ?? "An unknown error occurred.",
            color: "red",
            icon: <SettingsOutlined />,
          });
        }
      }}
    >
      <svg viewBox="0 0 1000 1000">
        <g>
          <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)">
            <path
              className="fill-contrast stroke-[10rem] stroke-contrast"
              d="M150.1,4901.8l-50.1-59.7V1004.3v-3839.8l42.4-46.2c69.3-75.1,2982.9-1831.3,3050.3-1839c69.3-7.7,171.4,38.5,200.3,90.5c11.6,25,19.3,346.6,19.3,905.1v868.5h1542.5h1542.5l65.4,65.5l65.5,65.5v1111.1v1111.1l-65.5,65.5c-90.5,90.5-182.9,90.5-273.4,0l-65.5-65.5v-974.4v-974.4l-1401.9,3.9l-1400,5.8l-9.6,2767.2c-9.6,2736.4-9.6,2769.1-48.1,2805.7c-21.2,21.2-552.7,352.4-1182.4,733.7l-1145.8,693.2h2593.9h2593.9V3189.9V1822.7l53.9-57.8c96.3-109.8,281.2-80.9,331.2,50.1c11.5,30.8,19.3,610.4,19.3,1521.3c0,1581,1.9,1554-94.4,1606c-25,13.5-1062.9,19.3-3185,19.3H200.1L150.1,4901.8z M2256.7,3340.1l741.4-450.6l5.8-3518.2c1.9-1935.3,0-3518.2-5.8-3518.2c-3.9,0-568.1,338.9-1251.7,752.9L504.4-2639.1V881.1v3522l506.4-306.2C1288.1,3927.5,1848.5,3586.6,2256.7,3340.1z"
            />
            <path
              className="fill-contrast stroke-[10rem] stroke-contrast"
              d="M8235.9,2205.9c-71.3-42.4-105.9-102.1-105.9-190.6v-84.7l533.4-535.3l535.3-535.3h-2228h-2228l-50.1-42.4c-102.1-90.5-94.4-258,15.4-323.5c59.7-36.6,111.7-38.5,2276.1-38.5h2214.5L8663.4-79.8C8137.7-607.5,8130-615.2,8130-694.1c0-146.3,132.9-246.5,261.9-198.3c63.6,25,1438.5,1386.5,1484.7,1471.2c61.6,117.5,55.8,127.1-722.1,903.1c-675.9,675.9-733.7,729.8-804.9,737.5C8309.1,2223.2,8257.1,2217.5,8235.9,2205.9z"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
