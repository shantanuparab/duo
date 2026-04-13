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
    // Skip favorites replays for cleaner history
    const cleanId = cardId.startsWith("fav-") ? cardId.replace("fav-", "") : cardId;

    // Try to find the card in decks
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

  return (
    <div className="page dateboard fade-in">
      <div className="db-header">
        <button className="btn btn-ghost back-btn" onClick={onBack}>←</button>
        <h2>💬 Our Answers</h2>
      </div>
      <p className="db-hint">{playedCards.length} cards played</p>

      {loading && <p style={{ color: "var(--text-dim)", textAlign: "center", padding: "2rem" }}>Loading...</p>}

      {!loading && cards.length === 0 && (
        <div className="empty-state">
          <span className="empty-emoji">💬</span>
          <p>No cards played yet</p>
          <p className="empty-sub">Start playing to see your answers here</p>
        </div>
      )}

      {!loading && (
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
