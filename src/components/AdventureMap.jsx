import { useRef, useEffect, memo } from "react";

// Adventures map: a constellation in the night sky.
// Owl Guide sits at the lower-left, the path winds up and to the right
// through 10 chapter milestones. Both partners' positions render as small
// star clusters near the current milestone.
//
// Day 2 adds ambient animation:
//   - Background stars twinkle (sinusoidal alpha)
//   - Owl Guide blinks every 5-7 seconds
//   - A shooting star streaks across roughly every 25-40 seconds
//
// Animation runs at ~20 FPS via requestAnimationFrame, pauses when document is
// hidden (battery courtesy on mobile).
//
// Design constraint (eng review 1B): chapter content is append-only after deploy.
// CONSTELLATION_LAYOUT and milestone count must stay aligned with adventureChapters.js.

const SKY_TOP = "#0d1b3e";
const SKY_BOTTOM = "#1a2b5e";
const PATH_LINE = "rgba(255,255,255,0.18)";
const MILESTONE_LOCKED = "rgba(255,255,255,0.25)";
const MILESTONE_DONE = "#f4c97a";
const MILESTONE_CURRENT = "#fff5b8";
const PLAYER_COLORS = ["#ff6b9d", "#67c1ff"];

const STAR_COUNT = 60;
const FRAME_INTERVAL_MS = 50; // ~20 FPS animation cap

// Owl pixel sprite (16x16). Day 2 adds eye-closed variant for blinking.
// 0=transparent, 1=body, 2=eye-bg (cream), 3=eye-pupil (dark), 4=beak, 5=tufts/wings
const OWL_OPEN = [
  [0,0,0,5,0,0,0,0,0,0,0,0,5,0,0,0],
  [0,0,5,1,5,0,0,0,0,0,0,5,1,5,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,1,2,2,2,1,1,1,2,2,2,1,1,1,0],
  [0,1,2,2,3,2,1,1,1,2,3,2,2,1,1,0],
  [0,1,2,2,2,2,1,4,1,2,2,2,2,1,1,0],
  [0,1,1,1,1,1,4,4,4,1,1,1,1,1,1,0],
  [0,1,5,1,1,1,1,1,1,1,1,1,5,1,1,0],
  [0,1,5,5,1,1,1,1,1,1,1,5,5,1,1,0],
  [0,0,1,5,5,1,1,1,1,5,5,1,1,0,0,0],
  [0,0,1,1,5,5,1,1,5,5,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,4,4,0,0,0,4,4,0,0,0,0,0],
  [0,0,0,0,0,4,0,0,0,0,4,0,0,0,0,0],
];
// Closed-eye variant: rows 4-6 use body color across the eye region.
const OWL_CLOSED = OWL_OPEN.map((row, r) => {
  if (r < 4 || r > 6) return row;
  return row.map((v) => (v === 2 || v === 3 ? 1 : v));
});
const OWL_PALETTE = [
  "transparent",
  "#6b4423",
  "#f5f0d8",
  "#1a1a2e",
  "#f4a437",
  "#8b5a2b",
];

// Constellation layout — 10 milestones for Chapter 1.
// Coordinates are normalized (0..1) so the canvas can resize.
const CONSTELLATION_LAYOUT = [
  { x: 0.18, y: 0.82 },
  { x: 0.32, y: 0.70 },
  { x: 0.22, y: 0.56 },
  { x: 0.42, y: 0.50 },
  { x: 0.34, y: 0.36 },
  { x: 0.54, y: 0.30 },
  { x: 0.48, y: 0.18 },
  { x: 0.68, y: 0.22 },
  { x: 0.78, y: 0.36 },
  { x: 0.88, y: 0.20 },
];

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
const STAR_RNG = seededRandom(20260428);
// Each star gets a unique twinkle phase so the sky isn't synchronized.
const STAR_FIELD = Array.from({ length: STAR_COUNT }, () => ({
  x: STAR_RNG(),
  y: STAR_RNG(),
  size: STAR_RNG() < 0.15 ? 1.6 : 0.9,
  baseAlpha: 0.35 + STAR_RNG() * 0.55,
  twinkleAmp: 0.15 + STAR_RNG() * 0.3,
  twinklePhase: STAR_RNG() * Math.PI * 2,
  twinkleSpeed: 0.0008 + STAR_RNG() * 0.0014, // radians per millisecond
}));

