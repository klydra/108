const API_HOST = "http://localhost:8090/api";

async function _post(path: string, headers?: HeadersInit) {
  return (
    await fetch(API_HOST + path, { method: "POST", headers: headers })
  ).json();
}

const API_USER_REGISTER = "/user/register";
const API_SESSION_CREATE = "/session/create";
const API_SESSION_JOIN = "/session/join";
const API_SESSION_LEAVE = "/session/leave";
const API_SESSION_RULES = "/session/rules";
const API_SESSION_ONGOING = "/session/ongoing";
const API_GAME_DRAW = "/game/draw";
const API_GAME_PLAY = "/game/play";
const API_GAME_WISH = "/game/wish";
const API_GAME_CALL = "/game/call";
const API_GAME_APPEAL = "/game/appeal";
const API_GAME_SWITCH = "/game/switch";
const API_GAME_CHALLENGE = "/game/challenge";

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

export async function sessionJoin() {
  return _post(API_SESSION_JOIN, { ...credentials() });
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

export async function gameWish(player: string) {
  return _post(API_GAME_WISH, { ...credentials(), player });
}

export async function gameCall(player: string) {
  return _post(API_GAME_CALL, { ...credentials(), player });
}

export async function gameAppeal(player: string) {
  return _post(API_GAME_APPEAL, { ...credentials(), player });
}

export async function gameSwitch(player: string) {
  return _post(API_GAME_SWITCH, { ...credentials(), player });
}

export async function gameChallenge(player: string) {
  return _post(API_GAME_CHALLENGE, { ...credentials(), player });
}
