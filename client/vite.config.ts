import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import * as path from "path";
import devtools from "solid-devtools/vite";

export default defineConfig({
  plugins: [
    solidPlugin(),
    /*
    devtools({
      autoname: true,
    }),
    */
  ],
  server: {
    port: 3001,
  },
  build: {
    target: "esnext",
  },
  resolve: {
    alias: {
      "@": path.join(__dirname, "src"),
    },
  },
});
