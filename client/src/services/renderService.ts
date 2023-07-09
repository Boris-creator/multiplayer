import {
  Scene,
  Engine,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  MeshBuilder,
  Color3,
  type Mesh,
  StandardMaterial,
} from "@babylonjs/core";

const meshCellSide = 0.1;

export class RenderService {
  private scene: Scene;
  private engine: Engine;
  private camera: ArcRotateCamera;

  constructor(
    private canvas: HTMLCanvasElement,
    private fieldSize: { width: number; height: number }
  ) {
    this.engine = new Engine(this.canvas, true);
    this.scene = this.createScene();
    this.camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 2.5,
      3,
      new Vector3(0, 0, 0),
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
  static addMesh(meshName: string) {
    return MeshBuilder.CreateBox(meshName, {
      width: meshCellSide,
      height: meshCellSide,
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
    const { x, y } = position;
    const fieldCoordinates = {
      x: x / this.fieldSize.width - 0.5,
      y: 0.5 - y / this.fieldSize.height,
    };
    mesh.position = new Vector3(
      fieldCoordinates.x,
      meshCellSide / 2,
      fieldCoordinates.y
    );
  }

  attachCameraTo(mesh: Mesh) {
    if (this.camera.parent !== mesh) {
      this.camera.parent = mesh;
    }
  }
}

export type { Mesh } from "@babylonjs/core";
