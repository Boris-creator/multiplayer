import { BASE_URL } from "@/constants";
import { state, setState } from "@/store";
import type { Nullable } from "@/types";

type EventType = "open" | "message" | "close";
type ListenerClb = (ev: MessageEvent | Event | CloseEvent) => void;

export class WSService {
  protected webSocket: Nullable<WebSocket> = null;
  protected listeners: Array<{ eventType: EventType; clb: ListenerClb }> = [];

  async init() {
    const wsConnection = state.wsConn;
    if (wsConnection !== null) {
      return false;
    }
    const token = state.token;
    if (token === null) {
      return false;
    }
    const url = new URL(BASE_URL + "ws");
    url.searchParams.append("token", token);
    url.protocol = "ws";
    this.webSocket = new WebSocket(url.toString());
    const initializationPromise = new Promise(resolve => {
      (this.webSocket as WebSocket).onopen = () => {
        setState("wsConnReady", () => true);
        resolve(true);
      };
    });
    this.listeners.forEach(({ eventType, clb }) => {
      this.addEventListener(eventType, clb);
    });
    this.listeners.length = 0;
    setState("wsConn", () => this);
    return initializationPromise;
  }

  addEventListener(eventType: EventType, clb: ListenerClb) {
    if (!this.webSocket) {
      this.listeners.push({ eventType, clb });
      return;
    }
    this.webSocket.addEventListener(eventType, clb);
  }

  send(data: string) {
    this.webSocket?.send(data);
  }
}
