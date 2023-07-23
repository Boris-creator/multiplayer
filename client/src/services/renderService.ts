import {
  Scene,
  Engine,
  UniversalCamera,
  HemisphericLight,
  Vector3,
  VertexData,
  MeshBuilder,
  Color3,
  Mesh,
  StandardMaterial,
} from "@babylonjs/core";
import { castTo3DCoordinates, type Rotation } from "@/helpers/geometryHelper";
import { Building } from "@/types/buildings";
import type { Vector } from "@/types";

const meshCellSide = 0.1;

export class RenderService {
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
    // camera.attachControl(canvas, true);

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
  createScene() {
    return new Scene(this.engine);
  }
  addMesh(meshName: string) {
    return MeshBuilder.CreateBox(meshName, {
      width: meshCellSide,
      height: meshCellSide * this.PERSON_HEIGHT,
      depth: meshCellSide,
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
    let w;
    const walls = building.walls.map(wall => {
      const { x, y, z } = castTo3DCoordinates(this.getCoordinates(wall.corner));
      return {
        ...wall,
        corner: new Vector3(x, y, z),
      };
    });

    const ply = walls[0].thick;
    const height = walls[0].height;

    const outerData = [];
    let angle = 0;
    let direction = 0;
    let line = Vector3.Zero();

    walls[1].corner.subtractToRef(walls[0].corner, line);
    const nextLine = Vector3.Zero();
    walls[2].corner.subtractToRef(walls[1].corner, nextLine);
    const nbWalls = walls.length;
    for (w = 0; w <= nbWalls; w++) {
      angle = Math.acos(
        Vector3.Dot(line, nextLine) / (line.length() * nextLine.length())
      );
      direction = Vector3.Cross(nextLine, line).normalize().y;
      const lineNormal = new Vector3(line.z, 0, -1 * line.x).normalize();
      line.normalize();
      outerData[(w + 1) % nbWalls] = walls[(w + 1) % nbWalls].corner
        .add(lineNormal.scale(ply))
        .add(line.scale((direction * ply) / Math.tan(angle / 2)));
      line = nextLine.clone();
      walls[(w + 3) % nbWalls].corner.subtractToRef(
        walls[(w + 2) % nbWalls].corner,
        nextLine
      );
    }

    const positions = [];
    const indices = [];

    for (w = 0; w < nbWalls; w++) {
      positions.push(walls[w].corner.x, walls[w].corner.y, walls[w].corner.z); // inner corners base
    }

    for (w = 0; w < nbWalls; w++) {
      positions.push(outerData[w].x, outerData[w].y, outerData[w].z); // outer corners base
    }

    for (w = 0; w < nbWalls; w++) {
      indices.push(
        w,
        (w + 1) % nbWalls,
        nbWalls + ((w + 1) % nbWalls),
        w,
        nbWalls + ((w + 1) % nbWalls),
        w + nbWalls
      );
    }

    let currentLength = positions.length; // inner and outer top corners
    for (w = 0; w < currentLength / 3; w++) {
      positions.push(positions[3 * w]);
      positions.push(height);
      positions.push(positions[3 * w + 2]);
    }

    currentLength = indices.length;
    for (let i = 0; i < currentLength / 3; i++) {
      indices.push(
        indices[3 * i + 2] + 2 * nbWalls,
        indices[3 * i + 1] + 2 * nbWalls,
        indices[3 * i] + 2 * nbWalls
      );
    }

    for (let w = 0; w < nbWalls; w++) {
      indices.push(
        w,
        w + 2 * nbWalls,
        ((w + 1) % nbWalls) + 2 * nbWalls,
        w,
        ((w + 1) % nbWalls) + 2 * nbWalls,
        (w + 1) % nbWalls
      );
      indices.push(
        ((w + 1) % nbWalls) + 3 * nbWalls,
        w + 3 * nbWalls,
        w + nbWalls,
        ((w + 1) % nbWalls) + nbWalls,
        ((w + 1) % nbWalls) + 3 * nbWalls,
        w + nbWalls
      );
    }

    const normals: number[] = [];
    const uvs: number[] = [];

    VertexData.ComputeNormals(positions, indices, normals);
    VertexData._ComputeSides(Mesh.FRONTSIDE, positions, indices, normals, uvs);

    const customMesh = new Mesh("custom", this.scene);

    const vertexData = new VertexData();

    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;

    vertexData.applyToMesh(customMesh);

    return customMesh;
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
