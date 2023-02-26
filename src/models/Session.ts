import { createAvatar } from "@dicebear/core";
import { loreleiNeutral } from "@dicebear/collection";

export type SessionType = {
  me: SessionMe;
  enemies: SessionEnemy[];
  order: string[];
  globals: GameGlobals;
  rules: GameRules;
  stack: string[];
};

export type SessionMe = {
  name: string;
  avatar: string;
  hand: string[];
  called: boolean;
  host: boolean;
  live: boolean;
};

export type SessionEnemy = {
  name: string;
  avatar: string;
  cards: number;
  called: boolean;
  live: boolean;
};

function avatar(name: string) {
  return createAvatar(loreleiNeutral, { seed: name }).toString();
}

export function sessionConstruct(player: PlayerType, game: GameType) {
  const me = game.players.find((item) => item.name === player.name);
  const enemies = game.players.filter((item) => item.name !== me!.name);

  return {
    me: {
      name: player.name,
      avatar: avatar(player.name),
      hand: player.hand,
      called: me!.called ?? false,
      host: game.players[0].name === player.name,
      live: me!.name === game.globals.live,
    },
    enemies: enemies.map((enemy) => {
      return {
        name: enemy.name,
        avatar: avatar(enemy.name),
        cards: enemy.cards,
        called: enemy.called,
        live: enemy.name === game.globals.live,
      };
    }),
    order: game.players.map((item) => item.name),
    globals: game.globals,
    rules: game.rules,
    stack: game.stack,
  };
}

export function sessionCurrent(session: SessionType) {
  if (session.me.live) return session.me;
  else return session.enemies.find((enemy) => enemy.live);
}

export function sessionNext(session: SessionType) {
  const current = session.order.findIndex(
    (item) => item === session.globals.live
  );
  return session.order[current !== session.order.length - 1 ? current + 1 : 0];
}

export function sessionLast(session: SessionType) {
  const current = session.order.findIndex(
    (item) => item === session.globals.live
  );
  return session.order[current !== 0 ? current - 1 : session.order.length - 1];
}
