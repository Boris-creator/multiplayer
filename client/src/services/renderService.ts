import {
  Scene,
  Engine,
  UniversalCamera,
  HemisphericLight,
  Vector3,
  MeshBuilder,
  Color3,
  type Mesh,
  StandardMaterial,
} from "@babylonjs/core";
import { type Rotation } from "@/helpers/geometryHelper";

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
    const { x, y } = position;
    const fieldCoordinates = {
      x: x / this.fieldSize.width - 0.5,
      y: 0.5 - y / this.fieldSize.height,
    };
    mesh.position = new Vector3(
      fieldCoordinates.x,
      (meshCellSide * this.PERSON_HEIGHT) / 2,
      fieldCoordinates.y
    );
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
}

export type { Mesh } from "@babylonjs/core";
