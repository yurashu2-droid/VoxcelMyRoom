import type { VoxelObject } from "./types";

export const FIVE_VIEW_MESSAGE_TYPE = "voxcel-five-view-model";

export type FiveViewModelMessage = {
  type: typeof FIVE_VIEW_MESSAGE_TYPE;
  model: VoxelObject;
};

export function createFiveViewModelMessage(
  model: VoxelObject,
): FiveViewModelMessage {
  return { type: FIVE_VIEW_MESSAGE_TYPE, model };
}

export function isFiveViewModelMessage(
  value: unknown,
): value is FiveViewModelMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as { type?: unknown; model?: unknown };
  if (message.type !== FIVE_VIEW_MESSAGE_TYPE) return false;
  if (!message.model || typeof message.model !== "object") return false;
  const model = message.model as { name?: unknown; voxels?: unknown };
  return typeof model.name === "string" && Array.isArray(model.voxels);
}
