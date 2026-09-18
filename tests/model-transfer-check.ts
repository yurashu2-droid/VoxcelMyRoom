import {
  decodeVoxelTransfer,
  encodeVoxelTransfer,
  readVoxelTransfer,
  writeVoxelTransfer,
} from "../src/voxel/modelTransfer";
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

output.textContent = lines.join("\n");
output.className = lines.every((line) => line.startsWith("PASS"))
  ? "pass"
  : "fail";
