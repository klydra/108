const API_HOST = "http://localhost:8090/api";

async function _get(path: string, headers?: HeadersInit) {
    return (await fetch(API_HOST + path, { method: "GET", headers: headers })).json()
}

async function _post(path: string, headers?: HeadersInit) {
    return (await fetch(API_HOST + path, { method: "POST", headers: headers })).json()
}

const API_ACCOUNT_REGISTER = "register"
const API_ACCOUNT_LOGIN = "login"
const API_SESSION_LIST = "session/list"
const API_SESSION_JOIN = "session/join"
const API_SESSION_LEAVE = "session/leave"
const API_SESSION_ONGOING = "session/ongoing"
const API_GAME_DRAW = "game/draw"
const API_GAME_PLAY = "game/play"
const API_GAME_CALL = "game/call"

export async function accountRegister(user: string, pass: string) {
    return _post(API_ACCOUNT_REGISTER, { user, pass })
}

export async function accountLogin(user: string, pass: string) {
    return _get(API_ACCOUNT_LOGIN, { user, pass })
}

export async function sessionList() {
    return _get(API_SESSION_LIST)
}

export async function sessionJoin(session: string, token: string) {
    return _post(API_SESSION_JOIN, { session, token })
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

export async function gameCall(token: string, player: string) {
    return _post(API_GAME_CALL, { token, player })
}