import { VoxelBuilder, palette as p } from "../voxel/generators";
export function asymmetric() {
  const b = new VoxelBuilder();
  b.box(-6, 5, -3, 12, 10, 7, p.blue).box(-5, 15, -3, 10, 8, 7, p.cream);
  b.box(-4, 17, 4, 8, 4, 1, p.dark)
    .box(-3, 18, 5, 2, 2, 1, p.screen)
    .box(1, 18, 5, 2, 2, 1, p.screen);
  b.box(-4, 7, 4, 6, 5, 1, p.cream).box(-3, 9, 5, 2, 1, 1, p.pot);
  b.box(-5, 1, -2, 3, 4, 4, p.dark)
    .box(2, 1, -2, 3, 4, 4, p.dark)
    .box(-6, 0, -2, 4, 2, 7, p.blue)
    .box(2, 0, -2, 4, 2, 7, p.blue);
  b.box(-9, 7, -2, 3, 7, 4, p.pot)
    .box(6, 8, -2, 3, 6, 4, p.cream)
    .box(7, 6, 0, 3, 2, 4, p.dark);
  b.box(-4, 23, -1, 1, 5, 1, p.dark).box(-5, 27, -2, 3, 2, 3, p.pot);
  b.box(-3, 8, -5, 6, 6, 2, p.dark).box(-2, 9, -6, 4, 4, 1, p.pot);
  for (let y = 10; y <= 12; y += 2) b.box(-1, y, -7, 2, 1, 1, p.cream);
  return b.build("Pip / asymmetric explorer");
}
