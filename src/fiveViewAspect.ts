export type FittedSourceRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function fitSourceToSquare(
  sourceWidth: number,
  sourceHeight: number,
  square: number,
  scale = 1,
  aspect = 1,
): FittedSourceRect {
  if (
    !Number.isFinite(sourceWidth) ||
    !Number.isFinite(sourceHeight) ||
    !Number.isFinite(square) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    square <= 0
  ) {
    throw new Error("Source dimensions must be positive numbers");
  }
  const fit = Math.min(square / sourceWidth, square / sourceHeight);
  const width = sourceWidth * fit * Math.max(0.01, scale) * Math.max(0.01, aspect);
  const height = sourceHeight * fit * Math.max(0.01, scale);
  return {
    x: (square - width) / 2,
    y: (square - height) / 2,
    width,
    height,
  };
}

declare global {
  interface Window {
    voxcelFiveViewAspect?: typeof fitSourceToSquare;
  }
}

window.voxcelFiveViewAspect = fitSourceToSquare;
