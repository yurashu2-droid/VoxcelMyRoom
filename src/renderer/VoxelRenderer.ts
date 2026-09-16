import * as T from "three";
import type { VoxelObject } from "../voxel/types";
import { voxelVertex, voxelFragment } from "./PixelShader";
import { PixelRenderPipeline } from "./PixelRenderPipeline";
import { viewAngles } from "./viewSettings";
import { voxelLighting } from "./voxelLighting";
export type Settings = {
  mode: number;
  resolution: number;
  voxelSize: number;
  pitch: number;
  yaw: number;
  zoom: number;
  zoomMode: "pixel" | "camera";
  rotationStep: number;
  light: number;
  levels: number;
  outline: boolean;
  shadow: boolean;
  background: string;
  stabilize: boolean;
  gridStyle: number;
  gridCell: number;
  gridGap: number;
  gridStrength: number;
  gridColor: string;
  blockLighting: boolean;
  shadowStyle: number;
  shadowStrength: number;
  shadowDotSize: number;
};
const rgb = (hex: string) =>
  new T.Vector3(
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  );
export class VoxelRenderer {
  readonly pipeline: PixelRenderPipeline;
  readonly scene = new T.Scene();
  readonly camera = new T.OrthographicCamera(-20, 20, 20, -20, 0.1, 400);
  private standardMaterial = new T.MeshLambertMaterial({
    vertexColors: true,
    toneMapped: false,
  });
  // Compensate Lambert's 1/PI so baseline uses the same 0.3 + 0.7*N·L range.
  private light = new T.DirectionalLight(0xffffff, 0.7 * Math.PI);
  private material = new T.ShaderMaterial({
    vertexColors: true,
    vertexShader: voxelVertex,
    fragmentShader: voxelFragment,
    uniforms: {
      lightDirection: { value: new T.Vector3(-1, 2, 1) },
      levels: { value: 4 },
      pixelArt: { value: true },
    },
  });
  // Store coverage in alpha without blending overlapping projected triangles.
  private shadowMaterial = new T.ShaderMaterial({
    transparent: false,
    depthWrite: true,
    side: T.DoubleSide,
    uniforms: {
      lightDirection: { value: new T.Vector3(-1, 2, 1) },
      shadowColor: { value: new T.Vector3() },
      contactOnly: { value: false },
    },
    vertexShader:
      "uniform vec3 lightDirection;varying float height;void main(){vec3 p=position;height=p.y; p.xz-=lightDirection.xz/lightDirection.y*max(p.y,0.);p.y=-.55;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}",
    fragmentShader:
      "uniform vec3 shadowColor;uniform bool contactOnly;varying float height;void main(){if(contactOnly&&height>2.)discard;gl_FragColor=vec4(shadowColor,contactOnly?.7:.38);}",
  });
  private mesh?: T.Mesh;
  private blocks?: T.Points;
  private blockMaterial = new T.ShaderMaterial({
    vertexColors: true,
    uniforms: {
      rasterSize: { value: 128 },
      cellSize: { value: 3 },
      fillSize: { value: 2 },
      shaded: { value: true },
      levels: { value: 4 },
    },
    vertexShader: `uniform float rasterSize;uniform float cellSize;varying vec3 tint;
      attribute float illumination;uniform bool shaded;uniform float levels;
      void main(){float band=floor(clamp(illumination,0.,1.)*(levels-.001))/(levels-1.);
      tint=shaded?mix(color*.42+vec3(.055,.025,.085),color,band):color;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);
      vec2 pixel=(p.xy/p.w*.5+.5)*rasterSize;
      pixel=floor(pixel/cellSize)*cellSize+cellSize*.5;
      p.xy=(pixel/rasterSize*2.-1.)*p.w;gl_Position=p;gl_PointSize=cellSize;}`,
    fragmentShader: `uniform float cellSize;uniform float fillSize;varying vec3 tint;
      void main(){vec2 p=floor(gl_PointCoord*cellSize);
      if(p.x>=fillSize || p.y>=fillSize)discard;
      gl_FragColor=vec4(tint,1.);}`,
  });
  private shadow?: T.Mesh;
  private contact?: T.Mesh;
  private contactMaterial = this.shadowMaterial.clone();
  private lightingKey = "";
  private model?: VoxelObject;
  private radius = 20;
  private center = new T.Vector3();
  private size = 0;
  private outputScale = 1;
  constructor(
    private host: HTMLElement,
    readonly settings: Settings,
  ) {
    this.pipeline = new PixelRenderPipeline(host);
    this.scene.add(new T.AmbientLight(0xffffff, 0.3 * Math.PI), this.light);
  }
  setModel(model: VoxelObject) {
    this.model = model;
    this.rebuild();
  }
  rebuild() {
    if (!this.model) return;
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
    }
    if (this.shadow) this.scene.remove(this.shadow);
    if (this.contact) this.scene.remove(this.contact);
    this.lightingKey = "";
    if (this.blocks) {
      this.scene.remove(this.blocks);
      this.blocks.geometry.dispose();
    }
    const voxels = this.model.voxels;
    const occupied = new Set(voxels.map((v) => `${v.x},${v.y},${v.z}`));
    const edge = this.settings.gridStyle ? 1 : this.settings.voxelSize;
    const box = new T.BoxGeometry(edge, edge, edge).toNonIndexed();
    const source = box.attributes.position,
      normal = box.attributes.normal;
    const positions: number[] = [],
      normals: number[] = [],
      colors: number[] = [];
    const dirs = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ];
    const bounds = new T.Box3();
    voxels.forEach((v) => bounds.expandByPoint(new T.Vector3(v.x, v.y, v.z)));
    const midpoint = bounds.getCenter(new T.Vector3());
    const blockPositions: number[] = [],
      blockColors: number[] = [];
    for (const v of voxels) {
      blockPositions.push(
        v.x - midpoint.x,
        v.y - bounds.min.y,
        v.z - midpoint.z,
      );
      const c = rgb(v.color);
      blockColors.push(c.x, c.y, c.z);
    }
    const blockGeometry = new T.BufferGeometry();
    blockGeometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(blockPositions, 3),
    );
    blockGeometry.setAttribute(
      "color",
      new T.Float32BufferAttribute(blockColors, 3),
    );
    blockGeometry.setAttribute(
      "illumination",
      new T.BufferAttribute(voxelLighting(voxels, this.settings.light), 1),
    );
    this.blocks = new T.Points(blockGeometry, this.blockMaterial);
    this.blocks.frustumCulled = false;
    this.scene.add(this.blocks);
    for (const v of voxels) {
      const color = rgb(v.color);
      for (let face = 0; face < 6; face++) {
        const d = dirs[face];
        if (
          edge === 1 &&
          occupied.has(`${v.x + d[0]},${v.y + d[1]},${v.z + d[2]}`)
        )
          continue;
        for (let k = face * 6; k < face * 6 + 6; k++) {
          positions.push(
            source.getX(k) + v.x - midpoint.x,
            source.getY(k) + v.y - bounds.min.y,
            source.getZ(k) + v.z - midpoint.z,
          );
          normals.push(normal.getX(k), normal.getY(k), normal.getZ(k));
          colors.push(color.x, color.y, color.z);
        }
      }
    }
    box.dispose();
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    geo.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
    geo.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
    this.mesh = new T.Mesh(geo, this.material);
    this.scene.add(this.mesh);
    this.shadow = new T.Mesh(geo, this.shadowMaterial);
    this.shadow.renderOrder = -1;
    this.scene.add(this.shadow);
    this.contact = new T.Mesh(geo, this.contactMaterial);
    this.contact.renderOrder = -0.5;
    this.contactMaterial.uniforms.contactOnly.value = true;
    this.scene.add(this.contact);
    const dims = bounds.getSize(new T.Vector3()).addScalar(1);
    this.radius = Math.max(dims.length() * 0.57, 8);
    this.center.set(0, dims.y * 0.46, 0);
  }
  render() {
    const s = this.settings;
    const available = Math.max(
      64,
      Math.min(this.host.clientWidth, this.host.clientHeight) - 32,
    );
    const size =
      s.mode === 1
        ? Math.max(1, Math.floor(available / s.resolution)) * s.resolution
        : s.resolution;
    const overlay = s.gridStyle === 1 || s.gridStyle === 2;
    const outputScale = overlay ? 4 : 1;
    if (size !== this.size || outputScale !== this.outputScale) {
      this.pipeline.resize(size, outputScale);
      this.size = size;
      this.outputScale = outputScale;
    }
    const fitScale =
      s.mode === 1 ? 1 : Math.max(1, Math.floor(available / size));
    const requestedDisplay =
      size *
      (s.zoomMode === "pixel"
        ? Math.max(1, Math.round(fitScale * s.zoom))
        : fitScale);
    const display = overlay
      ? size * 4 * Math.max(1, Math.round(requestedDisplay / (size * 4)))
      : requestedDisplay;
    const canvas = this.pipeline.renderer.domElement;
    canvas.style.width = `${display}px`;
    canvas.style.height = `${display}px`;
    const angles = viewAngles(s.yaw, s.pitch, s.rotationStep);
    const yaw = T.MathUtils.degToRad(
        s.stabilize && !s.rotationStep
          ? Math.round(angles.yaw * 10) / 10
          : angles.yaw,
      ),
      pitch = T.MathUtils.degToRad(angles.pitch);
    this.camera.position.set(
      Math.sin(yaw) * Math.cos(pitch) * 100 + this.center.x,
      Math.sin(pitch) * 100 + this.center.y,
      Math.cos(yaw) * Math.cos(pitch) * 100 + this.center.z,
    );
    this.camera.lookAt(this.center);
    // Pixel zoom changes only presentation, never projection or the source raster.
    const half = this.radius / (s.zoomMode === "pixel" ? 1.2 : s.zoom);
    const cell = Math.max(2, Math.round(size / (half * 2)));
    this.blockMaterial.uniforms.rasterSize.value = size;
    this.blockMaterial.uniforms.cellSize.value = cell;
    this.blockMaterial.uniforms.fillSize.value = Math.max(
      1,
      Math.min(cell - 1, Math.round(cell * s.voxelSize)),
    );
    if (this.blocks) this.blocks.visible = s.gridStyle === 3;
    if (this.mesh) this.mesh.visible = s.gridStyle !== 3;
    Object.assign(this.camera, {
      left: -half,
      right: half,
      top: half,
      bottom: -half,
    });
    this.camera.updateMatrixWorld();
    this.camera.updateProjectionMatrix();
    if (s.stabilize && s.mode !== 1) {
      const projected = new T.Vector3(0, 0, 0).project(this.camera);
      this.camera.projectionMatrix.elements[12] +=
        (Math.round((projected.x * 0.5 + 0.5) * size) / size - 0.5) * 2 -
        projected.x;
      this.camera.projectionMatrix.elements[13] +=
        (Math.round((projected.y * 0.5 + 0.5) * size) / size - 0.5) * 2 -
        projected.y;
      this.camera.projectionMatrixInverse
        .copy(this.camera.projectionMatrix)
        .invert();
    }
    const lightAngle = T.MathUtils.degToRad(s.light);
    this.blockMaterial.uniforms.shaded.value = s.blockLighting;
    this.blockMaterial.uniforms.levels.value = s.levels;
    if (this.blocks && this.model && this.lightingKey !== String(s.light)) {
      this.blocks.geometry.setAttribute(
        "illumination",
        new T.BufferAttribute(voxelLighting(this.model.voxels, s.light), 1),
      );
      this.lightingKey = String(s.light);
    }
    const light = new T.Vector3(
      Math.sin(lightAngle),
      1.6,
      Math.cos(lightAngle),
    );
    this.light.position.copy(light);
    if (this.mesh)
      this.mesh.material = s.mode === 3 ? this.material : this.standardMaterial;
    this.material.uniforms.lightDirection.value.copy(light);
    this.material.uniforms.levels.value = s.levels;
    this.material.uniforms.pixelArt.value = s.mode === 3;
    this.shadowMaterial.uniforms.lightDirection.value.copy(light);
    this.shadowMaterial.uniforms.shadowColor.value.copy(
      rgb(s.background).multiplyScalar(0.54),
    );
    // The floor receives shadows on its upper side only.
    if (this.shadow) this.shadow.visible = s.shadow && angles.pitch > 0;
    this.contactMaterial.uniforms.lightDirection.value.copy(light);
    this.contactMaterial.uniforms.shadowColor.value.copy(
      this.shadowMaterial.uniforms.shadowColor.value,
    );
    if (this.contact)
      this.contact.visible = s.shadow && angles.pitch > 0 && s.shadowStyle > 0;
    this.pipeline.material.uniforms.background.value.copy(rgb(s.background));
    this.pipeline.material.uniforms.outline.value =
      s.outline && s.gridStyle !== 3;
    const u = this.pipeline.material.uniforms;
    u.gridStyle.value = overlay ? s.gridStyle : 0;
    u.gridCell.value = s.gridCell;
    u.gridGap.value = s.gridGap;
    u.gridStrength.value = s.gridStrength;
    u.gridColor.value.copy(rgb(s.gridColor));
    u.shadowStyle.value = s.shadowStyle;
    u.shadowStrength.value = s.shadowStrength;
    u.shadowDotSize.value = s.shadowDotSize;
    this.pipeline.render(this.scene, this.camera);
  }
  get voxelCount() {
    return this.model?.voxels.length ?? 0;
  }
  get renderSize() {
    return this.size;
  }
}
