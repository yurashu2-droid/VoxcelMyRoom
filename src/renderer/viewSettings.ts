export function viewAngles(yaw: number, pitch: number, step: number) {
  const limit = step === 45 ? 45 : 67.5;
  return {
    yaw: step ? Math.round(yaw / step) * step : yaw,
    pitch: Math.max(
      -limit,
      Math.min(limit, step ? Math.round(pitch / step) * step : pitch),
    ),
  };
}
