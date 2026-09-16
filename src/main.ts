import "./style.css";
import { VoxelRenderer, type Settings } from "./renderer/VoxelRenderer";
import { desk } from "./scenes/desk";
import { room } from "./scenes/room";
import { asymmetric } from "./scenes/asymmetric";
import { viewAngles } from "./renderer/viewSettings";
const settings: Settings = {
  mode: 3,
  resolution: 128,
  voxelSize: 1,
  pitch: 22.5,
  yaw: 45,
  zoom: 1,
  zoomMode: "pixel",
  rotationStep: 22.5,
  light: 315,
  levels: 4,
  outline: true,
  shadow: true,
  background: "#d8ddcd",
  stabilize: true,
  gridStyle: 0,
  gridCell: 2,
  gridGap: 1,
  gridStrength: 0.85,
  gridColor: "#d8ddcd",
  blockLighting: true,
  shadowStyle: 2,
  shadowStrength: 0.65,
  shadowDotSize: 2,
};
const models = [desk(), room(), asymmetric()];
let modelIndex = 0;
let auto = false;
document.querySelector("#app")!.innerHTML = `
<header><a class="brand" href="./"><span class="logo">▦</span> VOXEL / PIXEL <small>RENDERING LAB</small></a><span class="tag">VOXEL TO PIXEL</span></header>
<main><section class="workspace"><div class="intro"><div><p class="eyebrow">EXPERIMENT 001 / VOLUME TO SPRITE</p><h1>立体を、ドットで描く。</h1><p class="sub">ひとつのVoxelモデル。すべての角度を、ピクセルに。</p></div><span class="pill">ORTHOGRAPHIC</span></div>
<div class="modebar" role="group" aria-label="描画モード"><button data-mode="1"><b>01</b> Original 3D</button><button data-mode="2"><b>02</b> Low-res</button><button data-mode="3" class="active"><b>03</b> Pixel Art <span>推奨</span></button></div>
<div class="stage-wrap"><div class="stage-top"><span id="model-name"></span><span id="resolution-badge"></span></div><div id="stage" aria-label="Voxel表示。ドラッグで回転、ホイールでズーム" tabindex="0"></div><div class="stage-bottom"><span><i class="dot"></i> LIVE VOXEL RENDER</span><span id="angle"></span></div></div>
<div class="view-actions"><span>↔ ドラッグで回転 <em>·</em> スクロール / ピンチで拡大</span><div><button id="rotate">↻ 自動回転</button><button id="back">180° 裏側へ</button><button id="reset">リセット</button></div></div>
<div class="notes"><span>03 / PIXEL ART</span><p id="mode-note">低解像度 × 固定段階の陰影 × 外周線。立方体の境界を消し、スプライトの色面へ。</p></div>
</section><aside><div class="panel-heading"><h2>Render controls</h2><span>リアルタイム</span></div>
<label class="field">テストモデル<select id="model"><option value="0">Object — デスク & PC</option><option value="1">Room — 小さな部屋</option><option value="2">Asymmetric — 探索ロボット</option></select></label>
<div class="section-label">PIXEL & GEOMETRY</div>
<label class="field">Render Resolution <select id="resolution">${[64, 96, 128, 160, 256].map((v) => `<option ${v === 128 ? "selected" : ""} value="${v}">${v} × ${v}</option>`).join("")}</select></label>
<div id="sliders-a"></div>
<div class="section-label">GRID / TEXTILE EXPERIMENT</div>
<div class="experiment-presets"><button id="block-preset">Voxelをドットで描く</button><button id="gap-preset">Voxel隙間 0.75</button></div>
<label class="field">ドットの表現<select id="grid-style"><option value="0">通常 — Voxel Sizeを使用</option><option value="3">Voxelごとに独立した四角</option><option value="1">画面格子 — 比較用</option><option value="2">十字ステッチ — 比較用</option></select></label>
<p class="view-hint">独立した四角は各Voxelの位置と色から描画。画面格子・ステッチは比較用の後処理です。</p>
<div id="sliders-grid"></div>
<label class="color-row">格子色<input type="color" id="grid-color" value="#d8ddcd"/></label>
<div class="section-label">VIEW / SPRITE</div>
<label class="field">回転の刻み<select id="rotation-step"><option value="22.5">22.5°刻み — 横16方向 / 縦も固定</option><option value="45">45°刻み — 横8方向 / 縦も固定</option><option value="0">自由回転 — 比較用</option></select></label>
<label class="field">拡大方式<select id="zoom-mode"><option value="pixel">ドットを保持 — 画像を整数倍拡大</option><option value="camera">カメラズーム — 比較用</option></select></label>
<p class="view-hint">固定角度では中間の絵を描きません。ドラッグは縦・横・斜めに操作できます。</p>
<div id="sliders-b"></div><div class="section-label">LIGHT & STYLE</div><div id="sliders-c"></div>
<label class="toggle">ブロック単位の陰影<input id="blockLighting" type="checkbox" checked/></label>
<label class="field">足元の影<select id="shadow-style"><option value="2">ドット網点 + 濃い接地影</option><option value="1">3段階の色面 + 接地影</option><option value="0">従来のフラット影</option></select></label>
<div id="sliders-shadow"></div><p class="view-hint">影はPitchが0°より上で見えます。暗部は紫寄りの段階色。網点は静止した2×2パターンです。</p>
<label class="toggle">Outline <span>外周 1 px</span><input id="outline" type="checkbox" checked/></label><label class="toggle">Shadow <span>床への投影</span><input id="shadow" type="checkbox" checked/></label><label class="toggle">Pixel stabilization<input id="stabilize" type="checkbox" checked/></label>
<label class="color-row">Background <span id="hex">#D8DDCD</span><input type="color" id="background" value="#d8ddcd"/></label>
<div class="export"><div class="section-label">EXPORT SPRITE</div><div><button id="png">↓ PNG 原寸</button><button id="png4">↓ PNG 4×</button></div><p>現在の背景・外周線を含むPNG</p></div>
</aside></main><footer><span>3D DATA → PIXEL ART RENDER</span><span id="stats"></span><span>NO AI. JUST VOXELS.</span></footer>`;
const slider = (
  target: string,
  key: keyof Settings,
  label: string,
  min: number,
  max: number,
  step: number,
  suffix = "",
) => {
  document
    .querySelector(target)!
    .insertAdjacentHTML(
      "beforeend",
      `<label class="slider-label" for="${key}">${label}<output id="${key}-value">${settings[key]}${suffix}</output></label><input class="slider" id="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${settings[key]}"/>`,
    );
  document.getElementById(key)!.addEventListener("input", (e) => {
    (settings as unknown as Record<string, unknown>)[key] = Number(
      (e.target as HTMLInputElement).value,
    );
    if (key === "voxelSize") renderer.rebuild();
    sync();
  });
};
slider("#sliders-a", "voxelSize", "Voxel Size", 0.65, 1, 0.05);
slider("#sliders-grid", "gridCell", "格子間隔（元画像px）", 1, 4, 1);
slider("#sliders-grid", "gridGap", "線幅 / ステッチ幅", 1, 3, 1);
slider("#sliders-grid", "gridStrength", "線の濃さ", 0, 1, 0.05);
slider("#sliders-b", "pitch", "Camera Pitch", -67.5, 67.5, 0.5, "°");
slider("#sliders-b", "zoom", "Zoom", 0.3, 3, 0.05, "×");
slider("#sliders-c", "light", "Light Direction", 0, 360, 1, "°");
slider("#sliders-c", "levels", "Quantization Levels", 3, 5, 1);
slider("#sliders-shadow", "shadowStrength", "影の濃さ", 0.2, 0.9, 0.05);
slider("#sliders-shadow", "shadowDotSize", "影のドット寸法", 1, 3, 1, "px");
const stage = document.querySelector<HTMLElement>("#stage")!;
const renderer = new VoxelRenderer(stage, settings);
renderer.setModel(models[0]);
const notes = [
  "フル解像度の通常陰影。低解像度化と段階陰影の効果を比較する基準。",
  "低解像度とNearest Neighborのみ。滑らかな明暗を残した比較モード。",
  "低解像度 × 固定段階の陰影 × 外周線。立方体の境界を消し、スプライトの色面へ。",
];
function sync() {
  for (const key of [
    "voxelSize",
    "pitch",
    "zoom",
    "light",
    "levels",
    "shadowStrength",
    "shadowDotSize",
    "gridCell",
    "gridGap",
    "gridStrength",
  ] as const) {
    (document.getElementById(key) as HTMLInputElement).value = String(
      settings[key],
    );
    document.getElementById(`${key}-value`)!.textContent =
      `${Number(settings[key].toFixed(2))}${key === "pitch" || key === "light" ? "°" : key === "zoom" ? "×" : ""}`;
  }
  document
    .querySelectorAll<HTMLButtonElement>("[data-mode]")
    .forEach((b) =>
      b.classList.toggle("active", Number(b.dataset.mode) === settings.mode),
    );
  document.querySelector("#model-name")!.textContent = models[modelIndex].name;
  document.querySelector("#mode-note")!.textContent = notes[settings.mode - 1];
  document.querySelector(".notes > span")!.textContent = [
    "01 / ORIGINAL 3D",
    "02 / LOW-RES",
    "03 / PIXEL ART",
  ][settings.mode - 1];
  const angles = viewAngles(
    settings.yaw,
    settings.pitch,
    settings.rotationStep,
  );
  document.querySelector("#pitch-value")!.textContent =
    `${Number(angles.pitch.toFixed(1))}°`;
  document.querySelector("#angle")!.textContent =
    `YAW ${Number((((angles.yaw % 360) + 360) % 360).toFixed(1))}° / PITCH ${Number(angles.pitch.toFixed(1))}°${settings.rotationStep ? " / FIXED" : " / FREE"}`;
  document.querySelector("#resolution-badge")!.textContent =
    settings.mode === 1
      ? "NATIVE RESOLUTION"
      : `${settings.resolution} × ${settings.resolution} / NEAREST`;
  document.querySelector("#stats")!.textContent =
    `${renderer.voxelCount.toLocaleString()} VOXELS · ${settings.levels} LIGHT BANDS`;
  (document.querySelector("#resolution") as HTMLSelectElement).disabled =
    settings.mode === 1;
  (document.querySelector("#levels") as HTMLInputElement).disabled =
    settings.mode !== 3;
  (document.querySelector("#light") as HTMLInputElement).disabled = false;
  (document.querySelector("#outline") as HTMLInputElement).disabled =
    settings.gridStyle === 3;
  document.querySelector<HTMLElement>(".stage-wrap")!.style.background =
    settings.background;
  document.querySelector("#hex")!.textContent =
    settings.background.toUpperCase();
  (document.querySelector("#grid-style") as HTMLSelectElement).value = String(
    settings.gridStyle,
  );
  (document.querySelector("#voxelSize") as HTMLInputElement).disabled =
    settings.gridStyle === 1 || settings.gridStyle === 2;
  for (const id of ["gridCell", "gridGap", "gridStrength", "grid-color"])
    (document.getElementById(id) as HTMLInputElement).disabled =
      settings.gridStyle !== 1 && settings.gridStyle !== 2;
  if (settings.gridStyle === 1 || settings.gridStyle === 2) {
    document.querySelector("#resolution-badge")!.textContent =
      settings.mode === 1
        ? "NATIVE / GRID 4×"
        : `${settings.resolution} × ${settings.resolution} → 格子PNG ${settings.resolution * 4}px`;
    document.querySelector("#voxelSize-value")!.textContent = "1（隙間なし）";
    document.querySelector("#mode-note")!.textContent =
      "形状は隙間なく描き、画面の格子で区切る実験。回転しても格子は縦横に固定。";
  }
  if (settings.gridStyle === 3) {
    document.querySelector("#mode-note")!.textContent =
      "各Voxelを自身の色の四角として描画。投影先が同じマスに重なる場合は手前のVoxelを表示。";
    document.querySelector("#stats")!.textContent =
      `${renderer.voxelCount.toLocaleString()} VOXEL BLOCKS · ${settings.blockLighting ? "PALETTE SHADING" : "FLAT COLOR"}`;
  }
}
document.querySelector("#grid-style")!.addEventListener("change", (e) => {
  settings.gridStyle = Number((e.target as HTMLSelectElement).value);
  renderer.rebuild();
  sync();
});
document.querySelector("#grid-color")!.addEventListener("input", (e) => {
  settings.gridColor = (e.target as HTMLInputElement).value;
});
for (const [id, style] of [
  ["block-preset", 3],
  ["gap-preset", 0],
] as const)
  document.querySelector<HTMLButtonElement>(`#${id}`)!.onclick = () => {
    settings.gridStyle = style;
    settings.voxelSize = 0.75;
    settings.resolution = 128;
    settings.mode = 3;
    settings.zoomMode = "pixel";
    settings.zoom = 1;
    settings.pitch = 0;
    settings.yaw = 0;
    settings.rotationStep = 45;
    modelIndex = 2;
    (document.querySelector("#model") as HTMLSelectElement).value = "2";
    (document.querySelector("#resolution") as HTMLSelectElement).value = "128";
    (document.querySelector("#zoom-mode") as HTMLSelectElement).value = "pixel";
    (document.querySelector("#rotation-step") as HTMLSelectElement).value =
      "45";
    renderer.setModel(models[2]);
    sync();
  };
