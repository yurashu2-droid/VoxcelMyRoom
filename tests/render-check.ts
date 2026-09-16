import { VoxelRenderer, type Settings } from "../src/renderer/VoxelRenderer";
import { desk } from "../src/scenes/desk";
const settings: Settings = {
  mode: 3,
  resolution: 128,
  voxelSize: 1,
  pitch: 22.5,
  yaw: 45,
  zoom: 1,
  zoomMode: "pixel",
  rotationStep: 22.5,
  light: 315,
  levels: 4,
  outline: true,
  shadow: true,
  background: "#d8ddcd",
  stabilize: true,
  gridStyle: 0,
  gridCell: 2,
  gridGap: 1,
  gridStrength: 0.85,
  gridColor: "#d8ddcd",
  blockLighting: false,
  shadowStyle: 2,
  shadowStrength: 0.65,
  shadowDotSize: 2,
};
const lines: string[] = [];
try {
  const renderer = new VoxelRenderer(
    document.querySelector<HTMLElement>("#host")!,
    settings,
  );
  renderer.setModel(desk());
  const capture = () => {
    renderer.render();
    return renderer.pipeline.renderer.domElement.toDataURL();
  };
  const assert = (name: string, success: boolean) => {
    lines.push(`${success ? "PASS" : "FAIL"}: ${name}`);
  };
  const original = capture();
  const originalWidth = renderer.pipeline.renderer.domElement.style.width;
  settings.zoom = 3;
  assert(
    "Pixel zoom keeps every source pixel unchanged",
    capture() === original,
  );
  assert(
    "Pixel zoom increases presentation size",
    parseInt(renderer.pipeline.renderer.domElement.style.width) >
      parseInt(originalWidth),
  );
  settings.yaw = 49;
  settings.pitch = 26;
  assert(
    "Small diagonal movement holds the exact same sprite",
    capture() === original,
  );
  settings.yaw = 67.5;
  assert(
    "Crossing a direction threshold changes the sprite",
    capture() !== original,
  );
  settings.yaw = 45;
  settings.pitch = 45;
  assert("Vertical direction changes the sprite", capture() !== original);
  settings.yaw = 405;
  settings.pitch = 22.5;
  assert(
    "Full 360-degree rotation returns the exact sprite",
    capture() === original,
  );
  settings.rotationStep = 0;
  settings.yaw = 49;
  assert(
    "Free rotation still renders intermediate angles",
    capture() !== original,
  );
  settings.rotationStep = 22.5;
  settings.yaw = 45;
  settings.zoomMode = "camera";
  settings.zoom = 1.2;
  const cameraBase = capture();
  settings.zoom = 2;
  assert("Comparison camera zoom changes raster", capture() !== cameraBase);
  settings.zoomMode = "pixel";
  settings.zoom = 1;
  settings.gridStyle = 1;
  settings.gridColor = "#ff00ff";
  settings.gridStrength = 1;
  settings.voxelSize = 0.75;
  renderer.rebuild();
  const gridBase = capture();
  assert(
    "Grid export retains four crisp subpixels per source pixel",
    renderer.pipeline.renderer.domElement.width === settings.resolution * 4,
  );
  settings.zoom = 3;
  assert(
    "Grid zoom also preserves the complete source sprite",
    capture() === gridBase,
  );
  settings.voxelSize = 1;
  renderer.rebuild();
  assert("Screen grid closes geometric voxel gaps", capture() === gridBase);
  const phaseCheck = () => {
    capture();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = settings.resolution * 4;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(renderer.pipeline.renderer.domElement, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0,
      invalid = 0;
    for (let y = 0; y < canvas.height; y++)
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        if (pixels[i] === 255 && pixels[i + 1] === 0 && pixels[i + 2] === 255) {
          count++;
          if (!(x % 8 < 1 || (canvas.height - 1 - y) % 8 < 1)) invalid++;
        }
      }
    return count > 0 && invalid === 0;
  };
  settings.yaw = 0;
  assert("Front grid lines lie exactly on the screen lattice", phaseCheck());
  settings.yaw = 45;
  assert(
    "Diagonal grid lines retain the identical lattice phase",
    phaseCheck(),
  );
  const squares = capture();
  settings.gridStyle = 2;
  assert("Stitch variant produces a different pattern", capture() !== squares);
  settings.gridStyle = 3;
  settings.shadow = false;
  settings.pitch = 0;
  settings.yaw = 0;
  settings.zoom = 1;
  renderer.setModel({
    name: "Two depth-separated voxels",
    voxels: [
      { x: 0, y: 0, z: 3, color: "#ff0000" },
      { x: 0, y: 0, z: -3, color: "#0000ff" },
    ],
  });
  const blockColors = () => {
    capture();
    const c = document.createElement("canvas");
    c.width = c.height = settings.resolution;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(renderer.pipeline.renderer.domElement, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let red = 0,
      blue = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === 255 && data[i + 1] === 0 && data[i + 2] === 0) red++;
      if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 255) blue++;
    }
    return { red, blue };
  };
  const front = blockColors();
  assert(
    "Independent voxel squares use the front voxel color, not a screen overlay",
    front.red > 0 && front.blue === 0,
  );
  settings.yaw = 180;
  const back = blockColors();
  assert(
    "Turning around reveals the other voxel by depth",
    back.blue > 0 && back.red === 0,
  );
  const blocksBeforeZoom = capture();
  settings.zoom = 3;
  assert(
    "Independent voxel square zoom preserves every source pixel",
    capture() === blocksBeforeZoom,
  );
  renderer.setModel(desk());
  settings.pitch = 22.5;
  settings.yaw = 45;
  settings.zoom = 1;
  settings.shadow = true;
  settings.blockLighting = false;
  const unlit = capture();
  settings.blockLighting = true;
  const lit = capture();
  assert("Palette lighting shades whole voxel squares", unlit !== lit);
  settings.light = 135;
  assert("Changing light direction updates voxel shading", capture() !== lit);
  settings.shadowStyle = 0;
  const flatShadow = capture();
  settings.shadowStyle = 1;
  const stepped = capture();
  settings.shadowStyle = 2;
  const stippled = capture();
  assert(
    "Flat, stepped and stippled floor shadows are distinct",
    flatShadow !== stepped && stepped !== stippled,
  );
  assert("Stippled shadows do not animate at rest", capture() === stippled);
  settings.zoom = 3;
  assert(
    "Shading and stippled shadow pixels survive display zoom unchanged",
    capture() === stippled,
  );
  settings.shadow = false;
  assert("Shadow toggle removes floor shadows", capture() !== stippled);
  document.querySelector("#results")!.textContent = lines.join("\n");
} catch (error) {
  document.querySelector("#results")!.textContent =
    `${lines.join("\n")}\nERROR: ${error}`;
}
