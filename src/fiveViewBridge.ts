import type { VoxelObject } from "./voxel/types";
import { writeVoxelTransfer } from "./voxel/modelTransfer";

declare global {
  interface Window {
    voxcelMyRoomBridge?: {
      sendVoxelModel: (model: VoxelObject) => void;
    };
  }
}

window.voxcelMyRoomBridge = {
  sendVoxelModel(model) {
    writeVoxelTransfer(window.localStorage, model);
  },
};

export {};
