import { useState } from "react";

// Vibe Check prompt — both rate on a slider, hidden until both submit.
// Reveal shows side-by-side values + interpretation (aligned / interesting gap).

export default function VibeCheckPrompt({ prompt, myAnswer, partnerAnswer, partnerName, myName, onSubmit, readOnly }) {
  const min = prompt.scale?.min ?? 1;
  const max = prompt.scale?.max ?? 10;
  const lowLabel = prompt.scale?.lowLabel ?? "low";
  const highLabel = prompt.scale?.highLabel ?? "high";

  const [draft, setDraft] = useState(Math.floor((min + max) / 2));
  const submitted = typeof myAnswer === "number";
  const partnerSubmitted = typeof partnerAnswer === "number";
  const bothSubmitted = submitted && partnerSubmitted;

  let alignmentText = "";
  if (bothSubmitted) {
    const gap = Math.abs(myAnswer - partnerAnswer);
    if (gap <= 1) alignmentText = "✨ You're aligned.";
    else if (gap <= 3) alignmentText = "Close, but a little distance worth talking about.";
    else alignmentText = "Real gap here. Worth a real conversation.";
  }

  return (
    <div style={{ padding: "1rem 0" }}>
      <div
        style={{
          fontSize: "0.7rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "rgba(120,210,255,0.95)",
          marginBottom: "0.5rem",
          opacity: 0.9,
        }}
      >
        Vibe Check
      </div>
      <div style={{ fontSize: "0.95rem", lineHeight: 1.55, marginBottom: "1.2rem" }}>
        {prompt.baseText}
      </div>

      {!submitted && !readOnly && (
        <>
          <div
            style={{
              padding: "0.85rem 1rem",
              background: "rgba(120,210,255,0.05)",
              border: "1px solid rgba(120,210,255,0.2)",
              borderRadius: 12,
              marginBottom: "0.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", opacity: 0.7, marginBottom: "0.5rem" }}>
              <span>{lowLabel}</span>
              <span>{highLabel}</span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              value={draft}
              onChange={(e) => setDraft(parseInt(e.target.value, 10))}
              style={{ width: "100%", accentColor: "rgba(120,210,255,1)" }}
            />
            <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "1.4rem", fontWeight: 600 }}>
              {draft}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => onSubmit(draft)} style={{ width: "100%" }}>
            Submit
          </button>
        </>
      )}

      {submitted && !bothSubmitted && (
        <div
          style={{
            background: "rgba(120,210,255,0.06)",
            border: "1px dashed rgba(120,210,255,0.3)",
            borderRadius: 12,
            padding: "0.85rem",
            textAlign: "center",
            fontSize: "0.85rem",
          }}
        >
          ✓ You said <strong>{myAnswer}</strong>. Waiting for {partnerName}...
        </div>
      )}

      {bothSubmitted && (
        <div>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            <ValueCard label={myName} value={myAnswer} highlight />
            <ValueCard label={partnerName} value={partnerAnswer} />
          </div>
          <div
            style={{
              textAlign: "center",
              fontSize: "0.85rem",
              padding: "0.75rem",
              background: "rgba(120,210,255,0.06)",
              border: "1px solid rgba(120,210,255,0.2)",
              borderRadius: 12,
            }}
          >
            {alignmentText}
          </div>
        </div>
      )}
    </div>
  );
}

function ValueCard({ label, value, highlight }) {
  return (
    <div
      style={{
        flex: 1,
        textAlign: "center",
        padding: "0.85rem 0.5rem",
        background: highlight ? "rgba(120,210,255,0.12)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${highlight ? "rgba(120,210,255,0.4)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 10,
      }}
    >
      <div style={{ fontSize: "2rem", fontWeight: 600, marginBottom: "0.2rem" }}>{value}</div>
      <div style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.75 }}>
        {label}
      </div>
    </div>
  );
}
