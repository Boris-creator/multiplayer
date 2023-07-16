import { onCleanup } from "solid-js";
import type { Nullable } from "@/types";

export function useKeyboard(
  eventHandler: (ev: KeyboardEvent) => void,
  el = document.body
) {
  let isListening = false;
  let lastEvent: Nullable<KeyboardEvent> = null;

  const keyDownHandler = (ev: KeyboardEvent) => {
    if (isListening || lastEvent?.type === "keyup") {
      lastEvent = ev;
      setTimeout(() => {
        if (lastEvent === ev) {
          isListening = true;
        }
      }, 1000);
    }
    if (isListening) {
      eventHandler(ev);
      isListening = false;
    }
  };
  const keyUpHandler = (ev: KeyboardEvent) => {
    lastEvent = ev;
    eventHandler(ev);
  };
  el.addEventListener("keydown", keyDownHandler);
  el.addEventListener("keyup", keyUpHandler);

  function removeListeners() {
    if (el) {
      el.removeEventListener("keydown", keyDownHandler);
      el.removeEventListener("keyup", keyUpHandler);
    }
  }
  onCleanup(removeListeners);
  return removeListeners;
}
