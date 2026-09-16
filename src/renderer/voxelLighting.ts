import type { Voxel } from "../voxel/types";
// One lighting sample per voxel: entire blocks change palette bands together.
export function voxelLighting(voxels: Voxel[], azimuth: number): Float32Array {
  const cells = new Set(voxels.map((v) => `${v.x},${v.y},${v.z}`));
  const angle = (azimuth * Math.PI) / 180,
    length = Math.hypot(1, 1.6);
  const light = [
    Math.sin(angle) / length,
    1.6 / length,
    Math.cos(angle) / length,
  ];
  const directions = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];
  return Float32Array.from(
    voxels.map((v) => {
      const normal = [0, 0, 0];
      let exposed = 0;
      for (const d of directions)
        if (!cells.has(`${v.x + d[0]},${v.y + d[1]},${v.z + d[2]}`)) {
          exposed++;
          for (let i = 0; i < 3; i++) normal[i] += d[i];
        }
      const n = Math.hypot(...normal);
      const diffuse = n
        ? Math.max(0, normal.reduce((sum, c, i) => sum + c * light[i], 0) / n)
        : 0.45;
      let occluded = false;
      for (let t = 1.2; t <= 24; t += 0.8) {
        const p = [
          Math.round(v.x + light[0] * t),
          Math.round(v.y + light[1] * t),
          Math.round(v.z + light[2] * t),
        ];
        if (cells.has(p.join(","))) {
          occluded = true;
          break;
        }
      }
      return Math.max(
        0.12,
        (0.28 + 0.72 * diffuse) *
          (occluded ? 0.48 : 1) *
          (exposed < 2 ? 0.87 : 1),
      );
    }),
  );
}