document.querySelector("#rotation-step")!.addEventListener("change", (e) => {
  settings.rotationStep = Number((e.target as HTMLSelectElement).value);
  Object.assign(
    settings,
    viewAngles(settings.yaw, settings.pitch, settings.rotationStep),
  );
  sync();
});
document.querySelector("#zoom-mode")!.addEventListener("change", (e) => {
  settings.zoomMode = (e.target as HTMLSelectElement)
    .value as Settings["zoomMode"];
  settings.zoom = settings.zoomMode === "pixel" ? 1 : 1.2;
  sync();
});
document.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach(
  (b) =>
    (b.onclick = () => {
      settings.mode = Number(b.dataset.mode);
      sync();
    }),
);
document.querySelector("#model")!.addEventListener("change", (e) => {
  modelIndex = Number((e.target as HTMLSelectElement).value);
  renderer.setModel(models[modelIndex]);
  sync();
});
document.querySelector("#resolution")!.addEventListener("change", (e) => {
  settings.resolution = Number((e.target as HTMLSelectElement).value);
  sync();
});
document.querySelector("#shadow-style")!.addEventListener("change", (e) => {
  settings.shadowStyle = Number((e.target as HTMLSelectElement).value);
});
for (const key of ["outline", "shadow", "stabilize", "blockLighting"] as const)
  document.getElementById(key)!.addEventListener("change", (e) => {
    settings[key] = (e.target as HTMLInputElement).checked;
  });
