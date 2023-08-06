import type { Building } from "@/types/buildings";
import { Nullable } from "@/types";

interface Mesh {
  name: string;
}
export interface Render {
  addMesh(meshName: string): Mesh;
  getMeshByName(meshName: string): Nullable<Mesh>;
  addBuilding(building: Building): unknown;
}
