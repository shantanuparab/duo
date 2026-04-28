import { useState } from "react";
import { RevealCard } from "./QuestionPrompt";

// Exchange prompt — both write privately, reveal SIMULTANEOUSLY when both submit.
// The timed-reveal beat is the differentiator: you don't see what they wrote
// until the moment they don't see what you wrote.
export default function ExchangePrompt({ prompt, myAnswer, partnerAnswer, partnerName, myName, onSubmit, readOnly }) {
  const [draft, setDraft] = useState("");
  const submitted = !!myAnswer;
  const partnerSubmitted = !!partnerAnswer;
  const bothSubmitted = submitted && partnerSubmitted;

  return (
    <div style={{ padding: "1rem 0" }}>
      <div
        style={{
          fontSize: "0.7rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "rgba(170,140,255,0.95)",
          marginBottom: "0.5rem",
          opacity: 0.9,
        }}
      >
        Exchange · Reveal at the same time
      </div>
      <div style={{ fontSize: "0.95rem", lineHeight: 1.55, marginBottom: "1rem" }}>
        {prompt.baseText}
      </div>

      {!submitted && !readOnly && (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write your answer (they won't see it until they've written theirs)..."
            rows={5}
            style={{
              width: "100%",
              padding: "0.7rem",
              background: "rgba(170,140,255,0.04)",
              border: "1px solid rgba(170,140,255,0.2)",
              borderRadius: 10,
              color: "var(--text)",
              fontSize: "0.9rem",
              fontFamily: "inherit",
              resize: "vertical",
              minHeight: 100,
            }}
            autoFocus
          />
          <button
            className="btn btn-primary"
            disabled={draft.trim().length === 0}
            onClick={() => onSubmit(draft.trim())}
            style={{ marginTop: "0.5rem", width: "100%" }}
          >
            Submit · Lock in
          </button>
        </>
      )}

      {submitted && !bothSubmitted && (
        <div
          style={{
            background: "rgba(170,140,255,0.06)",
            border: "1px dashed rgba(170,140,255,0.3)",
            borderRadius: 12,
            padding: "0.85rem",
            textAlign: "center",
            fontSize: "0.85rem",
          }}
        >
          <div style={{ marginBottom: "0.4rem" }}>🔒 Locked in. Waiting for {partnerName} to write theirs...</div>
          <div style={{ opacity: 0.55, fontSize: "0.78rem", fontStyle: "italic" }}>
            Yours stays hidden until they submit.
          </div>
        </div>
      )}

      {bothSubmitted && (
        <div style={{ marginTop: "0.5rem" }}>
          <div
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              opacity: 0.7,
              marginBottom: "0.5rem",
              textAlign: "center",
            }}
          >
            ✨ Reveal
          </div>
          <RevealCard label={myName} answer={myAnswer} highlight />
          <RevealCard label={partnerName} answer={partnerAnswer} />
        </div>
      )}
    </div>
  );
}
