import { useState } from "react";
import { addCustomCard } from "../firebase";

const CARD_TYPES = [
  { value: "text", label: "Open Question", emoji: "💬", desc: "They answer in their own words" },
  { value: "choice", label: "Would You Rather", emoji: "🤔", desc: "Pick A or B" },
  { value: "thisorthat", label: "This or That", emoji: "⚡", desc: "Quick binary pick" },
  { value: "photo", label: "Photo Challenge", emoji: "📸", desc: "Take a pic or describe it" },
  { value: "hottake", label: "Hot Take", emoji: "🔥", desc: "Share an opinion, get rated" },
  { value: "rate", label: "Rate This", emoji: "⭐", desc: "Both rate 1-5, see if you match" },
];

export default function CreateCard({ room, onBack, onCreated }) {
  const [type, setType] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!type) return;
    setSaving(true);
    const card = { type };
    if (type === "choice" || type === "thisorthat") {
      card.a = optA.trim();
      card.b = optB.trim();
      if (type === "choice") card.prompt = prompt.trim() || "Would you rather...";
    } else {
      card.prompt = prompt.trim();
    }
    await addCustomCard(room, card);
    setSaving(false);
    onCreated?.();
    onBack();
  }

  const needsPrompt = type && type !== "thisorthat";
  const needsOptions = type === "choice" || type === "thisorthat";
  const canSave = type && (
    (needsOptions ? optA.trim() && optB.trim() : true) &&
    (needsPrompt ? prompt.trim() : true)
  );

  return (
    <div className="page createcard fade-in">
      <div className="cc-header">
        <button className="btn btn-ghost back-btn" onClick={onBack}>←</button>
        <h2>Create a Card</h2>
      </div>

      {/* Type selection */}
      {!type && (
        <div className="cc-types">
          <p className="cc-hint">Pick a card type</p>
          {CARD_TYPES.map((t) => (
            <button key={t.value} className="cc-type-btn" onClick={() => setType(t.value)}>
              <span className="cc-type-emoji">{t.emoji}</span>
              <div className="cc-type-info">
                <span className="cc-type-name">{t.label}</span>
                <span className="cc-type-desc">{t.desc}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Card editor */}
      {type && (
        <div className="cc-editor fade-in">
          <div className="cc-chosen">
            {CARD_TYPES.find((t) => t.value === type)?.emoji}{" "}
            {CARD_TYPES.find((t) => t.value === type)?.label}
            <button className="cc-change" onClick={() => setType(null)}>Change</button>
          </div>

          {needsPrompt && (
            <div className="cc-field">
              <label className="char-label">
                {type === "hottake" ? "What topic?" : type === "photo" ? "What should they photograph?" : type === "rate" ? "What should they rate?" : "Your question"}
              </label>
              <textarea
                className="input textarea"
                placeholder={
                  type === "choice" ? "Would you rather..." :
                  type === "hottake" ? "Give your hottest take about..." :
                  type === "photo" ? "Take a pic of..." :
                  type === "rate" ? "Rate this: ..." :
                  "Ask them anything..."
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                maxLength={200}
              />
            </div>
          )}

          {needsOptions && (
            <>
              <div className="cc-field">
                <label className="char-label">Option A</label>
                <input className="input" placeholder="First option" value={optA} onChange={(e) => setOptA(e.target.value)} maxLength={100} />
              </div>
              <div className="cc-field">
                <label className="char-label">Option B</label>
                <input className="input" placeholder="Second option" value={optB} onChange={(e) => setOptB(e.target.value)} maxLength={100} />
              </div>
            </>
          )}

          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !canSave}>
            {saving ? "..." : "Add to Custom Deck"}
          </button>
        </div>
      )}
    </div>
  );
}
