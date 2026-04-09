import { useRef, useEffect } from "react";

// Pixel character on a 12x16 grid
// 0=transparent, 1=skin, 2=hair, 3=outfit, 4=eye, 5=mouth, 6=shoe, 7=blush, 8=accessory(bow/tie)

const HAIR_STYLES = {
  short: [
    [0,0,0,2,2,2,2,2,2,0,0,0],
    [0,0,2,2,2,2,2,2,2,2,0,0],
    [0,0,2,2,2,2,2,2,2,2,0,0],
  ],
  long: [
    [0,0,0,2,2,2,2,2,2,0,0,0],
    [0,0,2,2,2,2,2,2,2,2,0,0],
    [0,2,2,2,2,2,2,2,2,2,2,0],
  ],
  spiky: [
    [0,0,2,0,2,0,0,2,0,2,0,0],
    [0,0,0,2,2,2,2,2,2,0,0,0],
    [0,0,2,2,2,2,2,2,2,2,0,0],
  ],
  curly: [
    [0,0,2,2,0,2,2,0,2,2,0,0],
    [0,2,2,2,2,2,2,2,2,2,2,0],
    [0,2,2,2,2,2,2,2,2,2,2,0],
  ],
  bob: [
    [0,0,0,2,2,2,2,2,2,0,0,0],
    [0,0,2,2,2,2,2,2,2,2,0,0],
    [0,2,2,2,2,2,2,2,2,2,2,0],
  ],
  ponytail: [
    [0,0,0,2,2,2,2,2,2,0,0,0],
    [0,0,2,2,2,2,2,2,2,2,2,0],
    [0,0,2,2,2,2,2,2,2,2,2,2],
  ],
  buzzcut: [
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,2,2,2,2,2,2,0,0,0],
    [0,0,2,2,2,2,2,2,2,2,0,0],
  ],
  pigtails: [
    [0,2,0,2,2,2,2,2,2,0,2,0],
    [0,2,2,2,2,2,2,2,2,2,2,0],
    [0,2,2,2,2,2,2,2,2,2,2,0],
  ],
};

// ---- MALE body frames ----
const M_IDLE = [
  [0,0,0,1,1,1,1,1,1,0,0,0], // face
  [0,0,0,1,4,1,1,4,1,0,0,0], // eyes
  [0,0,0,1,1,1,1,1,1,0,0,0], // nose
  [0,0,0,1,1,5,5,1,1,0,0,0], // mouth
  [0,0,0,0,1,1,1,1,0,0,0,0], // neck
  [0,0,3,3,3,3,3,3,3,3,0,0], // shoulders (broader)
  [0,0,1,3,3,3,3,3,3,1,0,0], // arms
  [0,0,0,3,3,3,3,3,3,0,0,0], // torso
  [0,0,0,3,3,3,3,3,3,0,0,0], // waist
  [0,0,0,3,3,0,0,3,3,0,0,0], // legs
  [0,0,0,1,1,0,0,1,1,0,0,0], // ankles
  [0,0,0,6,6,0,0,6,6,0,0,0], // shoes
  [0,0,6,6,6,0,0,6,6,6,0,0], // shoes bottom
];

const M_WALK = [
  [0,0,0,1,1,1,1,1,1,0,0,0],
  [0,0,0,1,4,1,1,4,1,0,0,0],
  [0,0,0,1,1,1,1,1,1,0,0,0],
  [0,0,0,1,1,5,5,1,1,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0],
  [0,0,3,3,3,3,3,3,3,3,0,0],
  [0,0,1,3,3,3,3,3,3,1,0,0],
  [0,0,0,3,3,3,3,3,3,0,0,0],
  [0,0,0,3,3,3,3,3,3,0,0,0],
  [0,0,0,0,3,3,3,3,0,0,0,0],
  [0,0,0,1,1,0,0,0,1,1,0,0],
  [0,0,6,6,0,0,0,0,0,6,6,0],
  [0,0,6,6,0,0,0,0,0,6,6,0],
];

const M_HAPPY = [
  [0,0,0,1,1,1,1,1,1,0,0,0],
  [0,0,0,1,4,1,1,4,1,0,0,0],
  [0,0,0,1,1,1,1,1,1,0,0,0],
  [0,0,0,1,5,5,5,5,1,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0],
  [1,0,3,3,3,3,3,3,3,3,0,1],
  [0,1,0,3,3,3,3,3,3,0,1,0],
  [0,0,0,3,3,3,3,3,3,0,0,0],
  [0,0,0,3,3,3,3,3,3,0,0,0],
  [0,0,0,3,3,0,0,3,3,0,0,0],
  [0,0,0,1,1,0,0,1,1,0,0,0],
  [0,0,0,6,6,0,0,6,6,0,0,0],
  [0,0,6,6,6,0,0,6,6,6,0,0],
];

// ---- FEMALE body frames ----
const F_IDLE = [
  [0,0,0,1,1,1,1,1,1,0,0,0], // face
  [0,0,0,1,4,1,1,4,1,0,0,0], // eyes (with lashes: slightly different)
  [0,0,0,7,1,1,1,1,7,0,0,0], // cheeks/blush
  [0,0,0,1,1,5,5,1,1,0,0,0], // mouth
  [0,0,0,0,1,1,1,1,0,0,0,0], // neck
  [0,0,0,3,3,3,3,3,3,0,0,0], // shoulders (narrower)
  [0,0,1,3,3,3,3,3,3,1,0,0], // arms
  [0,0,0,3,3,3,3,3,3,0,0,0], // torso
  [0,0,0,0,3,3,3,3,0,0,0,0], // waist (narrower)
  [0,0,0,3,3,0,0,3,3,0,0,0], // skirt/legs
  [0,0,0,1,1,0,0,1,1,0,0,0], // ankles
  [0,0,0,6,6,0,0,6,6,0,0,0], // shoes
  [0,0,0,6,6,0,0,6,6,0,0,0], // shoes bottom
];

