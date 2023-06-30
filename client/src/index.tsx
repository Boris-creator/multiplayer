/* @refresh reload */
import { render } from "solid-js/web";

import "./index.scss";
import { Router } from "@solidjs/router";
import App from "./App";
import { WSProvider } from "@/components/WSProvider";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got mispelled?"
  );
}

render(
  () => (
    <WSProvider>
      <Router>
        <App />
      </Router>
    </WSProvider>
  ),
  root as HTMLElement
);
