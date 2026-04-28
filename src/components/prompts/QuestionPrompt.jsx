import { useState } from "react";

// Question prompt — both partners write a text answer.
// Hidden until both submit. Then both reveal with author labels.
export default function QuestionPrompt({ prompt, myAnswer, partnerAnswer, partnerName, myName, onSubmit, readOnly }) {
  const [draft, setDraft] = useState("");
  const submitted = !!myAnswer;
  const partnerSubmitted = !!partnerAnswer;
  const bothSubmitted = submitted && partnerSubmitted;

  return (
    <div style={{ padding: "1rem 0" }}>
      <PromptHeader baseText={prompt.baseText} />

      {!submitted && !readOnly && (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write your answer..."
            rows={4}
            style={textareaStyle}
            autoFocus
          />
          <button
            className="btn btn-primary"
            disabled={draft.trim().length === 0}
            onClick={() => onSubmit(draft.trim())}
            style={{ marginTop: "0.5rem", width: "100%" }}
          >
            Submit answer
          </button>
        </>
      )}

      {submitted && !bothSubmitted && (
        <div style={waitingStyle}>
          <div style={{ marginBottom: "0.4rem" }}>✓ Submitted. Waiting for {partnerName}...</div>
          <div style={{ opacity: 0.6, fontSize: "0.78rem", fontStyle: "italic" }}>
            "{myAnswer}"
          </div>
        </div>
      )}

      {bothSubmitted && (
        <div style={revealContainerStyle}>
          <RevealCard label={myName} answer={myAnswer} highlight />
          <RevealCard label={partnerName} answer={partnerAnswer} />
        </div>
      )}
    </div>
  );
}

function PromptHeader({ baseText }) {
  return (
    <div style={{ fontSize: "0.95rem", lineHeight: 1.55, marginBottom: "1rem", color: "var(--text)" }}>
      {baseText}
    </div>
  );
}

function RevealCard({ label, answer, highlight }) {
  return (
    <div
      style={{
        background: highlight ? "rgba(255,180,80,0.08)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${highlight ? "rgba(255,180,80,0.3)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: 12,
        padding: "0.75rem 0.85rem",
        marginBottom: "0.5rem",
      }}
    >
      <div style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.6, marginBottom: "0.3rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>{answer}</div>
    </div>
  );
}

const textareaStyle = {
  width: "100%",
  padding: "0.7rem",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  color: "var(--text)",
  fontSize: "0.9rem",
  fontFamily: "inherit",
  resize: "vertical",
  minHeight: 80,
};

const waitingStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px dashed rgba(255,255,255,0.12)",
  borderRadius: 12,
  padding: "0.85rem",
  fontSize: "0.85rem",
  textAlign: "center",
};

const revealContainerStyle = { marginTop: "0.5rem" };

export { RevealCard };