const F_WALK = [
  [0,0,0,1,1,1,1,1,1,0,0,0],
  [0,0,0,1,4,1,1,4,1,0,0,0],
  [0,0,0,7,1,1,1,1,7,0,0,0],
  [0,0,0,1,1,5,5,1,1,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0],
  [0,0,0,3,3,3,3,3,3,0,0,0],
  [0,0,1,3,3,3,3,3,3,1,0,0],
  [0,0,0,3,3,3,3,3,3,0,0,0],
  [0,0,0,0,3,3,3,3,0,0,0,0],
  [0,0,0,0,3,3,3,3,0,0,0,0],
  [0,0,0,1,1,0,0,0,1,1,0,0],
  [0,0,0,6,6,0,0,0,6,6,0,0],
  [0,0,0,6,6,0,0,0,6,6,0,0],
];

const F_HAPPY = [
  [0,0,0,1,1,1,1,1,1,0,0,0],
  [0,0,0,1,4,1,1,4,1,0,0,0],
  [0,0,0,7,1,1,1,1,7,0,0,0],
  [0,0,0,1,5,5,5,5,1,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0],
  [0,1,0,3,3,3,3,3,3,0,1,0],
  [0,0,1,3,3,3,3,3,3,1,0,0],
  [0,0,0,3,3,3,3,3,3,0,0,0],
  [0,0,0,0,3,3,3,3,0,0,0,0],
  [0,0,0,3,3,0,0,3,3,0,0,0],
  [0,0,0,1,1,0,0,1,1,0,0,0],
  [0,0,0,6,6,0,0,6,6,0,0,0],
  [0,0,0,6,6,0,0,6,6,0,0,0],
];

const BODIES = {
  male:   { idle: M_IDLE, walk: M_WALK, happy: M_HAPPY },
  female: { idle: F_IDLE, walk: F_WALK, happy: F_HAPPY },
};

export const BODY_TYPES = ["male", "female"];
export const SKIN_COLORS = ["#fde0b5", "#f5c088", "#d4956a", "#a0724a", "#6b4a30", "#f8d5c2"];
export const HAIR_COLORS = ["#2c1b0e", "#5c3317", "#c2884e", "#f5d96b", "#d94f4f", "#e879a0", "#7e57c2", "#37a0db"];
export const OUTFIT_COLORS = ["#a855f7", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6"];
export const SHOE_COLORS = ["#1f1f1f", "#f5f5f5", "#d94f4f", "#3b82f6", "#f59e0b"];
export const HAIR_STYLE_NAMES = Object.keys(HAIR_STYLES);

export const DEFAULT_CHAR = {
  body: "male",
  hairStyle: "short",
  hairColor: "#2c1b0e",
  skinColor: "#fde0b5",
  outfitColor: "#a855f7",
  shoeColor: "#1f1f1f",
};

function buildFrame(hairStyle, bodyFrame) {
  const hair = HAIR_STYLES[hairStyle] || HAIR_STYLES.short;
  return [...hair, ...bodyFrame];
}

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

export default function PixelChar({ config = DEFAULT_CHAR, state = "idle", size = 4, className = "" }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const colorMap = getColorMap(config);
    const bodyType = BODIES[config.body] || BODIES.male;

    const W = 12;
    const stateMap = {
      idle:     [buildFrame(config.hairStyle, bodyType.idle)],
      walk:     [buildFrame(config.hairStyle, bodyType.idle), buildFrame(config.hairStyle, bodyType.walk)],
      happy:    [buildFrame(config.hairStyle, bodyType.happy), buildFrame(config.hairStyle, bodyType.idle)],
      thinking: [buildFrame(config.hairStyle, bodyType.idle)],
    };

    const activeFrames = stateMap[state] || stateMap.idle;
    canvas.width = W * size;
    canvas.height = activeFrames[0].length * size;

    let tick = 0;
    function draw() {
      const frameIdx = Math.floor(tick / 30) % activeFrames.length;
      const frame = activeFrames[frameIdx];
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bounceY = (state === "walk" || state === "happy") && frameIdx === 1 ? -size : 0;

      for (let y = 0; y < frame.length; y++) {
        for (let x = 0; x < W; x++) {
          const val = frame[y][x];
          if (val === 0) continue;
          ctx.fillStyle = colorMap[val] || "#ff00ff";
          ctx.fillRect(x * size, y * size + bounceY, size, size);
        }
      }

      // Thinking bubble
      if (state === "thinking") {
        ctx.fillStyle = "#ffffff";
        const bx = W * size - 3 * size;
        ctx.fillRect(bx, 0, size * 2, size * 2);
        ctx.fillRect(bx - size, size * 3, size, size);
      }

      tick++;
      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [config, state, size]);

  const H = (HAIR_STYLES[config.hairStyle]?.length || 3) + (BODIES[config.body]?.idle || M_IDLE).length;

  return (
    <canvas
      ref={canvasRef}
      className={`pixel-char ${className}`}
      style={{ width: 12 * size, height: H * size, imageRendering: "pixelated" }}
    />
  );
}
