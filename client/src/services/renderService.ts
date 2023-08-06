import {
  Scene,
  Engine,
  UniversalCamera,
  HemisphericLight,
  Vector2,
  Vector3,
  VertexData,
  MeshBuilder,
  CSG,
  PolygonMeshBuilder,
  Color3,
  Mesh,
  StandardMaterial,
} from "@babylonjs/core";
import earcut from "earcut";
import {
  castTo3DCoordinates,
  getPerpendicular,
  type Rotation,
} from "@/helpers/geometryHelper";
import { Building } from "@/types/buildings";
import type { Vector } from "@/types";
import math from "mathjs";
import { Render } from "@/interfaces/RenderService";

type VertexFullData = VertexData & {
  positions: Extract<VertexData["positions"], number[]>;
  indices: Extract<VertexData["indices"], number[]>;
};

const meshCellSide = 0.1;

export class RenderService implements Render {
  private readonly scene: Scene;
  private readonly engine: Engine;
  private camera: UniversalCamera;
  private cameraAttached = false;

  private PERSON_HEIGHT = 3;

  constructor(
    private canvas: HTMLCanvasElement,
    private fieldSize: { width: number; height: number }
  ) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.createScene();
    this.camera = new UniversalCamera(
      "camera",
      new Vector3(0, 0.2, -5),
      this.scene
    );
    new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
    this.camera.attachControl(canvas, true);

