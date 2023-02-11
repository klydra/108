const API_HOST = "http://localhost:8090/api";

async function _get(path: string, headers?: HeadersInit) {
    return (await fetch(API_HOST + path, { method: "GET", headers: headers })).json()
}

async function _post(path: string, headers?: HeadersInit) {
    return (await fetch(API_HOST + path, { method: "POST", headers: headers })).json()
}

const API_USER_REGISTER = "/user/register"
const API_USER_LOGIN = "/user/login"
const API_SESSION_LIST = "/session/list"
const API_SESSION_JOIN = "/session/join"
const API_SESSION_LEAVE = "/session/leave"
const API_SESSION_RULES = "/session/rules"
const API_SESSION_ONGOING = "/session/ongoing"
const API_GAME_DRAW = "/game/draw"
const API_GAME_PLAY = "/game/play"
const API_GAME_WISH = "/game/wish"
const API_GAME_CALL = "/game/call"
const API_GAME_APPEAL = "/game/appeal"
const API_GAME_SWITCH = "/game/switch"
const API_GAME_CHALLENGE = "/game/challenge"

export async function userRegister(user: string, pass: string) {
    return _post(API_USER_REGISTER, { user, pass })
}

export async function userLogin(user: string, pass: string) {
    return _get(API_USER_LOGIN, { user, pass })
}

export async function sessionList() {
    return _get(API_SESSION_LIST)
}

export async function sessionJoin(session: string, token: string) {
    return _post(API_SESSION_JOIN, { session, token })
}

export async function sessionRules(session: string, rules: string) {
    return _post(API_SESSION_RULES, { session, rules })
}

export async function sessionLeave(token: string) {
    return _post(API_SESSION_LEAVE, { token })
}

export async function sessionOngoing(token: string) {
    return _post(API_SESSION_ONGOING, { token })
}

export async function gameDraw(token: string) {
    return _post(API_GAME_DRAW, { token })
}

export async function gamePlay(token: string, card: string) {
    return _post(API_GAME_PLAY, { token, card })
}

export async function gameWish(token: string, player: string) {
    return _post(API_GAME_WISH, { token, player })
}

export async function gameCall(token: string, player: string) {
    return _post(API_GAME_CALL, { token, player })
}

export async function gameAppeal(token: string, player: string) {
    return _post(API_GAME_APPEAL, { token, player })
}

export async function gameSwitch(token: string, player: string) {
    return _post(API_GAME_SWITCH, { token, player })
}

export async function gameChallenge(token: string, player: string) {
    return _post(API_GAME_CHALLENGE, { token, player })
}