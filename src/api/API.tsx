import { showNotification } from "@mantine/notifications";
import { AccountCircle, PlayArrow } from "@mui/icons-material";
import React from "react";

export const API_HOST = "http://127.0.0.1:8090";
export const API_NOTIFICATION_NOTICE_TIMEOUT = 8000;
export const API_NOTIFICATION_GAME_TIMEOUT = 1000;

async function _post(path: string, headers?: HeadersInit) {
  const response = await fetch(API_HOST + path, {
    method: "POST",
    headers: headers,
  });

  return {
    ...(await response.json()),
    code: response.status,
  };
}

const API_USER_REGISTER = "/user/register";
const API_SESSION_CREATE = "/session/create";
const API_SESSION_JOIN = "/session/join";
const API_SESSION_LEAVE = "/session/leave";
const API_SESSION_START = "/session/start";
const API_SESSION_RULES = "/session/rules";
const API_SESSION_ONGOING = "/session/ongoing";
const API_GAME_DRAW = "/game/draw";
const API_GAME_PLAY = "/game/play";
const API_GAME_THROW = "/game/throw";
const API_GAME_HOLD = "/game/hold";
const API_GAME_WISH = "/game/wish";
const API_GAME_CALL = "/game/call";
const API_GAME_APPEAL = "/game/appeal";
const API_GAME_SWITCH = "/game/switch";
const API_GAME_TIMEOUT = "/game/timeout";

function credentials() {
  return {
    token: localStorage.getItem("token") ?? "",
  };
}

export async function userRegister() {
  return _post(API_USER_REGISTER);
}

export async function sessionCreate() {
  return _post(API_SESSION_CREATE, { ...credentials() });
}

export async function sessionJoin(game: string) {
  return _post(API_SESSION_JOIN, { ...credentials(), game });
}

export async function sessionStart() {
  return _post(API_SESSION_START, { ...credentials() });
}

export async function sessionRules(rules: string) {
  return _post(API_SESSION_RULES, { ...credentials(), rules });
}

export async function sessionLeave() {
  return _post(API_SESSION_LEAVE, { ...credentials() });
}

export async function sessionOngoing() {
  return _post(API_SESSION_ONGOING, { ...credentials() });
}

export async function gameDraw() {
  return _post(API_GAME_DRAW, { ...credentials() });
}

export async function gamePlay(card: string) {
  return _post(API_GAME_PLAY, { ...credentials(), card });
}

export async function gameThrow(card: string) {
  return _post(API_GAME_THROW, { ...credentials(), card });
}

export async function gameHold() {
  return _post(API_GAME_HOLD, { ...credentials() });
}

export async function gameWish(color: string) {
  return _post(API_GAME_WISH, { ...credentials(), color });
}

export async function gameCall() {
  return _post(API_GAME_CALL, { ...credentials() });
}

export async function gameAppeal(player: string) {
  return _post(API_GAME_APPEAL, { ...credentials(), player });
}

export async function gameSwitch(player: string) {
  return _post(API_GAME_SWITCH, { ...credentials(), player });
}

export async function gameTimeout(player: string) {
  return _post(API_GAME_TIMEOUT, { ...credentials(), player });
}

export async function ensureRegistered() {
  if (!localStorage.getItem("token")) {
    const user = await userRegister();

    if (user["code"] !== 200) {
      showNotification({
        autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
        message: user["message"],
        color: "red",
        icon: <AccountCircle />,
      });
      return;
    }

    showNotification({
      autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
      message: "Created user.",
      color: "green",
      icon: <AccountCircle />,
    });

    localStorage.setItem("token", user["token"]);

    console.log(user);

    return user["token"];
  } else {
    return localStorage.getItem("token");
  }
}

export async function createGame() {
  const create = await sessionCreate();
  if (create["code"] !== 200) {
    showNotification({
      autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
      message: create["message"],
      color: "red",
      icon: <PlayArrow />,
    });
    return;
  }

  showNotification({
    autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
    message: "Created game.",
    color: "green",
    icon: <PlayArrow />,
  });

  return create["game"];
}

export async function joinGame(game: string) {
  const join = await sessionJoin(game);
  if (join["code"] !== 200) {
    showNotification({
      autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
      message: join["message"],
      color: "red",
      icon: <PlayArrow />,
    });
    return;
  }

  showNotification({
    autoClose: API_NOTIFICATION_NOTICE_TIMEOUT,
    message: "Joining game...",
    color: "green",
    icon: <PlayArrow />,
  });

  return game;
}
