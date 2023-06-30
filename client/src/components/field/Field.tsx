import {
  type Component,
  createMemo,
  createSignal,
  For,
  createEffect,
} from "solid-js";
import { gameState, setGameState } from "@/store/game";
import { state } from "@/store";
import { useWS } from "@/components/WSProvider";
import type {
  EventData,
  GameStatePayload,
  JoinGamePayload,
  MoveEventPayload,
  Playmate,
  Position,
  Step,
} from "@/types";
import { EventName } from "@/types";

const [gameField] = createSignal({
  x: 0,
  y: 0,
  width: 100,
  height: 100,
});

const cellSide = 10;

const Field: Component<{ players: Array<Position> }> = () => {
  const selfClientId = createMemo(() => state.clientId);
  const wsConn = useWS();
  wsConn?.init();
  wsConn?.addEventListener("message", (e) => {
    const data = JSON.parse((e as MessageEvent).data) as EventData;

    if (data.eventName === EventName.move) {
      const { clientID, userName, x, y } =
        data.eventPayload as MoveEventPayload;
      setGameState("locations", locations => ({
        ...locations,
        [clientID]: {
          user: { userName } as Playmate,
          position: { x, y },
        },
      }));
    }

    if (data.eventName === EventName.gameState) {
      const { connected } = data.eventPayload as GameStatePayload;
      const userLocations: typeof gameState.locations = {};
      connected.forEach(({ user, position }) => {
        userLocations[user.clientId] = { user, position };
      });
      setGameState("locations", () => userLocations);
    }

    if (data.eventName === EventName.joinGame) {
      const { joining, disconnecting } = data.eventPayload as JoinGamePayload;

      setGameState("locations", (locations) => ({
        ...Object.fromEntries(
          Object.entries(locations).filter(
            ([clientId]) =>
              !disconnecting.some(({ user }) => user.clientId === clientId)
          )
        ),
        ...Object.fromEntries(
          joining.map(({ user, position }) => [
            user.clientId,
            { user, position },
          ])
        ),
      }));
    }
  });

  const joinGame = () => {
    wsConn?.send(
      JSON.stringify({
        eventName: "joinGame",
        eventPayload: {},
      })
    );
  };
  const handleMove = (ev: KeyboardEvent) => {
    const keyCodes: Record<KeyboardEvent["code"], Step> = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowRight: { x: 1, y: 0 },
      ArrowLeft: { x: -1, y: 0 },
    };
    const step = keyCodes[ev.code];
    wsConn?.send(
      JSON.stringify({
        eventName: "move",
        eventPayload: {
          x: step.x,
          y: step.y,
        },
      })
    );
  };

  createEffect(() => {
    if (state.wsConnReady) {
      joinGame();
    }
  });

  return (
    <div>
      <div class="flex justify-center">
        <svg
          class="border border-[silver] w-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          viewBox="0 0 100 100"
        >
          <rect
            x={gameField().x}
            y={gameField().y}
            width={gameField().width}
            height={gameField().height}
            fill="white"
            tabIndex="-1"
            onKeyUp={handleMove}
          />
          <g>
            <For each={Object.entries(gameState.locations)}>
              {([
                clientId,
                {
                  position: { x, y },
                },
              ]) => (
                <rect
                  x={x * cellSide}
                  y={y * cellSide}
                  width={cellSide}
                  height={cellSide}
                  fill={clientId === selfClientId() ? "red" : "black"}
                />
              )}
            </For>
          </g>
        </svg>
      </div>
    </div>
  );
};
export default Field;
