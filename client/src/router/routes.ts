import { RouteDefinition } from "@solidjs/router";
import { ROUTER_PATHS } from "@/router/constants";
import { lazy } from "solid-js";
export default [
  {
    path: ROUTER_PATHS.auth.prefix,
    children: [
      {
        path: ROUTER_PATHS.auth.login,
        component: lazy(() => import("@/components/login/LoginForm")),
      },
    ],
  },
  {
    path: ROUTER_PATHS.game.prefix,
    component: lazy(() => import("@/components/Game")),
  },
] as Array<RouteDefinition>;
