import { useState } from "react";
import { getChapterById, getCurrentChapter, getNextChapter } from "../data/adventureChapters";
import { getLevel } from "../data/levels";
import PromptRenderer from "../components/prompts/PromptRenderer";
import { submitAdventureAnswer, advanceAdventure } from "../firebase";

// Adventures detail view.
// Day 5 wires real Firestore persistence. Day 6 adds rules-as-code enforcement.
//
// Data path: rooms/{code}/adventures/{chapterId}
//   { currentPromptIndex, answers: {[promptId]: { player1, player2 }}, lastUnlockTs, completed }
//
// In a dev room (roomData.dev), the 24h advance gate is skipped so testing is fast.

export default function Adventures({ room, roomData, playerId, chapterId, chapterData, onSelectChapter, onBack }) {
  const level = getLevel(roomData?.xp ?? 0).level;
  const chapter = (chapterId ? getChapterById(chapterId) : null) || getCurrentChapter(level);
  const nextChapter = getNextChapter(chapter.id);
  const nextChapterUnlocked = nextChapter && nextChapter.unlockLevel <= level;
  const [submitError, setSubmitError] = useState("");
  const [advancing, setAdvancing] = useState(false);
  // Perspective: which player slot you're submitting as. In production this
  // is fixed to whichever slot your playerId matches. In a dev room it can
  // toggle so the founder can fill both sides for testing.
  const isP1 = playerId === roomData?.player1?.id;
  const defaultPerspective = isP1 ? "player1" : "player2";
  const [perspective, setPerspective] = useState(defaultPerspective);
  const isDevRoom = !!roomData?.dev;

  // Hub owns the subscription (eng review 4C) — chapterData arrives via prop.
  // First render renders prompt 0 with no answers (matches the empty-doc state).

  const currentIndex = chapterData?.currentPromptIndex ?? 0;
  const prompt = chapter.prompts[currentIndex];
  const promptAnswers = chapterData?.answers?.[prompt?.id] || {};
  const myAnswer = promptAnswers[perspective]?.value;
  const otherSlot = perspective === "player1" ? "player2" : "player1";
  const partnerAnswer = promptAnswers[otherSlot]?.value;
  const bothSubmitted = myAnswer !== undefined && partnerAnswer !== undefined;
  const isLastPrompt = currentIndex >= chapter.prompts.length - 1;
  const completed = !!chapterData?.completed;

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
        chapterId: chapter.id,
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
        chapter,
        currentPromptIndex: currentIndex,
        currentPrompt: prompt,
        skipTimeGate: isDevRoom,
      });
    } catch (e) {
      setSubmitError(e.message || "Could not advance");
    } finally {
      setAdvancing(false);
    }
  }

  // Compute time-until-unlock label (Day 6 will rely on Firestore time, this is a UX hint).
  const lastUnlockMs = (() => {
    const v = chapterData?.lastUnlockTs;
    if (!v) return 0;
    if (typeof v === "number") return v;
    return v.toMillis?.() ?? 0;
  })();
  const elapsedMs = Date.now() - lastUnlockMs;
  const remainingHours = Math.max(0, Math.ceil((86_400_000 - elapsedMs) / 3_600_000));
  const timeGatePassed = isDevRoom || elapsedMs >= 86_400_000;

  return (
    <div className="page fade-in" style={{ padding: "1rem", maxWidth: 520, margin: "0 auto", color: "var(--text)" }}>
      <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: "0.75rem" }}>
        ← Back
      </button>

      <ChapterHeader chapter={chapter} />

      {isDevRoom && (
        <PerspectiveToggle
          perspective={perspective}
          setPerspective={setPerspective}
          myName={roomData?.player1?.name || "Me"}
          partnerName={roomData?.player2?.name || roomData?.partnerName || "Test Partner"}
        />
      )}

      <PromptCounter currentIndex={currentIndex} total={chapter.prompts.length} completed={completed} />

      {!completed && prompt && (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
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

      {!completed && bothSubmitted && !isLastPrompt && (
        <>
          {!timeGatePassed ? (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.85rem",
                background: "rgba(255,255,255,0.03)",
                border: "1px dashed rgba(255,255,255,0.15)",
                borderRadius: 12,
                textAlign: "center",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ marginBottom: "0.3rem" }}>✨ You both answered.</div>
              <div style={{ opacity: 0.7, fontSize: "0.78rem" }}>
                The next prompt unlocks in ~{remainingHours}h. Come back tomorrow.
              </div>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={advance}
              disabled={advancing}
              style={{ marginTop: "1rem", width: "100%" }}
            >
              {advancing ? "Advancing..." : "Next prompt →"}
            </button>
          )}
        </>
      )}

      {!completed && bothSubmitted && isLastPrompt && timeGatePassed && (
        <button
          className="btn btn-primary"
          onClick={advance}
          disabled={advancing}
          style={{ marginTop: "1rem", width: "100%" }}
        >
          {advancing ? "..." : "Complete Chapter 1 ✨"}
        </button>
      )}

      {completed && (
        <div
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            padding: "1.25rem",
            background: "rgba(255,180,80,0.08)",
            border: "1px solid rgba(255,180,80,0.3)",
            borderRadius: 14,
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🦉</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.4rem" }}>
            You've walked {chapter.title}.
          </div>
          <div style={{ opacity: 0.7, fontSize: "0.8rem", lineHeight: 1.5, marginBottom: nextChapter ? "1rem" : 0 }}>
            {nextChapter && nextChapterUnlocked
              ? `The Owl tips its head. ${nextChapter.title} is ready when you are.`
              : nextChapter
                ? `The Owl tips its head. ${nextChapter.title} unlocks at Level ${nextChapter.unlockLevel}. Keep playing.`
                : "The Owl tips its head. You've walked the whole path."}
          </div>
          {nextChapter && nextChapterUnlocked && onSelectChapter && (
            <button
              className="btn btn-primary"
              onClick={() => onSelectChapter(nextChapter.id)}
              style={{ width: "100%" }}
            >
              Walk {nextChapter.title} →
            </button>
          )}
        </div>
      )}

      <div style={{ marginTop: "1.5rem", textAlign: "center", opacity: 0.45, fontSize: "0.72rem", lineHeight: 1.5 }}>
        Build status: Days 1-12 shipped. Chapter 1 + Chapter 2 + Side Quest live.
        {isDevRoom && " Dev room: 24h gate skipped for testing."}
      </div>
    </div>
  );
}

