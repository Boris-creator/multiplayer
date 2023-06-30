import type { Component } from "solid-js";
import { useRoutes } from "@solidjs/router";

import { routes } from "@/router";
import styles from "./App.module.css";

const Routes = useRoutes(routes);
const App: Component = () => {
  return (
    <div class={styles.App}>
      <Routes />
    </div>
  );
};

export default App;