    const ground = MeshBuilder.CreateGround("ground", {
      width: 10,
      height: 10,
    });
    const groundMaterial = new StandardMaterial("backgroundMaterial");
    groundMaterial.diffuseColor = new Color3(0.5, 0.5, 0.8);
    ground.material = groundMaterial;

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }
  private createScene() {
    return new Scene(this.engine);
  }
  addMesh(meshName: string) {
    return MeshBuilder.CreateBox(meshName, {
      width: meshCellSide,
      height: meshCellSide * this.PERSON_HEIGHT,
      depth: meshCellSide,
      sideOrientation: Mesh.DOUBLESIDE,
    });
  }
  static removeMesh(mesh: Mesh) {
    mesh.dispose();
  }
  getMeshByName(meshName: string) {
    return this.scene.getMeshByName(meshName);
  }

  moveMesh2D(mesh: Mesh, position: { x: number; y: number }) {
    const fieldCoordinates = this.getCoordinates({
      ...position,
      z: (meshCellSide * this.PERSON_HEIGHT) / 2,
    });
    const coordinates = castTo3DCoordinates(fieldCoordinates);
    mesh.position = new Vector3(coordinates.x, coordinates.y, coordinates.z);
  }

  attachCameraTo(mesh: Mesh) {
    if (this.cameraAttached) {
      return;
    }
    this.scene.registerBeforeRender(() => {
      this.camera.position.x =
        mesh.position.x - Math.sin(this.camera.rotation.y) * 1.5;
      this.camera.position.y = mesh.position.y + 0.3;
      this.camera.position.z =
        mesh.position.z - Math.cos(this.camera.rotation.y) * 1.5;
    });
    this.cameraAttached = true;
  }

  rotateCamera(angle: Rotation) {
    this.camera.rotation.y = (angle * Math.PI) / 180;
  }

  addBuilding(building: Building) {
    const walls = building.walls.map((wall) => {
      const { x, y, z } = castTo3DCoordinates(this.getCoordinates(wall.corner));
      return {
        ...wall,
        corner: new Vector3(x, y, z),
        windows: wall.windows.map((wallWindow) => ({
          left: wallWindow.left / this.fieldSize.width,
          width: wallWindow.width / this.fieldSize.width,
          base: wallWindow.base / this.fieldSize.width,
          height: wallWindow.height / this.fieldSize.width,
        })),
      };
    });

    const innerWalls = building.innerWalls.map((wall) =>
      wall.map((corner) => castTo3DCoordinates(this.getCoordinates(corner)))
    );

    const { thick: wallThickness, height } = walls[0];
    const wallsCount = walls.length;

    const outerCornersPoints: Array<Vector3> = [];

    let angle = 0;
    let direction = 0;
    let line = Vector3.Zero();

    walls[1].corner.subtractToRef(walls[0].corner, line);
    const nextLine = Vector3.Zero();
    walls[2].corner.subtractToRef(walls[1].corner, nextLine);

    for (let w = 0; w <= wallsCount; w++) {
      angle = Math.acos(
        Vector3.Dot(line, nextLine) / (line.length() * nextLine.length())
      );
      direction = Vector3.Cross(nextLine, line).normalize().y;
      const lineNormal = new Vector3(line.z, 0, -1 * line.x).normalize();
      line.normalize();
      outerCornersPoints[(w + 1) % wallsCount] = walls[
        (w + 1) % wallsCount
      ].corner
        .add(lineNormal.scale(wallThickness))
        .add(line.scale((direction * wallThickness) / Math.tan(angle / 2)));
      line = nextLine.clone();
      walls[(w + 3) % wallsCount].corner.subtractToRef(
        walls[(w + 2) % wallsCount].corner,
        nextLine
      );
    }

    const outerCorners: Array<Vector2> = [];
    const innerCorners: Array<Vector2> = [];

    for (let w = 0; w < wallsCount; w++) {
      innerCorners.push(new Vector2(walls[w].corner.x, walls[w].corner.z));
      outerCorners.push(
        new Vector2(outerCornersPoints[w].x, outerCornersPoints[w].z)
      );
    }

    const exterior = new PolygonMeshBuilder(
      "exterior",
      outerCorners,
      this.scene,
      earcut
    );
    exterior.addHole(innerCorners);
    const buildingMesh = exterior.build(false, height);
    buildingMesh.position.y = height;

    const buildingForm = CSG.FromMesh(buildingMesh);
    buildingMesh.dispose();

    walls.forEach((wall, wallIndex) => {
      for (const windowPlan of wall.windows) {
        const nextWallCorner = new Vector3(
          outerCorners[(wallIndex + 1) % wallsCount].x,
          0,
          outerCorners[(wallIndex + 1) % wallsCount].y
        );
        const wallCorner = new Vector3(
          outerCorners[wallIndex].x,
          0,
          outerCorners[wallIndex].y
        );

        const perpendicular = new Vector3(
          wallCorner.subtract(nextWallCorner).z,
          0,
          -wallCorner.subtract(nextWallCorner).x
        );
        const nicheDirection = [
          wallCorner,
          wallCorner.add(perpendicular.normalize().scale(wallThickness)),
        ];

        const windowCorners = [
          [windowPlan.left, windowPlan.base],
          [windowPlan.left + windowPlan.width, windowPlan.base],
          [
            windowPlan.left + windowPlan.width,
            windowPlan.base + windowPlan.height,
          ],
          [windowPlan.left, windowPlan.base + windowPlan.height],
        ].map((v) => new Vector3(v[0], v[1], 0));

        const windowHole = MeshBuilder.ExtrudeShape(
          "windowHole",
          {
            shape: windowCorners,
            closeShape: true,
            path: nicheDirection,
            sideOrientation: Mesh.DOUBLESIDE,
            cap: Mesh.CAP_ALL,
          },
          this.scene
        );
        const windowHoleForm = CSG.FromMesh(windowHole);
        buildingForm.subtractInPlace(windowHoleForm);
        windowHole.dispose();
      }
    });

    // inner walls
    const innerWallsData = new VertexData() as VertexFullData;
    innerWallsData.positions = [];
    innerWallsData.indices = [];
    innerWalls.forEach((wall) => {
      const wallMiddleLine = [
        [wall[0].x, 0, wall[0].y],
        [wall[1].x, 0, wall[1].y],
        [wall[1].x, height, wall[1].y],
        [wall[0].x, height, wall[0].y],
      ].map((w) => new Vector3(...w));

      const wallMiddleBaseLine = wallMiddleLine.slice(0, 2);
      const wallMiddleTopLine = wallMiddleLine.slice(2);
      const baseMiddle = wallMiddleBaseLine[1].subtract(wallMiddleBaseLine[0]);
      const topMiddle = wallMiddleTopLine[0].subtract(wallMiddleTopLine[1]);

      const baseThick = getPerpendicular(baseMiddle)
        .normalize()
        .scale(wallThickness / 2);
      const topThick = getPerpendicular(topMiddle)
        .normalize()
        .scale(wallThickness / 2);

      const frontFace = [
        ...wallMiddleBaseLine.map((corner) => corner.add(baseThick)),
        ...wallMiddleTopLine.map((corner) => corner.add(topThick)),
      ];
      const backFace = [
        ...wallMiddleBaseLine.map((corner) => corner.subtract(baseThick)),
        ...wallMiddleTopLine.map((corner) => corner.subtract(topThick)),
      ];
      const wallData = this.renderBox([
        //...test1.map(v => {const arr = []; v.toArray(arr); return arr}),
        //...test.map(v => {const arr = []; v.toArray(arr); return arr})
        ...backFace.map((v) => [v.x, v.y, v.z]),
        ...frontFace.map((v) => [v.x, v.y, v.z]),
      ]);
      const indices = wallData.indices.map(
        (i) => i + innerWallsData.positions?.length / 3
      );
      innerWallsData.positions.push(...wallData.positions);
      innerWallsData.indices.push(...indices);
    });

    innerWallsData.applyToMesh(new Mesh("interior"));

    return buildingForm.toMesh("building");
  }

  private renderBox(vertex: number[][]) {
    const findNeighbours = (v: number[], coords: number[]) =>
      vertex.filter(
        (node) => node !== v && coords.every((i) => node[i] === v[i])
      );

    const positions = vertex.flat();
    const indices: number[] = [];
    vertex.forEach((v, i) => {
      if (indices.includes(i)) {
        return;
      }
      const level = findNeighbours(v, [1]);
      const v2 = findNeighbours(v, [0, 2])[0];

      const remoteCorner = level.find((corner) => {
        const [corner1, corner2] = level.filter(
          (node) => ![v, corner].includes(node)
        );
        return (
          corner[0] === math.add(corner1[0], corner2[0] - v[0]) &&
          corner[2] === math.add(corner1[2], corner2[2] - v[2])
        );
      });

      const [v1, v3] = level.filter(
        (corner) => ![v, remoteCorner].includes(corner)
      );
      indices.push(
        ...[v, v1, v2, v, v1, v3, v, v2, v3].map((node) => vertex.indexOf(node))
      );
    });

    const normals: number[] = [];
    const uvs: number[] = [];

    VertexData.ComputeNormals(positions, indices, normals);
    VertexData._ComputeSides(Mesh.DOUBLESIDE, positions, indices, normals, uvs);
    const vertexData = new VertexData();

    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;

    return vertexData as VertexFullData;
  }

  private getCoordinates(vector: Vector): Vector {
    return {
      x: vector.x / this.fieldSize.width - 0.5,
      y: 0.5 - vector.y / this.fieldSize.height,
      z: vector.z,
    };
  }
}

export type { Mesh } from "@babylonjs/core";
