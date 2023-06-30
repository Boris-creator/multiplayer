import type { Nullable, Playmate } from "@/types";
import { createStore } from "solid-js/store";
import { WSService } from "@/services/socketService";

type State = {
  token: string | null;
  clientId: Nullable<string>;
  user: Nullable<Pick<Playmate, "userId" | "userName">>;
  playmates: Array<Playmate>;
  wsConn: Nullable<WSService>;
  wsConnReady: boolean;
};

export const [state, setState] = createStore<State>({
  token: null,
  clientId: null,
  user: null,
  playmates: [],
  wsConn: null,
  wsConnReady: false,
});
