import { useRef, useEffect } from "react";

// Pokemon-style pixel character on a 16x24 grid
// 0=transparent, 1=skin, 2=hair, 3=outfit, 4=eye, 5=mouth, 6=shoe, 7=blush

// ---- HAIR STYLES (rows 0-3, overlaid on head; long styles extend into body rows) ----
const HAIR_STYLES = {
  short: {
    rows: [
      [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
      [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
      [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
      [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
    ],
    sideRows: {},
  },
  long: {
    rows: [
      [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
      [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
      [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
      [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
    ],
    // Hair curtains that overlay body rows 4-12 (shoulder-length)
    sideRows: {
      4:  [0,0,2,0,0,0,0,0,0,0,0,0,0,2,0,0],
      5:  [0,0,2,0,0,0,0,0,0,0,0,0,0,2,0,0],
      6:  [0,2,2,0,0,0,0,0,0,0,0,0,0,2,2,0],
      7:  [0,2,2,0,0,0,0,0,0,0,0,0,0,2,2,0],
      8:  [0,2,2,0,0,0,0,0,0,0,0,0,0,2,2,0],
      9:  [0,0,2,0,0,0,0,0,0,0,0,0,0,2,0,0],
      10: [0,0,2,0,0,0,0,0,0,0,0,0,0,2,0,0],
      11: [0,0,0,2,0,0,0,0,0,0,0,0,2,0,0,0],
      12: [0,0,0,0,2,0,0,0,0,0,0,2,0,0,0,0],
    },
  },
  spiky: {
    rows: [
      [0,0,0,2,0,2,0,0,2,0,2,0,0,2,0,0],
      [0,0,2,2,2,2,2,2,2,2,2,2,2,0,0,0],
      [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
      [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
    ],
    sideRows: {},
  },
  curly: {
    rows: [
      [0,0,0,2,2,0,2,2,0,2,2,0,2,0,0,0],
      [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
      [0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
      [0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
    ],
    sideRows: {
      4: [0,2,0,0,0,0,0,0,0,0,0,0,0,0,2,0],
      5: [0,2,0,0,0,0,0,0,0,0,0,0,0,0,2,0],
      6: [0,0,2,0,0,0,0,0,0,0,0,0,0,2,0,0],
    },
  },
  bob: {
    rows: [
      [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
      [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
      [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
      [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
    ],
    sideRows: {
      4: [0,2,2,0,0,0,0,0,0,0,0,0,0,2,2,0],
      5: [0,2,2,0,0,0,0,0,0,0,0,0,0,2,2,0],
      6: [0,2,2,0,0,0,0,0,0,0,0,0,0,2,2,0],
      7: [0,0,2,2,0,0,0,0,0,0,0,0,2,2,0,0],
      8: [0,0,0,2,0,0,0,0,0,0,0,0,2,0,0,0],
    },
  },
  ponytail: {
    rows: [
      [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
      [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
      [0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
      [0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
    ],
    sideRows: {
      4:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0],
      5:  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0],
      6:  [0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0],
      7:  [0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0],
      8:  [0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0],
      9:  [0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0],
      10: [0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0],
    },
  },
  buzzcut: {
    rows: [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
      [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
      [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
    ],
    sideRows: {},
  },
  pigtails: {
    rows: [
      [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
      [0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
      [0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
      [0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0],
    ],
    sideRows: {
      4: [0,2,2,0,0,0,0,0,0,0,0,0,0,2,2,0],
      5: [0,2,2,0,0,0,0,0,0,0,0,0,0,2,2,0],
      6: [0,2,2,0,0,0,0,0,0,0,0,0,0,2,2,0],
      7: [0,0,2,0,0,0,0,0,0,0,0,0,0,2,0,0],
      8: [0,0,2,0,0,0,0,0,0,0,0,0,0,2,0,0],
    },
  },
};

// ---- MALE body (rows 4-23, appended after hair rows 0-3) ----
const M_BODY = [
  // row 4: top of head (forehead)
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  // row 5: eyes
  [0,0,0,1,1,4,4,1,1,4,4,1,1,0,0,0],
  // row 6: cheeks
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  // row 7: nose/mouth
  [0,0,0,1,1,1,5,5,1,1,1,1,1,0,0,0],
  // row 8: chin
  [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
  // row 9: neck
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  // row 10: shoulders
  [0,0,0,3,3,3,3,3,3,3,3,3,3,0,0,0],
  // row 11: upper arms + torso
  [0,0,1,1,3,3,3,3,3,3,3,3,1,1,0,0],
  // row 12: arms + torso
  [0,0,1,1,3,3,3,3,3,3,3,3,1,1,0,0],
  // row 13: lower torso
  [0,0,0,0,3,3,3,3,3,3,3,3,0,0,0,0],
  // row 14: waist
  [0,0,0,0,3,3,3,3,3,3,3,3,0,0,0,0],
  // row 15: hips
  [0,0,0,0,3,3,3,0,0,3,3,3,0,0,0,0],
  // row 16: upper legs
  [0,0,0,0,3,3,3,0,0,3,3,3,0,0,0,0],
  // row 17: lower legs
  [0,0,0,0,1,1,1,0,0,1,1,1,0,0,0,0],
  // row 18: ankles
  [0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0],
  // row 19: shoes top
  [0,0,0,6,6,6,0,0,0,0,6,6,6,0,0,0],
  // row 20: shoes mid
  [0,0,0,6,6,6,6,0,0,6,6,6,6,0,0,0],
  // row 21: shoes bottom
  [0,0,0,6,6,6,6,0,0,6,6,6,6,0,0,0],
  // rows 22-23: padding
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// ---- FEMALE body ----
const F_BODY = [
  [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,1,1,4,4,1,1,4,4,1,1,0,0,0],
  [0,0,0,7,1,1,1,1,1,1,1,1,7,0,0,0],
  [0,0,0,1,1,1,5,5,1,1,1,1,1,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,3,3,3,3,3,3,3,3,0,0,0,0],
  [0,0,1,1,3,3,3,3,3,3,3,3,1,1,0,0],
  [0,0,1,1,3,3,3,3,3,3,3,3,1,1,0,0],
  [0,0,0,0,3,3,3,3,3,3,3,3,0,0,0,0],
  // skirt flare
  [0,0,0,3,3,3,3,3,3,3,3,3,3,0,0,0],
  [0,0,3,3,3,3,3,0,0,3,3,3,3,3,0,0],
  [0,0,3,3,3,3,0,0,0,0,3,3,3,3,0,0],
  [0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0],
  [0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0],
  [0,0,0,6,6,6,0,0,0,0,6,6,6,0,0,0],
  [0,0,0,6,6,6,0,0,0,0,6,6,6,0,0,0],
  [0,0,0,6,6,6,0,0,0,0,6,6,6,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

export const BODY_TYPES = ["male", "female"];
export const SKIN_COLORS = ["#fde0b5", "#f5c088", "#d4956a", "#c68642", "#a0724a", "#6b4a30", "#4a2d1a", "#f8d5c2", "#ffe0bd", "#8d5524"];
export const HAIR_COLORS = ["#2c1b0e", "#5c3317", "#c2884e", "#f5d96b", "#d94f4f", "#e879a0", "#7e57c2", "#37a0db", "#1a1a2e", "#f5f5f5", "#22c55e", "#f97316"];
export const OUTFIT_COLORS = ["#a855f7", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6", "#f43f5e", "#84cc16", "#0ea5e9", "#1f1f1f"];
export const SHOE_COLORS = ["#1f1f1f", "#f5f5f5", "#d94f4f", "#3b82f6", "#f59e0b", "#10b981", "#a855f7", "#ec4899", "#8b4513", "#6b7280"];
export const HAIR_STYLE_NAMES = Object.keys(HAIR_STYLES);

export const DEFAULT_CHAR = {
  body: "male",
  hairStyle: "short",
  hairColor: "#2c1b0e",
  skinColor: "#fde0b5",
  outfitColor: "#a855f7",
  shoeColor: "#1f1f1f",
};

const W = 16;
const H = 24;

function getColorMap(config) {
  return {
    1: config.skinColor,
    2: config.hairColor,
    3: config.outfitColor,
    4: "#1a1a2e",
    5: "#e05580",
    6: config.shoeColor,
    7: config.skinColor + "88",
  };
}

function darkenColor(hex, amount = 0.3) {
  const c = hex.replace("#", "");
  const r = Math.max(0, Math.round(parseInt(c.substring(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(c.substring(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(c.substring(4, 6), 16) * (1 - amount)));
  return `rgb(${r},${g},${b})`;
}

function buildFrame(config) {
  const hair = HAIR_STYLES[config.hairStyle] || HAIR_STYLES.short;
  const body = config.body === "female" ? F_BODY : M_BODY;

  // Start with hair rows (0-3), then body rows (4-23)
  const frame = [...hair.rows.map(r => [...r]), ...body.map(r => [...r])];

  // Overlay hair side rows (for long, bob, ponytail, pigtails, curly styles)
  if (hair.sideRows) {
    for (const [rowStr, sideRow] of Object.entries(hair.sideRows)) {
      const row = parseInt(rowStr);
      if (row < frame.length) {
        for (let x = 0; x < W; x++) {
          if (sideRow[x] !== 0) frame[row][x] = sideRow[x];
        }
      }
    }
  }
  return frame;
}

function renderToOffscreen(config, size) {
  const frame = buildFrame(config);
  const colorMap = getColorMap(config);

  const canvas = document.createElement("canvas");
  canvas.width = W * size;
  canvas.height = H * size;
  const ctx = canvas.getContext("2d");

  // Pass 1: draw body, then hair overwrites where present
  const resolvedColors = [];
  for (let y = 0; y < H; y++) {
    resolvedColors[y] = [];
    for (let x = 0; x < W; x++) {
      const val = frame[y]?.[x];
      if (!val) { resolvedColors[y][x] = null; continue; }
      const color = colorMap[val] || "#ff00ff";
      resolvedColors[y][x] = color;
      ctx.fillStyle = color;
      ctx.fillRect(x * size, y * size, size, size);
    }
  }

  // Pass 2: outlines (1 grid cell wide, 30% darker)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (resolvedColors[y][x]) continue; // only draw outline on transparent cells
      // Check 4 neighbors for non-transparent cells
      const neighbors = [
        [y - 1, x], [y + 1, x], [y, x - 1], [y, x + 1],
      ];
      let outlineColor = null;
      for (const [ny, nx] of neighbors) {
        if (ny >= 0 && ny < H && nx >= 0 && nx < W && resolvedColors[ny]?.[nx]) {
          outlineColor = resolvedColors[ny][nx];
          break;
        }
      }
      if (outlineColor && !outlineColor.includes("88")) { // skip semi-transparent blush
        ctx.fillStyle = darkenColor(outlineColor.startsWith("rgb") ? outlineColor : outlineColor.slice(0, 7));
        ctx.fillRect(x * size, y * size, size, size);
      }
    }
  }

  return canvas;
}

export default function PixelChar({ config = DEFAULT_CHAR, state = "idle", size = 4, className = "" }) {
  const canvasRef = useRef(null);
  const cacheRef = useRef(null);
  const cacheKeyRef = useRef("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = W * size;
    canvas.height = H * size;

    // Cache key based on config + size
    const key = JSON.stringify(config) + size;
    if (cacheKeyRef.current !== key) {
      cacheRef.current = renderToOffscreen(config, size);
      cacheKeyRef.current = key;
    }

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(cacheRef.current, 0, 0);
  }, [config, size, state]);

  return (
    <canvas
      ref={canvasRef}
      className={`pixel-char ${className}`}
      style={{ width: W * size, height: H * size, imageRendering: "pixelated" }}
    />
  );
}
