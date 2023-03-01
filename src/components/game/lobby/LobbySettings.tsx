import {
  CompareArrows,
  EmojiEvents,
  Filter9Plus,
  Gavel,
  Layers,
  Reorder,
  Shuffle,
  Speed,
  Star,
} from "@mui/icons-material";
import { NumberInput, Switch } from "@mantine/core";
import { API_NOTIFICATION_GAME_TIMEOUT, sessionRules } from "../../../api/API";
import { showNotification } from "@mantine/notifications";
import React from "react";
import { SessionType } from "../../../models/Session";

export default function LobbySettings(props: { session: SessionType }) {
  return (
    <div className="max-w-2xl h-full overflow-y-auto">
      <div className="flex flex-col flex-grow justify-center items-center gap-y-4 mx-8">
        <Rule
          icon={<Reorder className="scale-[200%]" />}
          title="deck"
          text="number of cards that are distributed to everyone"
        >
          <NumberInput
            disabled={!props.session.me.host}
            value={props.session.rules.count}
            defaultValue={7}
            placeholder="7"
            minLength={1}
            maxLength={2}
            onChange={async (count) => {
              if (count && count >= 5 && count <= 12)
                await rules(props.session, {
                  count: count ?? 7,
                });
            }}
          />
        </Rule>
        <Rule
          icon={<Shuffle className="scale-[200%]" />}
          title="random cards"
          text="Cards drawn, given, etc. are taken from a random position in the stack."
        >
          <Switch
            disabled={!props.session.me.host}
            color="gray"
            checked={props.session.rules.ordered}
            onClick={() =>
              rules(props.session, {
                ordered: !props.session.rules.ordered,
              })
            }
          />
        </Rule>
        <Rule
          icon={<Shuffle className="scale-[200%]" />}
          title="unlimited cards"
          text="There is no cards deck. Every card drawn, given, etc. is purely random."
        >
          <Switch
            disabled={!props.session.me.host}
            color="gray"
            checked={props.session.rules.bottomless}
            onClick={() =>
              rules(props.session, {
                bottomless: !props.session.rules.bottomless,
              })
            }
          />
        </Rule>
        <Rule
          icon={<EmojiEvents className="scale-[200%]" />}
          title="short match"
          text="The game ends when the first player has played out all their cards."
        >
          <Switch
            disabled={!props.session.me.host}
            color="gray"
            checked={props.session.rules.king}
            onClick={() =>
              rules(props.session, {
                king: !props.session.rules.king,
              })
            }
          />
        </Rule>
        <Rule
          icon={<Star className="scale-[200%]" />}
          title="holding"
          text="If you draw a matching card you choose to play it instantly or hold onto it."
        >
          <Switch
            disabled={!props.session.me.host}
            color="gray"
            checked={props.session.rules.hold}
            onClick={() =>
              rules(props.session, {
                hold: !props.session.rules.hold,
              })
            }
          />
        </Rule>
        <Rule
          icon={<Filter9Plus className="scale-[200%]" />}
          title="million cards"
          text="You need to draw until you get a matching card."
        >
          <Switch
            disabled={!props.session.me.host}
            color="gray"
            checked={props.session.rules.unlimited}
            onClick={() =>
              rules(props.session, {
                unlimited: !props.session.rules.unlimited,
              })
            }
          />
        </Rule>
        <Rule
          icon={<Layers className="scale-[200%]" />}
          title="stacks of 2"
          text="Draw-2 cards are stackable."
        >
          <Switch
            disabled={!props.session.me.host}
            color="gray"
            checked={props.session.rules.stack2}
            onClick={() =>
              rules(props.session, {
                stack2: !props.session.rules.stack2,
              })
            }
          />
        </Rule>
        <Rule
          icon={<Layers className="scale-[200%]" />}
          title="stacks of 4"
          text="Draw-4 cards are stackable."
        >
          <Switch
            disabled={!props.session.me.host}
            color="gray"
            checked={props.session.rules.stack4}
            onClick={() =>
              rules(props.session, {
                stack4: !props.session.rules.stack4,
              })
            }
          />
        </Rule>
        <Rule
          icon={<CompareArrows className="scale-[200%]" />}
          title="magic 7"
          text="If a 7 is played, the player can choose one opponent to swap cards with."
        >
          <Switch
            disabled={!props.session.me.host}
            color="gray"
            checked={props.session.rules.swap}
            onClick={() =>
              rules(props.session, {
                swap: !props.session.rules.swap,
              })
            }
          />
        </Rule>
        <Rule
          icon={<Speed className="scale-[200%]" />}
          title="throwing"
          text="If a card is played and a player has the identical card, they may choose to throw it in, even if it isn't their turn. The game will then continue from the player after them."
        >
          <Switch
            disabled={!props.session.me.host}
            color="gray"
            checked={props.session.rules.throw}
            onClick={() =>
              rules(props.session, {
                throw: !props.session.rules.throw,
              })
            }
          />
        </Rule>
      </div>
    </div>
  );
}

async function rules(session: SessionType, override: object) {
  const rules = { ...session.rules, ...override };

  const set = await sessionRules(JSON.stringify(rules));
  if (set["code"] !== 200) {
    showNotification({
      autoClose: API_NOTIFICATION_GAME_TIMEOUT,
      message: set["message"] ?? "An unknown error occurred.",
      color: "red",
      icon: <Gavel />,
    });
  } else {
    showNotification({
      autoClose: API_NOTIFICATION_GAME_TIMEOUT,
      message: "Rules saved.",
      color: "violet",
      icon: <Gavel />,
    });
  }
}

function Rule(props: {
  icon: React.ReactNode;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full">
      <div className="w-1/6 flex justify-center items-center">{props.icon}</div>
      <div className="w-2/3 text-[1.5rem] text-card-accent font-semibold tracking-[.01em] font-default w-[30rem] h-[5rem] flex justify-center items-start flex-col">
        <p>{props.title}</p>
        <p className="text-[0.8rem] max-w-[26rem] text-card-accent font-light tracking-[.01em] font-default">
          {props.text}
        </p>
      </div>
      <div className="w-1/6 max-w-[3.5rem] w-[3.5rem] flex justify-center items-center">
        {props.children}
      </div>
    </div>
  );
}
