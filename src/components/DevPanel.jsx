import { useState } from "react";
import { setRoomXp } from "../firebase";
import { LEVELS, getLevelNumber } from "../data/levels";

// Floating dev panel — only renders inside the founder's dev room.
// Surfaces controls that make manual feature testing fast.
//
// Day 1 controls:
//   - Set XP to a specific value (test the L3 Adventures gate, etc.)
//   - One-tap level jumps (L1, L3, L5, L10, L20)
//
// As later days land, add:
//   - Reset Adventures state (Day 5)
//   - Switch player perspective (Day 5+, two-player simulation)
//   - Force partner mood (Day 9, Side Quest trigger testing)

export default function DevPanel({ room, roomData }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [xpInput, setXpInput] = useState("");

  const xp = roomData?.xp ?? 0;
  const level = getLevelNumber(xp);

  async function applyXp(value) {
    if (busy) return;
    setBusy(true);
    try {
      await setRoomXp(room, value);
    } finally {
      setBusy(false);
    }
  }

  async function jumpToLevel(targetLevel) {
    const idx = Math.max(0, Math.min(LEVELS.length - 2, targetLevel - 1));
    await applyXp(LEVELS[idx]);
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        zIndex: 9999,
        fontSize: "0.75rem",
      }}
    >
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open dev panel"
          style={{
            background: "rgba(255,180,80,0.18)",
            border: "1px dashed rgba(255,180,80,0.6)",
            color: "rgba(255,255,255,0.95)",
            borderRadius: 999,
            padding: "0.3rem 0.6rem",
            fontSize: "0.7rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          🧪 Dev · L{level}
        </button>
      ) : (
        <div
          style={{
            background: "rgba(20,18,40,0.96)",
            border: "1px solid rgba(255,180,80,0.5)",
            borderRadius: 12,
            padding: "0.85rem",
            width: 240,
            color: "rgba(255,255,255,0.95)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,180,80,0.95)" }}>
              🧪 Dev Panel
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close dev panel"
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "1rem", padding: 0 }}
            >
              ✕
            </button>
          </div>

          <div style={{ marginBottom: "0.5rem", opacity: 0.8, lineHeight: 1.4 }}>
            Code: <strong>{room}</strong>
            <br />
            XP: <strong>{xp}</strong> · Level: <strong>{level}</strong>
          </div>

          <div style={{ marginBottom: "0.5rem" }}>
            <div style={{ fontSize: "0.7rem", opacity: 0.7, marginBottom: "0.25rem" }}>Jump to level</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {[1, 3, 5, 7, 10, 15, 20].map((L) => (
                <button
                  key={L}
                  onClick={() => jumpToLevel(L)}
                  disabled={busy}
                  style={{
                    flex: "1 1 30%",
                    padding: "0.3rem",
                    background: L === level ? "rgba(255,180,80,0.35)" : "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "inherit",
                    borderRadius: 6,
                    fontSize: "0.72rem",
                    cursor: busy ? "wait" : "pointer",
                  }}
                >
                  L{L}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.7rem", opacity: 0.7, marginBottom: "0.25rem" }}>Set XP exactly</div>
            <div style={{ display: "flex", gap: 4 }}>
              <input
                type="number"
                value={xpInput}
                onChange={(e) => setXpInput(e.target.value)}
                placeholder={String(xp)}
                style={{
                  flex: 1,
                  padding: "0.3rem 0.5rem",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 6,
                  color: "inherit",
                  fontSize: "0.75rem",
                }}
              />
              <button
                disabled={busy || xpInput === ""}
                onClick={() => {
                  const v = parseInt(xpInput, 10);
                  if (!Number.isNaN(v)) applyXp(v);
                }}
                style={{
                  padding: "0.3rem 0.6rem",
                  background: "rgba(255,180,80,0.25)",
                  border: "1px solid rgba(255,180,80,0.5)",
                  color: "inherit",
                  borderRadius: 6,
                  fontSize: "0.72rem",
                  cursor: "pointer",
                }}
              >
                Set
              </button>
            </div>
          </div>

          <div style={{ marginTop: "0.6rem", fontSize: "0.65rem", opacity: 0.55, lineHeight: 1.4 }}>
            More controls land as features ship (reset Adventures, switch player, force partner mood).
          </div>
        </div>
      )}
    </div>
  );
}
