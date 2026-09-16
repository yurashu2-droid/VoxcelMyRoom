import { VoxelBuilder, palette as p } from "../voxel/generators";
export function room() {
  const b = new VoxelBuilder();
  b.box(-15, 0, -13, 30, 1, 26, p.wood);
  for (let x = -15; x < 15; x += 5) b.box(x, 1, -13, 1, 1, 26, p.edge);
  b.box(-15, 1, -13, 30, 17, 1, "#91aaac").box(
    -15,
    1,
    -13,
    1,
    17,
    26,
    "#b4c6ba",
  );
  b.box(-14, 2, -12, 28, 1, 1, p.cream).box(-14, 2, -12, 1, 1, 24, p.cream);
  b.box(-8, 8, -12, 10, 8, 1, p.cream)
    .box(-7, 9, -11, 8, 6, 1, p.blue)
    .box(-3, 9, -10, 1, 6, 1, p.cream)
    .box(-7, 12, -10, 8, 1, 1, p.cream);
  b.box(-12, 2, 0, 10, 3, 11, p.dark)
    .box(-12, 5, 0, 10, 2, 11, p.cream)
    .box(-12, 7, 4, 10, 1, 7, p.blue)
    .box(-11, 7, 1, 8, 1, 2, "#fff0cb");
  b.box(2, 7, -10, 10, 2, 6, p.edge)
    .box(2, 2, -10, 2, 5, 5, p.wood)
    .box(10, 2, -10, 2, 5, 5, p.wood);
  b.box(5, 9, -9, 2, 2, 2, p.dark)
    .box(3, 11, -10, 7, 5, 1, p.dark)
    .box(4, 12, -9, 5, 3, 1, p.screen);
  b.box(4, 9, -6, 5, 1, 1, p.cream);
  b.box(10, 2, 2, 4, 11, 8, p.wood);
  for (const y of [4, 8, 12]) {
    b.box(9, y, 2, 1, 2, 7, p.dark);
    for (let z = 3; z < 8; z++)
      b.box(9, y, z, 1, 2, 1, [p.cream, p.blue, p.pot][z % 3]);
  }
  b.box(3, 2, 6, 4, 4, 4, p.pot)
    .box(4, 6, 7, 1, 7, 1, p.dark)
    .box(1, 9, 5, 6, 3, 5, p.leaf)
    .box(3, 12, 6, 3, 2, 3, "#a5c579");
  return b.build("A room in 30 × 26");
}
