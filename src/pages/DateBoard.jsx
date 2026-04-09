import { useState, useEffect } from "react";
import { subscribePins, unpinAnswer } from "../firebase";
import { getCard } from "../data/cards";

function renderPinAnswer(answer, pin) {
  if (answer == null) return null;

  // Photo object: { text, image }
  if (typeof answer === "object" && !Array.isArray(answer) && answer.image) {
    return (
      <div>
        <img src={answer.image} className="pin-img" alt="" />
        {answer.text && <p style={{ marginTop: ".3rem" }}>{answer.text}</p>}
      </div>
    );
  }

  // Rating number
  if (typeof answer === "number") {
    return "★".repeat(answer) + "☆".repeat(5 - answer);
  }

  // Array (two truths)
  if (Array.isArray(answer)) {
    return answer.map((s, i) => <p key={i}>{i + 1}. {s}</p>);
  }

  // Choice: "a" or "b" — resolve to actual option text
  if (answer === "a" || answer === "b") {
    const card = pin.deckId ? getCard(pin.deckId, pin.cardId) : null;
    if (card) return answer === "a" ? card.a : card.b;
    return answer === "a" ? "Option A" : "Option B";
  }

  // Plain text
  return answer;
}

export default function DateBoard({ room, playerId, p1, p2, onBack }) {
  const [pins, setPins] = useState([]);

  const isP1 = playerId === p1?.id;
  const myName = isP1 ? p1?.name : p2?.name;
  const theirName = isP1 ? p2?.name : p1?.name;

  useEffect(() => {
    return subscribePins(room, setPins);
  }, [room]);

  async function handleUnpin(cardId) {
    await unpinAnswer(room, cardId);
  }

  return (
    <div className="page dateboard fade-in">
      <div className="db-header">
        <button className="btn btn-ghost back-btn" onClick={onBack}>←</button>
        <h2>📌 Date Board</h2>
      </div>

      <p className="db-hint">
        Pinned answers from your games — use these to plan the perfect date
      </p>

      {pins.length === 0 && (
        <div className="empty-state">
          <span className="empty-emoji">📌</span>
          <p>Nothing pinned yet</p>
          <p className="empty-sub">Play some cards and pin the answers you want to remember</p>
        </div>
      )}

      <div className="pin-list">
        {pins.map((pin) => (
          <div key={pin.id} className="pin-card fade-in">
            {pin.type && <span className="pin-type">{
              pin.type === "photo" ? "📸" : pin.type === "choice" ? "🤔" : pin.type === "thisorthat" ? "⚡" :
              pin.type === "hottake" ? "🔥" : pin.type === "rate" ? "⭐" : "💬"
            }</span>}
            <div className="pin-prompt">{pin.prompt}</div>
            <div className="pin-answers">
              {pin.myAnswer != null && (
                <div className="pin-answer mine">
                  <span className="pin-who">{pin.myName || myName}</span>
                  <div className="pin-text">{renderPinAnswer(pin.myAnswer, pin)}</div>
                </div>
              )}
              {pin.theirAnswer != null && (
                <div className="pin-answer theirs">
                  <span className="pin-who">{pin.theirName || theirName}</span>
                  <div className="pin-text">{renderPinAnswer(pin.theirAnswer, pin)}</div>
                </div>
              )}
            </div>
            <button className="unpin-btn" onClick={() => handleUnpin(pin.id)} title="Unpin">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
