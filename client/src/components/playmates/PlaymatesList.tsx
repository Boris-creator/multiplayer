import { For } from "solid-js";
import { state, setState } from "@/store";
import { useWS } from "@/components/WSProvider";
import type { JoinDisconnectPayload, EventData } from "@/types";
import type { Component } from "solid-js";

const PlaymatesList: Component = () => {
  const self = state.user;
  const wsConn = useWS();
  wsConn?.addEventListener("message", (e) => {
    console.log(e);
    const data = JSON.parse((e as MessageEvent).data) as EventData;

    if (data.eventName === "join") {
      const payload = data.eventPayload as JoinDisconnectPayload;

      const newUser = payload.users.find(
        ({ clientId }) => clientId === payload.clientId
      );
      setState("playmates", () => payload.users);
      if (newUser?.userId === self?.userId) {
        setState("clientId", () => newUser?.clientId as string);
      } else {
        wsConn.send(
          JSON.stringify({
            eventName: "message",
            eventPayload: {
              userID: payload.clientId,
              message: "hiiii",
            },
          })
        );
      }
    }
  });

  return (
    <div>
      <For each={state.playmates}>
        {mate => (
          <div>
            <div
              class="text-bold text-left p-7 bg-[lightgray] border-b-2 border-b-[darkgray] cursor-pointer"
              classList={{ "text-[red]": mate.userId === self?.userId }}
            >
              {mate.userName}
            </div>
          </div>
        )}
      </For>
    </div>
  );
};

export default PlaymatesList;