document.querySelector("#background")!.addEventListener("input", (e) => {
  settings.background = (e.target as HTMLInputElement).value;
  sync();
});
document.querySelector<HTMLButtonElement>("#rotate")!.onclick = () => {
  auto = !auto;
  document.querySelector("#rotate")!.classList.toggle("active", auto);
  document.querySelector("#rotate")!.setAttribute("aria-pressed", String(auto));
};
document.querySelector<HTMLButtonElement>("#back")!.onclick = () => {
  settings.yaw += 180;
  sync();
};
document.querySelector<HTMLButtonElement>("#reset")!.onclick = () => {
  settings.yaw = 45;
  settings.pitch = 22.5;
  settings.zoom = settings.zoomMode === "pixel" ? 1 : 1.2;
  sync();
};
document.querySelector<HTMLButtonElement>("#png")!.onclick = () => {
  renderer.render();
  renderer.pipeline.exportPNG(1);
};
document.querySelector<HTMLButtonElement>("#png4")!.onclick = () => {
  renderer.render();
  renderer.pipeline.exportPNG(4);
};
const pointers = new Map<number, { x: number; y: number }>();
stage.addEventListener("pointerdown", (e) => {
  stage.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
});
stage.addEventListener("pointermove", (e) => {
  const prev = pointers.get(e.pointerId);
  if (!prev) return;
  const other = [...pointers.entries()].find(([id]) => id !== e.pointerId)?.[1];
  if (other) {
    const old = Math.hypot(prev.x - other.x, prev.y - other.y);
    const next = Math.hypot(e.clientX - other.x, e.clientY - other.y);
    if (old > 0)
      settings.zoom = Math.max(0.3, Math.min(3, (settings.zoom * next) / old));
  } else {
    settings.yaw += (e.clientX - prev.x) * 0.45;
    settings.pitch = Math.max(
      -67.5,
      Math.min(67.5, settings.pitch + (e.clientY - prev.y) * 0.22),
    );
  }
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  sync();
});
for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
  stage.addEventListener(event, (e) =>
    pointers.delete((e as PointerEvent).pointerId),
  );
