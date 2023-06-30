import type { Component } from "solid-js";
import Field from "@/components/field/Field";
import PlaymatesList from "@/components/playmates/PlaymatesList";
import { createSignal, Match, Switch } from "solid-js";

const Game: Component = () => {
  const [isInGame, toogle] = createSignal(false);
  return (
    <div class="flex h-[100vh]">
      <div class="w-[calc(100vw-100vh)] h-[100vh] overflow-y-auto bg-[gray]">
        <PlaymatesList />
      </div>
      <div class="w-[100vh]">
        <Switch fallback={<Field players={[]} />}>
          <Match when={!isInGame()}>
            <div class="flex justify-center items-center h-full">
              <button
                class="rounded-full w-[10rem] aspect-square bg-[gray] text-white"
                onClick={() => toogle(true)}
              >
                join game
              </button>
            </div>
          </Match>
        </Switch>
      </div>
    </div>
  );
};

export default Game;
