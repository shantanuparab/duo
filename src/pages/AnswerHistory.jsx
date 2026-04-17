import { useState, useEffect } from "react";
import { getAllCardResponses } from "../firebase";
import { getDeck, getCard } from "../data/cards";
import { PhotoImg } from "../components/PhotoViewer";

function renderAnswer(answer, card) {
  if (answer == null) return <span style={{ color: "var(--text-dim)", fontStyle: "italic" }}>No answer</span>;

  // Choice: "a" or "b"
  if ((answer === "a" || answer === "b") && card) {
    return answer === "a" ? card.a : card.b;
  }

  // Rating number
  if (typeof answer === "number") {
    return "★".repeat(answer) + "☆".repeat(5 - answer);
  }

  // Photo object
  if (typeof answer === "object" && !Array.isArray(answer) && answer?.image) {
    return (
      <div>
        <PhotoImg src={answer.image} className="history-img" />
        {answer.text && <p style={{ marginTop: ".3rem" }}>{answer.text}</p>}
      </div>
    );
  }

  // Array (two truths)
  if (Array.isArray(answer)) {
    return answer.map((s, i) => (
      <p key={i} style={{ marginBottom: ".15rem" }}>
        {i + 1}. {s} {i === 2 && <span style={{ fontSize: ".7rem", color: "var(--danger)" }}>← lie</span>}
      </p>
    ));
  }

  // Plain text
  return answer;
}

export default function AnswerHistory({ room, playerId, roomData, onBack }) {
  const [responses, setResponses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("stack"); // "stack" or "list"
  const [currentIndex, setCurrentIndex] = useState(0);

  const p1 = roomData?.player1;
  const p2 = roomData?.player2;
  const isP1 = playerId === p1?.id;
  const me = isP1 ? p1 : p2;
  const them = isP1 ? p2 : p1;
  const playedCards = roomData?.playedCards || [];

  useEffect(() => {
    getAllCardResponses(room).then((data) => {
      setResponses(data);
      setLoading(false);
    });
  }, [room]);

  // Build list of played cards with their data
  const cards = playedCards.map((cardId) => {
    const cleanId = cardId.startsWith("fav-") ? cardId.replace("fav-", "") : cardId;

    let card = null;
    let deck = null;
    const deckIds = ["wyr", "tot", "daily", "hottake", "spicy", "2truths", "aboutus", "deep", "rate", "challenge"];
    for (const did of deckIds) {
      card = getCard(did, cleanId);
      if (card) { deck = getDeck(did); break; }
    }

    const resp = responses?.[cardId] || {};
    const myAnswer = resp[playerId]?.answer;
    const theirAnswer = them?.id ? resp[them.id]?.answer : undefined;

    return { cardId, card, deck, myAnswer, theirAnswer };
  }).reverse(); // newest first

  function goNext() {
    if (currentIndex < cards.length - 1) setCurrentIndex(currentIndex + 1);
  }

  function goPrev() {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }

  // Touch handling for swipe
  const [touchStart, setTouchStart] = useState(null);
  function handleTouchStart(e) {
    setTouchStart(e.touches[0].clientX);
  }
  function handleTouchEnd(e) {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 50) goNext();
    else if (diff < -50) goPrev();
    setTouchStart(null);
  }

  return (
    <div className="page dateboard fade-in">
      <div className="db-header">
        <button className="btn btn-ghost back-btn" onClick={onBack}>←</button>
        <h2>💬 Our Answers</h2>
      </div>

      {/* View mode toggle + count */}
      <div className="history-controls">
        <span className="db-hint">{playedCards.length} cards played</span>
        <div className="history-toggle">
          <button
            className={`history-toggle-btn ${viewMode === "stack" ? "active" : ""}`}
            onClick={() => setViewMode("stack")}
          >
            🃏 Stack
          </button>
          <button
            className={`history-toggle-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            📋 List
          </button>
        </div>
      </div>

      {loading && <p style={{ color: "var(--text-dim)", textAlign: "center", padding: "2rem" }}>Loading...</p>}

      {!loading && cards.length === 0 && (
        <div className="empty-state">
          <span className="empty-emoji">💬</span>
          <p>No cards played yet</p>
          <p className="empty-sub">Start playing to see your answers here</p>
        </div>
      )}

      {/* STACK VIEW — card-by-card with navigation */}
      {!loading && cards.length > 0 && viewMode === "stack" && (
        <div className="history-stack" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {/* Card counter */}
          <div className="history-counter">
            {currentIndex + 1} / {cards.length}
          </div>

          {/* Current card */}
          {(() => {
            const { cardId, card, deck, myAnswer, theirAnswer } = cards[currentIndex];
            return (
              <div
                className="history-card-stack fade-in"
                key={cardId}
                style={{ borderColor: deck?.color ? deck.color + "44" : "var(--border)" }}
              >
                {deck && (
                  <span className="history-deck" style={{ color: deck.color }}>
                    {deck.emoji} {deck.name}
                  </span>
                )}
                <div className="history-prompt">
                  {card?.prompt || (card?.a ? `${card.a} vs ${card.b}` : cardId)}
                </div>
                <div className="history-answers-stack">
                  <div className="history-answer mine">
                    <span className="history-who">{me?.name}</span>
                    <div className="history-text">{renderAnswer(myAnswer, card)}</div>
                  </div>
                  <div className="history-answer theirs">
                    <span className="history-who">{them?.name}</span>
                    <div className="history-text">{renderAnswer(theirAnswer, card)}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Navigation */}
          <div className="history-nav">
            <button
              className="btn btn-secondary history-nav-btn"
              onClick={goPrev}
              disabled={currentIndex === 0}
            >
              ← Prev
            </button>
            <button
              className="btn btn-secondary history-nav-btn"
              onClick={goNext}
              disabled={currentIndex === cards.length - 1}
            >
              Next →
            </button>
          </div>

          <p className="os-hint" style={{ textAlign: "center", marginTop: ".5rem" }}>Swipe or tap arrows to browse</p>
        </div>
      )}

      {/* LIST VIEW — all cards scrollable */}
      {!loading && cards.length > 0 && viewMode === "list" && (
        <div className="pin-list">
          {cards.map(({ cardId, card, deck, myAnswer, theirAnswer }) => (
            <div key={cardId} className="pin-card fade-in">
              {deck && (
                <span className="history-deck" style={{ color: deck.color }}>
                  {deck.emoji} {deck.name}
                </span>
              )}
              <div className="pin-prompt">{card?.prompt || (card?.a ? `${card.a} vs ${card.b}` : cardId)}</div>
              <div className="pin-answers">
                <div className="pin-answer mine">
                  <span className="pin-who">{me?.name}</span>
                  <div className="pin-text">{renderAnswer(myAnswer, card)}</div>
                </div>
                <div className="pin-answer theirs">
                  <span className="pin-who">{them?.name}</span>
                  <div className="pin-text">{renderAnswer(theirAnswer, card)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
