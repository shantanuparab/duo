import { useMemo } from "react";

// Each mood gets its own set of small floating symbols
const MOOD_PARTICLES = {
  happy:     ["☀️", "✿", "♪", "⭐"],
  loving:    ["♥", "💕", "♡", "💗"],
  excited:   ["✦", "✨", "⚡", "★"],
  energized: ["🔥", "⚡", "✧", "★"],
  chill:     ["~", "☁", "✿", "〰"],
  sleepy:    ["z", "Z", "💤", "z"],
  moody:     ["☁", "·", "~", "☁"],
  sad:       ["💧", "·", "☁", "💧"],
  angry:     ["⚡", "✕", "💢", "⚡"],
  anxious:   ["~", "·", "⟳", "~"],
  low:       ["·", "—", "·", "—"],
  missing:   ["♡", "·", "💜", "♡"],
};

// How many particles and how fast they move
const MOOD_CONFIG = {
  happy:     { count: 8,  speed: "slow" },
  loving:    { count: 10, speed: "slow" },
  excited:   { count: 10, speed: "medium" },
  energized: { count: 8,  speed: "fast" },
  chill:     { count: 5,  speed: "slow" },
  sleepy:    { count: 6,  speed: "slow" },
  moody:     { count: 5,  speed: "slow" },
  sad:       { count: 6,  speed: "slow" },
  angry:     { count: 6,  speed: "medium" },
  anxious:   { count: 7,  speed: "medium" },
  low:       { count: 4,  speed: "slow" },
  missing:   { count: 8,  speed: "slow" },
};

const SPEED_MAP = { slow: [15, 25], medium: [10, 18], fast: [6, 12] };

export default function MoodParticles({ moodId }) {
  if (!moodId || !MOOD_PARTICLES[moodId]) return null;

  const particles = MOOD_PARTICLES[moodId];
  const config = MOOD_CONFIG[moodId] || { count: 6, speed: "slow" };
  const [minDur, maxDur] = SPEED_MAP[config.speed];

  // Generate stable random positions
  const items = useMemo(() => {
    return Array.from({ length: config.count }, (_, i) => ({
      key: `${moodId}-${i}`,
      char: particles[i % particles.length],
      left: Math.random() * 100,
      delay: Math.random() * maxDur,
      duration: minDur + Math.random() * (maxDur - minDur),
      size: 0.6 + Math.random() * 0.5,
      drift: -20 + Math.random() * 40,
    }));
  }, [moodId]);

  return (
    <div className="mood-particles" aria-hidden="true">
      {items.map((p) => (
        <span
          key={p.key}
          className="mood-particle"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            fontSize: `${p.size}rem`,
            "--drift": `${p.drift}px`,
          }}
        >
          {p.char}
        </span>
      ))}
    </div>
  );
}
