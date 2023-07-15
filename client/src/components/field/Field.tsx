import {
  type Component,
  createMemo,
  createSignal,
  For,
  createEffect,
  onMount,
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
import {
  type Rotation,
  rotateClockwise,
  applyRotation,
} from "@/helpers/geometryHelper";
import { EventName } from "@/types";
import { RenderService, type Mesh } from "@/services/renderService";

const fieldWidth = 10;
const fieldHeight = 10;

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
  let scene: RenderService;

  const [rotation, rotate] = createSignal<Rotation>(0);

  wsConn?.init();
  wsConn?.addEventListener("message", (e) => {
    const data = JSON.parse((e as MessageEvent).data) as EventData;

    if (data.eventName === EventName.move) {
      const { clientId, userName, x, y } =
        data.eventPayload as MoveEventPayload;
      setGameState("locations", locations => ({
        ...locations,
        [clientId]: {
          user: { userName, clientId } as Playmate,
          position: { x, y },
        },
      }));

      scene.moveMesh2D(scene.getMeshByName(`${clientId}`) as Mesh, {
        x,
        y,
      });
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

      disconnecting.forEach(({ user }) => {
        RenderService.removeMesh(scene.getMeshByName(user.clientId) as Mesh);
      });
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
    if (ev.code === "KeyE") {
      rotate(rotateClockwise);
      scene.rotateCamera(rotation());
      return;
    }
    const keyCodes: Record<KeyboardEvent["code"], Step> = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowRight: { x: 1, y: 0 },
      ArrowLeft: { x: -1, y: 0 },
    };

    if (!(ev.code in keyCodes)) {
      return;
    }
    const step = keyCodes[ev.code];
    const rotatedStep = applyRotation(rotation(), step);
    wsConn?.send(
      JSON.stringify({
        eventName: "move",
        eventPayload: {
          x: rotatedStep.x,
          y: rotatedStep.y,
        },
      })
    );
  };

  createEffect(() => {
    if (state.wsConnReady) {
      joinGame();
    }
  });

  createEffect(() => {
    Object.values(gameState.locations).forEach(({ user, position }) => {
      if (!scene.getMeshByName(user.clientId)) {
        const mesh = scene.addMesh(user.clientId);
        scene.moveMesh2D(mesh, position);

        if (user.clientId === selfClientId()) {
          scene.attachCameraTo(mesh);
        }
      }
    });
  });

  let canvas!: HTMLCanvasElement;
  onMount(() => {
    scene = new RenderService(canvas, {
      width: fieldWidth,
      height: fieldHeight,
    });
  });

  return (
    <div>
      <div class="flex justify-center relative">
        <div class="absolute top-0 right-0">
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
              fill="rgba(255, 255, 255, .5)"
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
        <canvas
          ref={canvas}
          width={300}
          height={300}
          class="bg-[lightgray] w-full"
          tabIndex="-1"
          onKeyUp={handleMove}
        />
      </div>
    </div>
  );
};
export default Field;
