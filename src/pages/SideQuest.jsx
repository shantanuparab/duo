import { useState, useEffect } from "react";
import { SIDE_QUEST_REPAIR } from "../data/adventureChapters";
import PromptRenderer from "../components/prompts/PromptRenderer";
import { subscribeAdventure, submitAdventureAnswer, advanceAdventure } from "../firebase";

// Side Quest detail view. Same data shape as Adventures chapter, but no
// 24h advance gate — Side Quests are meant to happen contiguously, in the
// moment something is off.

export default function SideQuest({ room, roomData, playerId, sessionId, onBack }) {
  const sideQuest = SIDE_QUEST_REPAIR;
  const [questData, setQuestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [advancing, setAdvancing] = useState(false);

  const isP1 = playerId === roomData?.player1?.id;
  const defaultPerspective = isP1 ? "player1" : "player2";
  const [perspective, setPerspective] = useState(defaultPerspective);
  const isDevRoom = !!roomData?.dev;

  useEffect(() => {
    if (!room || !sessionId) return;
    setLoading(true);
    const unsub = subscribeAdventure(room, sessionId, (data) => {
      setQuestData(data);
      setLoading(false);
    });
    return unsub;
  }, [room, sessionId]);

  const currentIndex = questData?.currentPromptIndex ?? 0;
  const prompt = sideQuest.prompts[currentIndex];
  const promptAnswers = questData?.answers?.[prompt?.id] || {};
  const myAnswer = promptAnswers[perspective]?.value;
  const otherSlot = perspective === "player1" ? "player2" : "player1";
  const partnerAnswer = promptAnswers[otherSlot]?.value;
  const bothSubmitted = myAnswer !== undefined && partnerAnswer !== undefined;
  const isLastPrompt = currentIndex >= sideQuest.prompts.length - 1;
  const completed = !!questData?.completed;

  const myName = perspective === "player1"
    ? (roomData?.player1?.name || "Me")
    : (roomData?.player2?.name || roomData?.partnerName || "Test Partner");
  const otherName = otherSlot === "player1"
    ? (roomData?.player1?.name || "Me")
    : (roomData?.player2?.name || roomData?.partnerName || "Test Partner");

  async function submit(value) {
    setSubmitError("");
    try {
      await submitAdventureAnswer({
        code: room,
        chapterId: sessionId,
        prompt,
        playerSlot: perspective,
        answer: value,
      });
    } catch (e) {
      setSubmitError(e.message || "Could not save your answer");
    }
  }

  async function advance() {
    if (advancing) return;
    setAdvancing(true);
    setSubmitError("");
    try {
      await advanceAdventure({
        code: room,
        chapter: { ...sideQuest, id: sessionId },
        currentPromptIndex: currentIndex,
        currentPrompt: prompt,
        skipTimeGate: true, // Side Quests have no 24h gate
      });
    } catch (e) {
      setSubmitError(e.message || "Could not advance");
    } finally {
      setAdvancing(false);
    }
  }

  return (
    <div className="page fade-in" style={{ padding: "1rem", maxWidth: 520, margin: "0 auto", color: "var(--text)" }}>
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: "0.75rem" }}>
        ← Back
      </button>

      <div style={{ marginBottom: "1.25rem" }}>
        <div
          style={{
            fontSize: "0.7rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.65,
            marginBottom: "0.3rem",
            color: "rgba(170,140,255,0.95)",
          }}
        >
          🌙 Side Quest
        </div>
        <h2 style={{ margin: "0 0 0.3rem", fontSize: "1.3rem" }}>{sideQuest.title}</h2>
        <div style={{ fontSize: "0.85rem", lineHeight: 1.5, opacity: 0.8, marginBottom: "0.5rem" }}>
          {sideQuest.description}
        </div>
        <div style={{ fontSize: "0.72rem", opacity: 0.55 }}>
          {sideQuest.framework} ·{" "}
          <a href={sideQuest.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
            source
          </a>
        </div>
      </div>

      {isDevRoom && (
        <div
          style={{
            display: "flex",
            gap: "0.4rem",
            background: "rgba(255,255,255,0.04)",
            border: "1px dashed rgba(255,180,80,0.3)",
            borderRadius: 10,
            padding: "0.4rem",
            marginBottom: "0.75rem",
          }}
        >
          <span style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.65, alignSelf: "center", paddingLeft: "0.35rem" }}>
            🧪 Acting as
          </span>
          {[
            { key: "player1", label: roomData?.player1?.name || "Me" },
            { key: "player2", label: roomData?.player2?.name || roomData?.partnerName || "Test Partner" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setPerspective(opt.key)}
              style={{
                flex: 1,
                padding: "0.4rem 0.5rem",
                background: perspective === opt.key ? "rgba(255,180,80,0.2)" : "transparent",
                border: `1px solid ${perspective === opt.key ? "rgba(255,180,80,0.4)" : "transparent"}`,
                color: "inherit",
                borderRadius: 7,
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center", marginTop: "0.25rem" }}>
        {sideQuest.prompts.map((_, i) => {
          const isDone = completed || i < currentIndex;
          const isCurrent = !completed && i === currentIndex;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                maxWidth: 18,
                height: 4,
                borderRadius: 2,
                background: isDone
                  ? "rgba(170,140,255,0.7)"
                  : isCurrent
                    ? "rgba(255,255,255,0.6)"
                    : "rgba(255,255,255,0.12)",
              }}
            />
          );
        })}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "2rem", opacity: 0.6, fontSize: "0.85rem" }}>
          Loading the quest...
        </div>
      )}

      {!loading && !completed && prompt && (
        <div
          style={{
            background: "rgba(170,140,255,0.04)",
            border: "1px solid rgba(170,140,255,0.15)",
            borderRadius: 14,
            padding: "0.5rem 1rem",
            marginTop: "0.75rem",
          }}
        >
          <PromptRenderer
            prompt={prompt}
            myAnswer={myAnswer}
            partnerAnswer={partnerAnswer}
            myName={myName}
            partnerName={otherName}
            onSubmit={submit}
          />
        </div>
      )}

      {submitError && (
        <div
          style={{
            marginTop: "0.75rem",
            padding: "0.6rem 0.85rem",
            background: "rgba(255,100,100,0.08)",
            border: "1px solid rgba(255,100,100,0.3)",
            borderRadius: 10,
            fontSize: "0.8rem",
            color: "rgba(255,180,180,0.95)",
          }}
        >
          {submitError}
        </div>
      )}

      {!loading && !completed && bothSubmitted && (
        <button
          className="btn btn-primary"
          onClick={advance}
          disabled={advancing}
          style={{ marginTop: "1rem", width: "100%" }}
        >
          {advancing ? "..." : isLastPrompt ? "Complete Side Quest 🌙" : "Next →"}
        </button>
      )}

      {completed && (
        <div
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            padding: "1.25rem",
            background: "rgba(170,140,255,0.1)",
            border: "1px solid rgba(170,140,255,0.3)",
            borderRadius: 14,
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🌙</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.4rem" }}>
            You walked through it together.
          </div>
          <div style={{ opacity: 0.7, fontSize: "0.8rem", lineHeight: 1.5 }}>
            Side Quests stay in your history. Take a breath.
          </div>
        </div>
      )}
    </div>
  );
}
