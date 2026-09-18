import type { VoxelObject } from "./voxel/types";
import {
  createFiveViewModelMessage,
  FIVE_VIEW_MESSAGE_TYPE,
} from "./voxel/fiveViewMessage";
import { writeVoxelTransfer } from "./voxel/modelTransfer";

const embedded =
  new URLSearchParams(window.location.search).get("embed") === "1" &&
  window.parent !== window;

declare global {
  interface Window {
    voxcelMyRoomBridge?: {
      sendVoxelModel: (model: VoxelObject) => "embedded" | "storage";
      embedded?: boolean;
    };
  }
}

window.voxcelMyRoomBridge = {
  embedded,
  sendVoxelModel(model) {
    if (embedded) {
      window.parent.postMessage(
        createFiveViewModelMessage(model),
        window.location.origin,
      );
      return "embedded";
    }
    writeVoxelTransfer(window.localStorage, model);
    return "storage";
  },
};

export { FIVE_VIEW_MESSAGE_TYPE };

export {};
