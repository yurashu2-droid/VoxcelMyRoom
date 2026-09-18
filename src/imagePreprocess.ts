export type RgbaImage = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

export type MaskedImage = {
  image: RgbaImage;
  mask: Uint8Array;
};

/**
 * Downsample a cutout while keeping background pixels out of the color average.
 * The mask becomes coverage; the returned RGB values only come from foreground
 * samples, so white or bright backgrounds cannot bleed into edge pixels.
 */
export function resizeMaskedImage(
  image: RgbaImage,
  mask: Uint8Array,
  maxDimension: number,
): MaskedImage {
  if (
    !Number.isInteger(image.width) ||
    !Number.isInteger(image.height) ||
    image.width < 1 ||
    image.height < 1 ||
    image.data.length !== image.width * image.height * 4 ||
    mask.length !== image.width * image.height ||
    !Number.isFinite(maxDimension) ||
    maxDimension < 1
  ) {
    throw new Error("Invalid masked image");
  }

  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  if (scale === 1) return { image, mask };

  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const data = new Uint8ClampedArray(width * height * 4);
  const resizedMask = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    const sy0 = Math.floor(y / scale);
    const sy1 = Math.min(
      image.height,
      Math.max(sy0 + 1, Math.ceil((y + 1) / scale)),
    );
    for (let x = 0; x < width; x += 1) {
      const sx0 = Math.floor(x / scale);
      const sx1 = Math.min(
        image.width,
        Math.max(sx0 + 1, Math.ceil((x + 1) / scale)),
      );
      const area = (sx1 - sx0) * (sy1 - sy0);
      let coverage = 0;
      let red = 0;
      let green = 0;
      let blue = 0;

      for (let sy = sy0; sy < sy1; sy += 1) {
        for (let sx = sx0; sx < sx1; sx += 1) {
          const sourceIndex = sy * image.width + sx;
          const alpha = Math.min(
            mask[sourceIndex] / 255,
            image.data[sourceIndex * 4 + 3] / 255,
          );
          if (alpha <= 0) continue;
          coverage += alpha;
          red += image.data[sourceIndex * 4] * alpha;
          green += image.data[sourceIndex * 4 + 1] * alpha;
          blue += image.data[sourceIndex * 4 + 2] * alpha;
        }
      }

      const outputIndex = y * width + x;
      const outputByte = outputIndex * 4;
      if (coverage > 0) {
        data[outputByte] = Math.round(red / coverage);
        data[outputByte + 1] = Math.round(green / coverage);
        data[outputByte + 2] = Math.round(blue / coverage);
        data[outputByte + 3] = 255;
        resizedMask[outputIndex] = Math.round(
          Math.min(1, coverage / area) * 255,
        );
      }
    }
  }

  return { image: { width, height, data }, mask: resizedMask };
}
