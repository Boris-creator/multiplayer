import { GameState } from "@/types";
import { createStore } from "solid-js/store";

export const [gameState, setGameState] = createStore<GameState>({
  locations: {},
});
