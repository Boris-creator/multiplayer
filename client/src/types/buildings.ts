import type { Vector } from "@/types/index";

type Wall = {
  corner: Vector;
  width: number;
  height: number;
  thick: number;
};
export type Building = {
  walls: Wall[];
};
