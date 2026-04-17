import { useState } from "react";

export const MOODS = [
  // Positive
  { id: "happy",    emoji: "😊", label: "Happy",       bg: "#1a1408", accent: "#f59e0b", pink: "#fb923c", card: "#1f1a0e", surface: "rgba(245,158,11,.08)" },
  { id: "loving",   emoji: "🥰", label: "Loving",      bg: "#1a0a18", accent: "#ec4899", pink: "#f472b6", card: "#220e1e", surface: "rgba(236,72,153,.08)" },
  { id: "excited",  emoji: "✨", label: "Excited",     bg: "#140a1a", accent: "#a855f7", pink: "#e879f9", card: "#1a1228", surface: "rgba(168,85,247,.08)" },
  { id: "energized",emoji: "🔥", label: "Energized",   bg: "#1a0c08", accent: "#ef4444", pink: "#f97316", card: "#1f100c", surface: "rgba(239,68,68,.08)" },
  { id: "chill",    emoji: "😌", label: "Chill",       bg: "#081414", accent: "#14b8a6", pink: "#06b6d4", card: "#0e1c1a", surface: "rgba(20,184,166,.08)" },
  { id: "grateful", emoji: "🙏", label: "Grateful",    bg: "#10140a", accent: "#84cc16", pink: "#a3e635", card: "#161c0e", surface: "rgba(132,204,22,.08)" },
  { id: "silly",    emoji: "🤪", label: "Silly",       bg: "#1a1208", accent: "#f97316", pink: "#fdba74", card: "#201a0c", surface: "rgba(249,115,22,.08)" },
  { id: "proud",    emoji: "😤", label: "Proud",       bg: "#0c1014", accent: "#0ea5e9", pink: "#38bdf8", card: "#101820", surface: "rgba(14,165,233,.08)" },
  // Neutral
  { id: "sleepy",   emoji: "😴", label: "Sleepy",      bg: "#0d0d14", accent: "#6366f1", pink: "#818cf8", card: "#13131f", surface: "rgba(99,102,241,.08)" },
  { id: "moody",    emoji: "🌧️", label: "Moody",       bg: "#0c0e14", accent: "#64748b", pink: "#94a3b8", card: "#12141c", surface: "rgba(100,116,139,.08)" },
  { id: "nostalgic",emoji: "🌅", label: "Nostalgic",   bg: "#140e08", accent: "#d97706", pink: "#fbbf24", card: "#1c140c", surface: "rgba(217,119,6,.08)" },
  { id: "bored",    emoji: "😐", label: "Bored",       bg: "#0c0c0e", accent: "#52525b", pink: "#71717a", card: "#111114", surface: "rgba(82,82,91,.08)" },
  { id: "focused",  emoji: "🎯", label: "Focused",     bg: "#080e14", accent: "#2563eb", pink: "#3b82f6", card: "#0c1420", surface: "rgba(37,99,235,.08)" },
  // Low / negative
  { id: "sad",      emoji: "😢", label: "Sad",         bg: "#080c14", accent: "#3b82f6", pink: "#60a5fa", card: "#0c1220", surface: "rgba(59,130,246,.08)" },
  { id: "angry",    emoji: "😡", label: "Angry",       bg: "#1a0808", accent: "#dc2626", pink: "#b91c1c", card: "#200c0c", surface: "rgba(220,38,38,.08)" },
  { id: "anxious",  emoji: "😰", label: "Anxious",     bg: "#0e0c14", accent: "#7c3aed", pink: "#a78bfa", card: "#14101f", surface: "rgba(124,58,237,.08)" },
  { id: "low",      emoji: "😞", label: "Low",         bg: "#0a0a0e", accent: "#475569", pink: "#64748b", card: "#0f0f16", surface: "rgba(71,85,105,.08)" },
  { id: "stressed", emoji: "😫", label: "Stressed",    bg: "#140a0a", accent: "#e11d48", pink: "#f43f5e", card: "#1c0e10", surface: "rgba(225,29,72,.08)" },
  { id: "lonely",   emoji: "🫠", label: "Lonely",      bg: "#0a0a12", accent: "#6d28d9", pink: "#8b5cf6", card: "#10101c", surface: "rgba(109,40,217,.08)" },
  { id: "missing",  emoji: "🥺", label: "Missing you", bg: "#14081a", accent: "#c084fc", pink: "#d946ef", card: "#1c0e24", surface: "rgba(192,132,252,.08)" },
];

export const DEFAULT_MOOD = "excited";

export function getMood(id) {
  return MOODS.find((m) => m.id === id) || MOODS.find((m) => m.id === "moody") || MOODS[0];
}

export function applyMoodTheme(moodId) {
  const mood = getMood(moodId);
  const root = document.documentElement;
  root.style.setProperty("--bg", mood.bg);
  root.style.setProperty("--bg-card", mood.card);
  root.style.setProperty("--accent", mood.accent);
  root.style.setProperty("--pink", mood.pink);
  root.style.setProperty("--surface", mood.surface);
  root.style.setProperty("--accent-soft", mood.accent + "33");
  root.style.setProperty("--accent-glow", mood.accent + "66");
  root.style.setProperty("--pink-soft", mood.pink + "33");
}

export default function MoodSlider({ currentMood, onSelect }) {
  const [selected, setSelected] = useState(currentMood || DEFAULT_MOOD);

  function handlePick(id) {
    setSelected(id);
    onSelect(id);
  }

  return (
    <div className="mood-slider fade-in">
      <h2 className="mood-title">How are you feeling?</h2>
      <p className="mood-sub">This sets the vibe on their screen</p>
      <div className="mood-track">
        {MOODS.map((m) => (
          <button
            key={m.id}
            className={`mood-dot ${selected === m.id ? "active" : ""}`}
            onClick={() => handlePick(m.id)}
            style={{ "--mood-color": m.accent }}
          >
            <span className="mood-emoji">{m.emoji}</span>
            <span className="mood-label">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
