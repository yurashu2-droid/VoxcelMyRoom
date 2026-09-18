import {
  decodeVoxelTransfer,
  encodeVoxelTransfer,
  readVoxelTransfer,
  writeVoxelTransfer,
} from "../src/voxel/modelTransfer";
import {
  createFiveViewModelMessage,
  FIVE_VIEW_MESSAGE_TYPE,
  isFiveViewModelMessage,
} from "../src/voxel/fiveViewMessage";
import { fitSourceToSquare } from "../src/fiveViewAspect";
import { resizeMaskedImage } from "../src/imagePreprocess";
import type { VoxelObject } from "../src/voxel/types";

const output = document.querySelector<HTMLPreElement>("#output")!;
const lines: string[] = [];
const assert = (name: string, condition: boolean) => {
  lines.push(`${condition ? "PASS" : "FAIL"}: ${name}`);
};

const model: VoxelObject = {
  name: "five-view sample",
  voxels: [
    { x: 0, y: 0, z: 0, color: "#27382b" },
    { x: 1, y: 0, z: 0, color: "#d97949" },
  ],
};

const encoded = encodeVoxelTransfer(model);
assert(
  "A voxel model survives encode/decode",
  JSON.stringify(decodeVoxelTransfer(encoded)) === JSON.stringify(model),
);

const storage = new Map<string, string>();
const memoryStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
};
writeVoxelTransfer(memoryStorage, model);
assert(
  "The storage bridge returns the latest model",
  JSON.stringify(readVoxelTransfer(memoryStorage)) === JSON.stringify(model),
);

assert(
  "Malformed or unsafe payloads are rejected",
  decodeVoxelTransfer(
    JSON.stringify({
      version: 1,
      model: { name: "bad", voxels: [{ x: 0, y: 0, z: 0, color: "red" }] },
    }),
  ) === null,
);

const message = createFiveViewModelMessage(model);
assert(
  "The embedded five-view message keeps its model",
  message.type === FIVE_VIEW_MESSAGE_TYPE &&
    isFiveViewModelMessage(message) &&
    JSON.stringify(message.model) === JSON.stringify(model),
);
assert(
  "Messages from another shape are rejected",
  !isFiveViewModelMessage({ type: FIVE_VIEW_MESSAGE_TYPE, model: null }),
);

const wideFit = fitSourceToSquare(400, 200, 256);
const tallFit = fitSourceToSquare(200, 400, 256);
assert(
  "Wide source images keep their aspect ratio",
  wideFit.width === 256 && wideFit.height === 128,
);
assert(
  "Tall source images keep their aspect ratio",
  tallFit.width === 128 && tallFit.height === 256,
);

const edgeImage = {
  width: 4,
  height: 1,
  data: new Uint8ClampedArray([
    0, 0, 0, 255,
    255, 255, 255, 255,
    255, 255, 255, 255,
    0, 0, 0, 255,
  ]),
};
const edgeMask = new Uint8Array([255, 0, 0, 255]);
const edgeResize = resizeMaskedImage(edgeImage, edgeMask, 2);
assert(
  "Masked downsampling does not average white background into edges",
  edgeResize.image.data[0] < 10 &&
    edgeResize.image.data[1] < 10 &&
    edgeResize.image.data[2] < 10 &&
    edgeResize.image.data[4] < 10 &&
    edgeResize.image.data[5] < 10 &&
    edgeResize.image.data[6] < 10,
);

output.textContent = lines.join("\n");
output.className = lines.every((line) => line.startsWith("PASS"))
  ? "pass"
  : "fail";
