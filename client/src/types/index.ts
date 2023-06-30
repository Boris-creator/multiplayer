export type Nullable<T> = T | null;
export type Playmate = {
  clientId: string;
  userId: number;
  userName: string;
};

export type Position = {
  x: number;
  y: number;
};
export type Step = {
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
};

export type GameState = {
  locations: Record<string, { position: Position; user: Playmate }>;
};

export enum EventName {
  join = "join",
  message = "message",
  move = "move",
  gameState = "gameState",
  joinGame = "joinGame",
}

export type JoinDisconnectPayload = { clientId: string; users: Playmate[] };
export type MessageEventPayload = { userID: number; message: string };
export type GameStatePayload = {
  connected: Array<{
    user: Playmate;
    position: Position;
  }>;
};
export type JoinGamePayload = {
  joining: Array<{
    user: Playmate;
    position: Position;
  }>;
  disconnecting: Array<{
    user: Playmate;
    position: Position;
  }>;
};
export type MoveEventPayload = {
  clientID: number;
  userName: string;
  x: Position["x"];
  y: Position["y"];
};
export type EventData = {
  eventName: EventName;
  eventPayload:
    | JoinDisconnectPayload
    | MessageEventPayload
    | MoveEventPayload
    | GameStatePayload
    | JoinGamePayload;
};