function drawSprite(ctx, sprite, originX, originY, scale) {
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 16; col++) {
      const v = sprite[row][col];
      if (v === 0) continue;
      ctx.fillStyle = OWL_PALETTE[v];
      ctx.fillRect(originX + col * scale, originY + row * scale, scale, scale);
    }
  }
}

function drawStar(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
}

// Single shooting-star sequence. Spawns at random, streaks for ~700ms, then waits.
function newShootingStar(width, height, time) {
  const startSide = Math.random() < 0.5 ? "left" : "top";
  const startX = startSide === "left" ? -10 : Math.random() * width * 0.6;
  const startY = startSide === "left" ? Math.random() * height * 0.4 : -10;
  return {
    startX,
    startY,
    angleDeg: 25 + Math.random() * 20, // gentle diagonal toward bottom-right
    distance: width * 1.2,
    spawnedAt: time,
    duration: 700,
  };
}

function drawShootingStar(ctx, ss, time) {
  const t = (time - ss.spawnedAt) / ss.duration;
  if (t < 0 || t > 1) return;
  const rad = (ss.angleDeg * Math.PI) / 180;
  const headX = ss.startX + Math.cos(rad) * ss.distance * t;
  const headY = ss.startY + Math.sin(rad) * ss.distance * t;
  const tailLen = 36;
  const tailX = headX - Math.cos(rad) * tailLen;
  const tailY = headY - Math.sin(rad) * tailLen;

  const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(1, `rgba(255,255,255,${0.85 * (1 - Math.abs(t - 0.5) * 1.6)})`);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(headX, headY);
  ctx.stroke();

  drawStar(ctx, headX, headY, 1.6, `rgba(255,255,255,${0.9 * (1 - Math.abs(t - 0.5) * 1.4)})`);
}

function drawMap(ctx, width, height, opts) {
  const { currentIndex, p1Index, p2Index, locked, time, owlBlinking, shootingStar } = opts;

  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, SKY_TOP);
  grad.addColorStop(1, SKY_BOTTOM);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Twinkling background stars
  for (const s of STAR_FIELD) {
    const t = time * s.twinkleSpeed + s.twinklePhase;
    const alpha = Math.max(0.05, Math.min(1, s.baseAlpha + Math.sin(t) * s.twinkleAmp));
    drawStar(ctx, s.x * width, s.y * height, s.size, `rgba(255,255,255,${alpha})`);
  }

  // Shooting star (above stars, below constellation)
  if (shootingStar) drawShootingStar(ctx, shootingStar, time);

  // Constellation path lines
  ctx.strokeStyle = PATH_LINE;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  for (let i = 0; i < CONSTELLATION_LAYOUT.length - 1; i++) {
    const a = CONSTELLATION_LAYOUT[i];
    const b = CONSTELLATION_LAYOUT[i + 1];
    ctx.moveTo(a.x * width, a.y * height);
    ctx.lineTo(b.x * width, b.y * height);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Milestones
  for (let i = 0; i < CONSTELLATION_LAYOUT.length; i++) {
    const m = CONSTELLATION_LAYOUT[i];
    const cx = m.x * width;
    const cy = m.y * height;

    const isCurrent = i === currentIndex;
    const isDone = i < currentIndex;

    if (isCurrent) {
      // Pulsing halo: radius oscillates with time
      const pulse = 14 + Math.sin(time * 0.003) * 4;
      const haloGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulse);
      haloGrad.addColorStop(0, "rgba(255,245,184,0.55)");
      haloGrad.addColorStop(1, "rgba(255,245,184,0)");
      ctx.fillStyle = haloGrad;
      ctx.fillRect(cx - pulse, cy - pulse, pulse * 2, pulse * 2);
      drawStar(ctx, cx, cy, 4, MILESTONE_CURRENT);
    } else if (isDone) {
      drawStar(ctx, cx, cy, 3, MILESTONE_DONE);
    } else {
      drawStar(ctx, cx, cy, 2.5, MILESTONE_LOCKED);
    }
  }

  // Player position clusters
  function drawPlayerCluster(idx, color, offsetX) {
    const m = CONSTELLATION_LAYOUT[Math.max(0, Math.min(CONSTELLATION_LAYOUT.length - 1, idx))];
    const cx = m.x * width + offsetX;
    const cy = m.y * height + 14;
    drawStar(ctx, cx, cy, 1.8, color);
    drawStar(ctx, cx - 4, cy + 3, 1.2, color);
    drawStar(ctx, cx + 3, cy + 2, 1.2, color);
  }
  drawPlayerCluster(p1Index, PLAYER_COLORS[0], -7);
  drawPlayerCluster(p2Index, PLAYER_COLORS[1], 7);

  // Owl Guide (lower-left), blinks occasionally
  drawSprite(ctx, owlBlinking ? OWL_CLOSED : OWL_OPEN, 8, height - 40, 2);

  // Locked overlay
  if (locked) {
    ctx.fillStyle = "rgba(13,27,62,0.78)";
    ctx.fillRect(0, 0, width, height);
  }
}

