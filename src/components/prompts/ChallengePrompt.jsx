// Challenge prompt — real-world action, honor-system.
// Both partners press "we did it" to advance. If they disagree, a soft
// follow-up exchange surfaces (Day 5+ wires that conflict path).

export default function ChallengePrompt({ prompt, myAnswer, partnerAnswer, partnerName, myName, onSubmit, readOnly }) {
  const myDone = myAnswer === true;
  const partnerDone = partnerAnswer === true;
  const bothDone = myDone && partnerDone;

  return (
    <div style={{ padding: "1rem 0" }}>
      <div
        style={{
          fontSize: "0.7rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--accent)",
          marginBottom: "0.5rem",
          opacity: 0.85,
        }}
      >
        Real-world challenge
      </div>
      <div
        style={{
          fontSize: "1rem",
          lineHeight: 1.55,
          marginBottom: "1rem",
          padding: "0.85rem 1rem",
          background: "rgba(255,180,80,0.06)",
          border: "1px solid rgba(255,180,80,0.2)",
          borderRadius: 12,
        }}
      >
        {prompt.baseText}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <ConfirmCard label={myName} done={myDone} highlight />
        <ConfirmCard label={partnerName} done={partnerDone} />
      </div>

      {!myDone && !readOnly && (
        <button
          className="btn btn-primary"
          onClick={() => onSubmit(true)}
          style={{ width: "100%" }}
        >
          ✓ We did it
        </button>
      )}

      {myDone && !bothDone && (
        <div style={{ textAlign: "center", padding: "0.5rem", opacity: 0.7, fontSize: "0.85rem" }}>
          Confirmed. Waiting for {partnerName} to confirm too.
        </div>
      )}

      {bothDone && (
        <div
          style={{
            textAlign: "center",
            padding: "0.85rem",
            background: "rgba(255,180,80,0.08)",
            border: "1px solid rgba(255,180,80,0.3)",
            borderRadius: 12,
            fontSize: "0.9rem",
          }}
        >
          🎉 Both of you confirmed it. The path opens further.
        </div>
      )}
    </div>
  );
}

function ConfirmCard({ label, done, highlight }) {
  return (
    <div
      style={{
        flex: 1,
        textAlign: "center",
        padding: "0.85rem 0.5rem",
        background: done
          ? "rgba(255,180,80,0.15)"
          : highlight
            ? "rgba(255,255,255,0.04)"
            : "rgba(255,255,255,0.02)",
        border: `1px solid ${done ? "rgba(255,180,80,0.5)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 10,
      }}
    >
      <div style={{ fontSize: "1.4rem", marginBottom: "0.2rem" }}>{done ? "✓" : "○"}</div>
      <div style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.75 }}>
        {label}
      </div>
    </div>
  );
}
