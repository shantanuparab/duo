import { useRef, useEffect } from "react";

// 10x8 pixel pets — 0=transparent, 1=body, 2=eye, 3=nose/mouth, 4=accent(ears/tail), 5=accessory
const PETS = {
  cat: {
    idle: [
      [0,0,4,0,0,0,0,4,0,0],
      [0,4,1,4,1,1,4,1,4,0],
      [0,1,1,1,1,1,1,1,1,0],
      [0,1,2,1,1,1,2,1,1,0],
      [0,1,1,1,3,1,1,1,1,0],
      [0,0,1,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,1,0,0],
      [0,0,1,0,0,0,0,1,0,4],
    ],
    happy: [
      [0,0,4,0,0,0,0,4,0,0],
      [0,4,1,4,1,1,4,1,4,0],
      [0,1,1,1,1,1,1,1,1,0],
      [0,1,3,1,1,1,3,1,1,0],
      [0,1,1,3,3,3,1,1,1,0],
      [0,0,1,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,1,0,0],
      [0,0,1,0,0,0,0,1,4,0],
    ],
  },
  dog: {
    idle: [
      [0,4,4,0,0,0,4,4,0,0],
      [0,4,1,1,1,1,1,4,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [0,1,2,1,1,1,2,1,0,0],
      [0,1,1,1,3,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,0,1,0,0,0,1,0,4,4],
    ],
    happy: [
      [0,4,4,0,0,0,4,4,0,0],
      [0,4,1,1,1,1,1,4,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [0,1,3,1,1,1,3,1,0,0],
      [0,1,1,3,3,3,1,1,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,0,1,0,0,0,1,4,4,0],
    ],
  },
  bunny: {
    idle: [
      [0,0,1,0,0,0,1,0,0,0],
      [0,0,1,0,0,0,1,0,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [0,1,2,1,1,1,2,1,0,0],
      [0,1,1,1,3,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,0,0,0,0],
      [0,0,1,0,0,0,1,0,0,0],
    ],
    happy: [
      [0,0,1,0,0,0,1,0,0,0],
      [0,0,1,0,0,0,1,0,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [0,1,3,1,1,1,3,1,0,0],
      [0,1,1,3,3,3,1,1,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,0,0,1,1,1,0,0,0,0],
      [0,0,1,0,0,0,1,0,0,0],
    ],
  },
  hamster: {
    idle: [
      [0,0,4,0,0,0,4,0,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [1,1,1,1,1,1,1,1,1,0],
      [1,1,2,1,1,1,2,1,1,0],
      [1,1,1,1,3,1,1,1,1,0],
      [0,4,1,1,1,1,1,4,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
    ],
    happy: [
      [0,0,4,0,0,0,4,0,0,0],
      [0,1,1,1,1,1,1,1,0,0],
      [1,1,1,1,1,1,1,1,1,0],
      [1,1,3,1,1,1,3,1,1,0],
      [1,1,1,3,3,3,1,1,1,0],
      [0,4,1,1,1,1,1,4,0,0],
      [0,0,1,1,1,1,1,0,0,0],
      [0,0,0,1,0,1,0,0,0,0],
    ],
  },
};

export const PET_TYPES = Object.keys(PETS);
export const PET_COLORS = {
  cat:     { 1: "#f5d5a0", 2: "#2d2d2d", 3: "#e88ca5", 4: "#e8b86d" },
  dog:     { 1: "#c89060", 2: "#2d2d2d", 3: "#e88ca5", 4: "#8b5e3c" },
  bunny:   { 1: "#f0e6e0", 2: "#d44a6a", 3: "#e88ca5", 4: "#e0d0c8" },
  hamster: { 1: "#f5c888", 2: "#2d2d2d", 3: "#e88ca5", 4: "#f0a860" },
};

export const PET_NAMES_DEFAULT = { cat: "Mochi", dog: "Biscuit", bunny: "Muffin", hamster: "Nugget" };

export default function PixelPet({ type = "cat", state = "idle", size = 5, className = "" }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pet = PETS[type] || PETS.cat;
    const colors = PET_COLORS[type] || PET_COLORS.cat;

    const W = 10, H = 8;
    canvas.width = W * size;
    canvas.height = H * size;

    const frames = [pet.idle, pet[state] || pet.idle];
    let tick = 0;

    function draw() {
      const fi = Math.floor(tick / 40) % frames.length;
      const frame = frames[fi];
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bounceY = fi === 1 && state === "happy" ? -size : 0;

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const v = frame[y]?.[x];
          if (!v) continue;
          ctx.fillStyle = colors[v] || "#ff00ff";
          ctx.fillRect(x * size, y * size + bounceY, size, size);
        }
      }

      tick++;
      animRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [type, state, size]);

  return (
    <canvas
      ref={canvasRef}
      className={`pixel-pet ${className}`}
      style={{ width: 10 * size, height: 8 * size, imageRendering: "pixelated" }}
    />
  );
}