function ChapterHeader({ chapter }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div
        style={{
          fontSize: "0.7rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          opacity: 0.65,
          marginBottom: "0.3rem",
        }}
      >
        🦉 Adventures
      </div>
      <h2 style={{ margin: "0 0 0.3rem", fontSize: "1.3rem" }}>{chapter.title}</h2>
      <div style={{ fontSize: "0.78rem", opacity: 0.65, marginBottom: "0.5rem" }}>
        {chapter.subtitle}
      </div>
      <div style={{ fontSize: "0.72rem", opacity: 0.55 }}>
        {chapter.framework} ·{" "}
        <a href={chapter.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
          source
        </a>
      </div>
    </div>
  );
}

function PerspectiveToggle({ perspective, setPerspective, myName, partnerName }) {
  return (
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
      <span
        style={{
          fontSize: "0.65rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          opacity: 0.65,
          alignSelf: "center",
          paddingLeft: "0.35rem",
        }}
      >
        🧪 Acting as
      </span>
      {[
        { key: "player1", label: myName },
        { key: "player2", label: partnerName },
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
  );
}

function PromptCounter({ currentIndex, total, completed }) {
  return (
    <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center", marginTop: "0.25rem" }}>
      {Array.from({ length: total }).map((_, i) => {
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
                ? "rgba(255,180,80,0.7)"
                : isCurrent
                  ? "rgba(255,255,255,0.6)"
                  : "rgba(255,255,255,0.12)",
            }}
          />
        );
      })}
    </div>
  );
}
