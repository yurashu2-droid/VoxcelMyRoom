import { VoxelBuilder, palette as p } from "../voxel/generators";
export function desk() {
  const b = new VoxelBuilder();
  b.box(-9, 9, -5, 19, 2, 11, p.wood).box(-9, 10, -5, 19, 1, 11, p.edge);
  for (const x of [-8, 7])
    for (const z of [-4, 3]) b.box(x, 0, z, 2, 9, 2, p.dark);
  b.box(-5, 11, -3, 9, 1, 3, p.dark).box(-2, 12, -3, 2, 2, 2, p.dark);
  b.box(-6, 14, -4, 11, 7, 2, p.dark).box(-5, 15, -2, 9, 5, 1, p.screen);
  b.box(-4, 18, -1, 4, 1, 1, p.cream).box(-4, 16, -1, 6, 1, 1, "#438d87");
  b.box(-5, 11, 2, 9, 1, 3, p.cream).box(-4, 12, 2, 7, 1, 1, p.blue);
  b.box(6, 11, 1, 3, 3, 3, p.pot)
    .box(7, 14, 2, 1, 4, 1, p.leaf)
    .box(5, 15, 2, 2, 2, 1, p.leaf)
    .box(8, 16, 2, 2, 2, 1, p.leaf);
  b.box(-8, 5, 3, 6, 1, 5, p.blue).box(-8, 6, 7, 6, 5, 1, p.blue);
  for (const x of [-8, -3])
    for (const z of [3, 7]) b.box(x, 0, z, 1, 5, 1, p.dark);
  return b.build("The midnight desk");
}