stage.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    settings.zoom = Math.max(
      0.3,
      Math.min(3, settings.zoom * Math.exp(-e.deltaY * 0.001)),
    );
    sync();
  },
  { passive: false },
);
stage.addEventListener("keydown", (e) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
    e.preventDefault();
    Object.assign(
      settings,
      viewAngles(settings.yaw, settings.pitch, settings.rotationStep),
    );
    const pitchLimit = settings.rotationStep === 45 ? 45 : 67.5;
    if (e.key === "ArrowLeft") settings.yaw -= settings.rotationStep || 5;
    if (e.key === "ArrowRight") settings.yaw += settings.rotationStep || 5;
    if (e.key === "ArrowUp")
      settings.pitch = Math.min(
        pitchLimit,
        settings.pitch + (settings.rotationStep || 2),
      );
    if (e.key === "ArrowDown")
      settings.pitch = Math.max(
        -pitchLimit,
        settings.pitch - (settings.rotationStep || 2),
      );
    sync();
  }
});
let previous = performance.now();
function frame(now: number) {
  if (auto && pointers.size === 0) {
    settings.yaw += (Math.min(now - previous, 100) / 1000) * 18;
    sync();
  }
  previous = now;
  renderer.render();
  requestAnimationFrame(frame);
}
sync();
requestAnimationFrame(frame);
