import * as T from "three";
import { compositeFragment } from "./PixelShader";
export class PixelRenderPipeline {
  readonly renderer = new T.WebGLRenderer({
    antialias: false,
    alpha: false,
    preserveDrawingBuffer: true,
  });
  readonly target = new T.WebGLRenderTarget(128, 128, {
    minFilter: T.NearestFilter,
    magFilter: T.NearestFilter,
    depthBuffer: true,
  });
  private scene = new T.Scene();
  private camera = new T.Camera();
  readonly material = new T.ShaderMaterial({
    uniforms: {
      source: { value: this.target.texture },
      texel: { value: new T.Vector2(1 / 128, 1 / 128) },
      background: { value: new T.Vector3(0.85, 0.87, 0.82) },
      outline: { value: true },
      shadowStyle: { value: 2 },
      shadowDotSize: { value: 2 },
      shadowStrength: { value: 0.65 },
      gridStyle: { value: 0 },
      gridCell: { value: 2 },
      gridGap: { value: 1 },
      gridStrength: { value: 0.8 },
      gridColor: { value: new T.Vector3(0.85, 0.87, 0.82) },
    },
    vertexShader:
      "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
    fragmentShader: compositeFragment,
    depthTest: false,
    depthWrite: false,
  });
  constructor(host: HTMLElement) {
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0, 0);
    host.append(this.renderer.domElement);
    this.scene.add(new T.Mesh(new T.PlaneGeometry(2, 2), this.material));
  }
  resize(size: number, outputScale = 1) {
    this.renderer.setSize(size * outputScale, size * outputScale, false);
    this.target.setSize(size, size);
    this.material.uniforms.texel.value.set(1 / size, 1 / size);
  }
  render(scene: T.Scene, camera: T.Camera) {
    this.renderer.setRenderTarget(this.target);
    this.renderer.clear();
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);
  }
  exportPNG(scale: number) {
    const source = this.renderer.domElement;
    const canvas = document.createElement("canvas");
    canvas.width = source.width * scale;
    canvas.height = source.height * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `voxel-pixel-${canvas.width}px.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }
}
