import type { Voxel, VoxelObject } from "./types";
export class VoxelBuilder {
  private cells = new Map<string, Voxel>();
  box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string,
  ) {
    for (let a = x; a < x + w; a++)
      for (let b = y; b < y + h; b++)
        for (let c = z; c < z + d; c++)
          this.cells.set(`${a},${b},${c}`, { x: a, y: b, z: c, color });
    return this;
  }
  build(name: string): VoxelObject {
    return { name, voxels: [...this.cells.values()] };
  }
}
export const palette = {
  wood: "#bc7856",
  edge: "#e5ae76",
  dark: "#473e53",
  cream: "#f4dfb1",
  screen: "#81dab8",
  blue: "#6189b3",
  leaf: "#71a96b",
  pot: "#cf795e",
};
