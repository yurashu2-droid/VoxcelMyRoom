import type { VoxelObject } from "./types";

export const VOXEL_TRANSFER_KEY = "voxcel-my-room:pending-voxel-v1";
const MAX_VOXELS = 60_000;
const COLOR = /^#[\da-f]{6}$/i;

export type VoxelTransferStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

function isDimensions(value: unknown): value is [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((entry) => Number.isSafeInteger(entry) && entry > 0)
  );
}

function isVoxelModel(value: unknown): value is VoxelObject {
  if (!value || typeof value !== "object") return false;
  const model = value as {
    name?: unknown;
    voxels?: unknown;
    meta?: { dimensions?: unknown };
  };
  if (
    typeof model.name !== "string" ||
    model.name.trim().length === 0 ||
    !Array.isArray(model.voxels) ||
    model.voxels.length === 0 ||
    model.voxels.length > MAX_VOXELS
  )
    return false;
  if (
    model.meta?.dimensions !== undefined &&
    !isDimensions(model.meta.dimensions)
  )
    return false;
  return model.voxels.every((voxel) => {
    if (!voxel || typeof voxel !== "object") return false;
    const item = voxel as Record<string, unknown>;
    return (
      Number.isSafeInteger(item.x) &&
      Number.isSafeInteger(item.y) &&
      Number.isSafeInteger(item.z) &&
      Number(item.x) >= 0 &&
      Number(item.y) >= 0 &&
      Number(item.z) >= 0 &&
      typeof item.color === "string" &&
      COLOR.test(item.color)
    );
  });
}

export function encodeVoxelTransfer(model: VoxelObject): string {
  if (!isVoxelModel(model)) throw new Error("Invalid voxel model");
  return JSON.stringify({ version: 1, model });
}

export function decodeVoxelTransfer(raw: string | null): VoxelObject | null {
  if (!raw) return null;
  try {
    const payload = JSON.parse(raw) as { version?: unknown; model?: unknown };
    return payload.version === 1 && isVoxelModel(payload.model)
      ? payload.model
      : null;
  } catch {
    return null;
  }
}

export function writeVoxelTransfer(
  storage: VoxelTransferStorage,
  model: VoxelObject,
): void {
  storage.setItem(VOXEL_TRANSFER_KEY, encodeVoxelTransfer(model));
}

export function readVoxelTransfer(
  storage: VoxelTransferStorage,
): VoxelObject | null {
  return decodeVoxelTransfer(storage.getItem(VOXEL_TRANSFER_KEY));
}

export function clearVoxelTransfer(storage: VoxelTransferStorage): void {
  storage.removeItem(VOXEL_TRANSFER_KEY);
}