const AdventureMap = memo(function AdventureMap({
  level = 1,
  currentChapterIndex = 0,
  p1Index = 0,
  p2Index = 0,
  onOpen,
}) {
  const canvasRef = useRef(null);
  const animStateRef = useRef({
    nextBlinkAt: 4000 + Math.random() * 3000, // first blink between 4-7s
    blinkUntil: 0,
    nextShootAt: 8000 + Math.random() * 12000, // first shoot between 8-20s
    shootingStar: null,
    startedAt: 0,
  });
  const locked = level < 3;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let rafId;
    let lastDraw = 0;
    const state = animStateRef.current;
    state.startedAt = performance.now();

    function frame(now) {
      // Pause animation when tab is hidden — battery courtesy
      if (document.hidden) {
        rafId = requestAnimationFrame(frame);
        return;
      }
      if (now - lastDraw >= FRAME_INTERVAL_MS) {
        const t = now - state.startedAt;

        // Owl blink scheduling
        let owlBlinking = false;
        if (t > state.nextBlinkAt) {
          state.blinkUntil = state.nextBlinkAt + 150; // blink lasts 150ms
          state.nextBlinkAt = state.blinkUntil + 4000 + Math.random() * 3500;
        }
        owlBlinking = t < state.blinkUntil;

        // Shooting star scheduling
        if (t > state.nextShootAt && !state.shootingStar) {
          state.shootingStar = newShootingStar(w, h, t);
          state.nextShootAt = state.shootingStar.spawnedAt + state.shootingStar.duration + 18000 + Math.random() * 18000;
        }
        if (state.shootingStar && t > state.shootingStar.spawnedAt + state.shootingStar.duration) {
          state.shootingStar = null;
        }

        drawMap(ctx, w, h, {
          currentIndex: currentChapterIndex,
          p1Index,
          p2Index,
          locked,
          time: t,
          owlBlinking,
          shootingStar: state.shootingStar,
        });
        lastDraw = now;
      }
      rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(rafId);
  }, [currentChapterIndex, p1Index, p2Index, locked]);

  return (
    <div
      onClick={locked ? undefined : onOpen}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 380,
        aspectRatio: "10 / 7",
        margin: "0.75rem auto",
        borderRadius: 14,
        overflow: "hidden",
        cursor: locked ? "default" : "pointer",
        boxShadow: "0 6px 20px rgba(13,27,62,0.45)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      role={locked ? undefined : "button"}
      aria-label={locked ? "Adventures locked" : "Open Adventures"}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 14,
          color: "rgba(255,255,255,0.85)",
          fontSize: "0.68rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          textShadow: "0 1px 3px rgba(0,0,0,0.6)",
          pointerEvents: "none",
        }}
      >
        Adventures
      </div>
      {locked && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.85)",
            textAlign: "center",
            padding: "1rem",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: "1.6rem", marginBottom: 6 }}>🔒</div>
          <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Adventures unlocks at Level 3</div>
          <div style={{ fontSize: "0.7rem", opacity: 0.75, marginTop: 4 }}>
            Walk the path together
          </div>
        </div>
      )}
    </div>
  );
});

export default AdventureMap;
