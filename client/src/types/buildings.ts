import type { Position, Vector } from "@/types/index";

type WallWindow = {
  base: number;
  left: number;
  width: number;
  height: number;
};
type Wall = {
  corner: Vector;
  width: number;
  height: number;
  thick: number;
  windows: WallWindow[];
};
export type Building = {
  walls: Wall[];
  innerWalls: Array<Array<Vector>>;
};
