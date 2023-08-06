import type { Step, Vector } from "@/types";
import { Vector3 } from "@babylonjs/core";

export type Rotation = 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;
const ROTATIONS = new Map<Rotation, number[][]>([
  [
    0,
    [
      [1, 0],
      [0, 1],
    ],
  ],
  [
    45,
    [
      [1, -1],
      [1, 1],
    ],
  ],
  [
    90,
    [
      [0, -1],
      [1, 0],
    ],
  ],
  [
    135,
    [
      [-1, 1],
      [-1, -1],
    ],
  ],
  [
    180,
    [
      [-1, 0],
      [0, -1],
    ],
  ],
  [
    225,
    [
      [-1, 1],
      [1, -1],
    ],
  ],
  [
    270,
    [
      [0, 1],
      [-1, 0],
    ],
  ],
  [
    315,
    [
      [-1, -1],
      [1, 1],
    ],
  ],
]);

export function rotateClockwise(rotation: Rotation) {
  return ((rotation + 45) % 360) as Rotation;
}

export function applyRotation(rotation: Rotation, step: Step) {
  const matrix = ROTATIONS.get(rotation) as number[][];
  return {
    x: step.x * matrix[0][0] + step.y * matrix[1][0],
    y: step.x * matrix[0][1] + step.y * matrix[1][1],
  } as Step;
}

//TODO write scaling function

export function castTo3DCoordinates(coordinates2D: Vector): Vector {
  return {
    x: coordinates2D.x,
    y: coordinates2D.z,
    z: coordinates2D.y,
  };
}

export function getPerpendicular(vector: Vector3) {
  return new Vector3(vector.z, vector.y, -vector.x);
}
