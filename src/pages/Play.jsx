import { useState, useEffect, useRef } from "react";
import { subscribeCard, submitAnswer, submitRating, submitGuess, clearCurrentCard, pinAnswer, toggleFavorite } from "../firebase";
import { getDeck, getCard } from "../data/cards";
import PixelChar, { DEFAULT_CHAR } from "../components/PixelChar";
import confetti from "canvas-confetti";

const XP_MAP = { choice: 10, thisorthat: 5, text: 15, photo: 20, hottake: 15, twoTruths: 20, rate: 10 };

// Resize image to max 400px and return base64
function resizeImage(file, maxSize = 400) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxSize) { h *= maxSize / w; w = maxSize; } }
        else { if (h > maxSize) { w *= maxSize / h; h = maxSize; } }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function Play({ room, playerId, roomData, customCards = [], favorites = [], onBack }) {
  const [cardData, setCardData] = useState({});
  const [answer, setAnswer] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);
  const [twoTruthsInput, setTwoTruthsInput] = useState(["", "", ""]);
  const [ratingInput, setRatingInput] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [faved, setFaved] = useState(false);
  const [lieGuess, setLieGuess] = useState(null); // index 0-2 of which statement I think is the lie
  const fileRef = useRef(null);

  const cur = roomData?.currentCard;
  const p1 = roomData?.player1;
  const p2 = roomData?.player2;
  const isP1 = playerId === p1?.id;
  const me = isP1 ? p1 : p2;
  const them = isP1 ? p2 : p1;
  const partnerId = them?.id;

  // Resolve the card — could be from a standard deck or custom
  let deck = cur ? getDeck(cur.deckId) : null;
  let card = cur ? getCard(cur.deckId, cur.cardId) : null;

  // Check custom cards
  if (!card && cur) {
    const customCard = customCards.find((c) => c.id === cur.cardId);
    if (customCard) {
      card = customCard;
      deck = { id: "custom", name: "Custom", emoji: "✏️", color: "#f472b6", description: "Your cards" };
    }
  }

  // Check favorites replay (cardId starts with "fav-")
  if (!card && cur?.cardId?.startsWith("fav-")) {
    const origId = cur.cardId.replace("fav-", "");
    const fav = favorites.find((f) => f.cardId === origId);
    if (fav) {
      card = { id: cur.cardId, type: fav.type || "text", prompt: fav.prompt };
      deck = deck || { id: "favorites", name: "Favorites", emoji: "❤️", color: "#f43f5e", description: "Replay" };
    }
  }

  const myAnswer = cardData?.[playerId]?.answer;
  const theirAnswer = partnerId ? cardData?.[partnerId]?.answer : null;
  const bothDone = myAnswer !== undefined && theirAnswer !== undefined;
  const myRatingGiven = cardData?.[`${playerId}_rating`];
  const theirRating = cardData?.[`${partnerId}_rating`];
  const myGuess = cardData?.[`${playerId}_guess`];
  const theirGuess = cardData?.[`${partnerId}_guess`];
  const bothGuessed = myGuess !== undefined && theirGuess !== undefined;

  // Check if already faved
  useEffect(() => {
    if (cur?.cardId) {
      const isFav = favorites.some((f) => f.cardId === cur.cardId || f.cardId === cur.cardId.replace("fav-", ""));
      setFaved(isFav);
    }
  }, [cur?.cardId, favorites]);

  useEffect(() => {
    if (!room || !cur?.cardId) return;
    return subscribeCard(room, cur.cardId, setCardData);
  }, [room, cur?.cardId]);

  // Auto-reveal: for twoTruths, wait until both have guessed
  const isTwoTruths = card?.type === "twoTruths";
  const canReveal = bothDone && (isTwoTruths ? bothGuessed : true);

  useEffect(() => {
    if (canReveal && !revealed) {
      setTimeout(() => {
        setRevealed(true);
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
      }, 400);
    }
  }, [canReveal, revealed]);

  async function handleSubmit(val) {
    const a = val !== undefined ? val : answer;
    if (a === "" || a === undefined) return;
    setSubmitting(true);
    await submitAnswer(room, cur.cardId, playerId, a);
    setSubmitting(false);
  }

  async function handleSubmitPhoto() {
    if (!photoPreview && !answer.trim()) return;
    setSubmitting(true);
    // Send photo as base64 or text description
    const payload = photoPreview ? { text: answer.trim(), image: photoPreview } : answer.trim();
    await submitAnswer(room, cur.cardId, playerId, payload);
    setSubmitting(false);
  }

  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await resizeImage(file);
    setPhotoPreview(base64);
  }

  async function handleSubmitTwoTruths() {
    if (twoTruthsInput.some((t) => !t.trim())) return;
    setSubmitting(true);
    await submitAnswer(room, cur.cardId, playerId, twoTruthsInput);
    setSubmitting(false);
  }

  async function handleSubmitRate() {
    if (ratingInput === 0) return;
    setSubmitting(true);
    await submitAnswer(room, cur.cardId, playerId, ratingInput);
    setSubmitting(false);
  }

  async function handleRatePartner(stars) {
    setMyRating(stars);
    await submitRating(room, cur.cardId, playerId, stars);
  }

  async function handleLieGuess(index) {
    setLieGuess(index);
    await submitGuess(room, cur.cardId, playerId, index);
  }

  async function handleNext() {
    const xp = XP_MAP[card?.type] || 10;
    await clearCurrentCard(room, cur.cardId, xp);
    setRevealed(false);
    setAnswer("");
    setPhotoPreview(null);
    setTwoTruthsInput(["", "", ""]);
    setRatingInput(0);
    setMyRating(0);
    setPinned(false);
    setLieGuess(null);
    onBack();
  }

  async function handlePin() {
    if (pinned) return;
    setPinned(true);
    await pinAnswer(room, {
      cardId: cur.cardId,
      deckId: cur.deckId,
      prompt: card?.prompt || (card?.a + " vs " + card?.b),
      type: card?.type,
      myName: me?.name,
      theirName: them?.name,
      myAnswer,
      theirAnswer,
    });
  }

  async function handleFav() {
    const origId = cur.cardId.replace("fav-", "");
    const result = await toggleFavorite(room, origId, cur.deckId, card?.prompt || (card?.a + " vs " + card?.b), card?.type);
    setFaved(result);
  }

  if (!card || !deck) return null;

  // Helper to render an answer (handles text, photo objects, arrays, choices)
  function renderAnswer(ans, isChoice) {
    if (isChoice) return ans === "a" ? card.a : card.b;
    if (typeof ans === "number") return "★".repeat(ans) + "☆".repeat(5 - ans);
    if (typeof ans === "object" && ans?.image) {
      return (
        <div>
          <img src={ans.image} className="reveal-img" alt="" />
          {ans.text && <p style={{ marginTop: ".4rem" }}>{ans.text}</p>}
        </div>
      );
    }
    if (Array.isArray(ans)) {
      return ans.map((s, i) => (
        <p key={i} className="tt-statement">{i + 1}. {s} {i === 2 && <span className="lie-tag">← the lie</span>}</p>
      ));
    }
    return ans;
  }

  const isChoice = card.type === "choice" || card.type === "thisorthat";

  return (
    <div className="page play fade-in">
      {/* Header — back button when waiting */}
      <div className="play-header">
        {myAnswer !== undefined && !bothDone && (
          <button className="btn btn-ghost back-btn" onClick={onBack} style={{ marginRight: ".5rem" }}>← Hub</button>
        )}
        <span className="deck-badge" style={{ background: deck.color + "22", color: deck.color }}>
          {deck.emoji} {deck.name}
        </span>
      </div>

      {/* Card */}
      <div className="play-card" style={{ borderColor: deck.color + "33" }}>
        <div className="card-type" style={{ color: deck.color }}>
          {card.type === "choice" && "Would You Rather"}
          {card.type === "thisorthat" && "This or That"}
          {card.type === "text" && "Open Card"}
          {card.type === "photo" && "📸 Challenge"}
          {card.type === "hottake" && "🔥 Hot Take"}
          {card.type === "twoTruths" && "🎭 2 Truths 1 Lie"}
          {card.type === "rate" && "⭐ Rate This"}
        </div>

        {card.prompt && <h2 className="play-prompt">{card.prompt}</h2>}

        {/* === ANSWER INPUT === */}
        {myAnswer === undefined && (
          <div className="play-input fade-in">

            {/* Choice / This or That */}
            {isChoice && (
              <div className="choice-buttons">
                <button className="choice-btn a" onClick={() => handleSubmit("a")} disabled={submitting}>{card.a}</button>
                <span className="choice-or">or</span>
                <button className="choice-btn b" onClick={() => handleSubmit("b")} disabled={submitting}>{card.b}</button>
              </div>
            )}

            {/* Text */}
            {card.type === "text" && (
              <>
                <textarea className="input textarea" placeholder="Your answer..." value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} maxLength={500} />
                <button className="btn btn-primary" onClick={() => handleSubmit()} disabled={submitting || !answer.trim()}>
                  {submitting ? "..." : "Submit"}
                </button>
              </>
            )}

            {/* Photo challenge — photo is required */}
            {card.type === "photo" && (
              <>
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: "none" }} />
                {!photoPreview && (
                  <div className="photo-picker-row">
                    <button className="btn btn-secondary photo-btn" onClick={() => { fileRef.current?.setAttribute("capture", "environment"); fileRef.current?.click(); }}>
                      📷 Camera
                    </button>
                    <button className="btn btn-secondary photo-btn" onClick={() => { fileRef.current?.removeAttribute("capture"); fileRef.current?.click(); }}>
                      🖼️ Gallery
                    </button>
                  </div>
                )}
                {!photoPreview && <p className="play-hint">A photo is required for this challenge</p>}
                {photoPreview && (
                  <>
                    <img src={photoPreview} className="photo-preview" alt="preview" />
                    <button className="btn btn-ghost" onClick={() => setPhotoPreview(null)} style={{ fontSize: ".8rem" }}>Remove photo</button>
                  </>
                )}
                <textarea className="input textarea" placeholder="Add a caption (optional)..." value={answer} onChange={(e) => setAnswer(e.target.value)} rows={2} maxLength={300} />
                <button className="btn btn-primary" onClick={handleSubmitPhoto} disabled={submitting || !photoPreview}>
                  {submitting ? "..." : "Submit"}
                </button>
              </>
            )}

            {/* Hot take */}
            {card.type === "hottake" && (
              <>
                <textarea className="input textarea" placeholder="Drop your hottest take..." value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} maxLength={300} />
                <button className="btn btn-primary" onClick={() => handleSubmit()} disabled={submitting || !answer.trim()}>
                  {submitting ? "..." : "Drop It 🔥"}
                </button>
              </>
            )}

            {/* Two truths */}
            {card.type === "twoTruths" && (
              <>
                <p className="play-hint">Write 2 truths and 1 lie (they'll guess which is the lie)</p>
                {[0, 1, 2].map((i) => (
                  <input key={i} className="input" placeholder={i < 2 ? `Statement ${i + 1}` : "The lie..."} value={twoTruthsInput[i]} onChange={(e) => { const n = [...twoTruthsInput]; n[i] = e.target.value; setTwoTruthsInput(n); }} maxLength={150} />
                ))}
                <button className="btn btn-primary" onClick={handleSubmitTwoTruths} disabled={submitting || twoTruthsInput.some((t) => !t.trim())}>
                  {submitting ? "..." : "Submit"}
                </button>
              </>
            )}

            {/* Rate */}
            {card.type === "rate" && (
              <div className="rate-input">
                <div className="star-row">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} className={`star-btn ${ratingInput >= s ? "filled" : ""}`} onClick={() => setRatingInput(s)}>★</button>
                  ))}
                </div>
                <button className="btn btn-primary" onClick={handleSubmitRate} disabled={submitting || ratingInput === 0}>
                  {submitting ? "..." : "Lock In"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* === WAITING === */}
        {myAnswer !== undefined && !bothDone && (
          <div className="play-waiting fade-in">
            <PixelChar config={them?.character || DEFAULT_CHAR} state="thinking" size={4} />
            <p>Waiting for {them?.name || "them"}...</p>
            <p className="play-waiting-sub">Your answer is hidden until they respond</p>
          </div>
        )}

        {/* === 2 TRUTHS GUESSING PHASE === */}
        {isTwoTruths && bothDone && !bothGuessed && (
          <div className="tt-guess fade-in">
            {myGuess === undefined ? (
              <>
                <h3 className="tt-guess-title">Which one is {them?.name}'s lie?</h3>
                <p className="play-hint">Tap the statement you think is false</p>
                <div className="tt-statements">
                  {Array.isArray(theirAnswer) && theirAnswer.map((s, i) => (
                    <button
                      key={i}
                      className={`tt-stmt-btn ${lieGuess === i ? "selected" : ""}`}
                      onClick={() => handleLieGuess(i)}
                    >
                      <span className="tt-stmt-num">{i + 1}</span>
                      <span className="tt-stmt-text">{s}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="play-waiting">
                <PixelChar config={them?.character || DEFAULT_CHAR} state="thinking" size={4} />
                <p>You picked #{myGuess + 1} as the lie</p>
                <p className="play-waiting-sub">Waiting for {them?.name} to guess yours...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* === REVEAL === */}
      {revealed && (
        <div className="reveal-section fade-in">
          {/* Match indicator for choice/rate */}
          {isChoice && (
            <div className="reveal-match">
              <div className={`reveal-choice ${myAnswer === theirAnswer ? "match" : "diff"}`}>
                {myAnswer === theirAnswer ? "You matched! 🎉" : "Different picks!"}
              </div>
            </div>
          )}
          {card.type === "rate" && (
            <div className="reveal-match">
              <div className={`reveal-choice ${Math.abs(myAnswer - theirAnswer) <= 1 ? "match" : "diff"}`}>
                {Math.abs(myAnswer - theirAnswer) <= 1 ? "So close! 🎯" : "Big gap! 😂"}
              </div>
            </div>
          )}

          {/* Answers — special layout for twoTruths */}
          {isTwoTruths ? (
            <div className="tt-results">
              {/* Their statements + my guess */}
              <div className="tt-result-card">
                <span className="reveal-who">{them?.name}'s statements</span>
                {Array.isArray(theirAnswer) && theirAnswer.map((s, i) => {
                  const isLie = i === 2;
                  const iGuessedThis = myGuess === i;
                  const correct = iGuessedThis && isLie;
                  return (
                    <div key={i} className={`tt-result-stmt ${isLie ? "is-lie" : "is-truth"} ${iGuessedThis ? (correct ? "guess-correct" : "guess-wrong") : ""}`}>
                      <span className="tt-result-num">{i + 1}.</span>
                      <span className="tt-result-text">{s}</span>
                      {isLie && <span className="tt-tag lie">LIE</span>}
                      {!isLie && <span className="tt-tag truth">TRUTH</span>}
                      {iGuessedThis && <span className="tt-tag guess">{correct ? "✓ You got it!" : "✗ Your guess"}</span>}
                    </div>
                  );
                })}
                <p className="tt-verdict">{myGuess === 2 ? "🎉 You caught the lie!" : "😅 They fooled you!"}</p>
              </div>

              {/* My statements + their guess */}
              <div className="tt-result-card partner">
                <span className="reveal-who partner-who">{me?.name}'s statements</span>
                {Array.isArray(myAnswer) && myAnswer.map((s, i) => {
                  const isLie = i === 2;
                  const theyGuessedThis = theirGuess === i;
                  const correct = theyGuessedThis && isLie;
                  return (
                    <div key={i} className={`tt-result-stmt ${isLie ? "is-lie" : "is-truth"} ${theyGuessedThis ? (correct ? "guess-correct" : "guess-wrong") : ""}`}>
                      <span className="tt-result-num">{i + 1}.</span>
                      <span className="tt-result-text">{s}</span>
                      {isLie && <span className="tt-tag lie">LIE</span>}
                      {!isLie && <span className="tt-tag truth">TRUTH</span>}
                      {theyGuessedThis && <span className="tt-tag guess">{correct ? "✓ They got it!" : "✗ Their guess"}</span>}
                    </div>
                  );
                })}
                <p className="tt-verdict">{theirGuess === 2 ? "😱 They caught your lie!" : "😎 You fooled them!"}</p>
              </div>
            </div>
          ) : (
            <div className={isChoice || card.type === "rate" ? "reveal-picks" : "reveal-texts"}>
              <div className={isChoice || card.type === "rate" ? "reveal-pick" : "reveal-card"}>
                <span className="reveal-who">{me?.name}</span>
                <div className="reveal-text">{renderAnswer(myAnswer, isChoice)}</div>
              </div>
              <div className={isChoice || card.type === "rate" ? "reveal-pick partner" : "reveal-card partner"}>
                <span className="reveal-who">{them?.name}</span>
                <div className="reveal-text">{renderAnswer(theirAnswer, isChoice)}</div>
              </div>
            </div>
          )}

          {/* Hot take rating */}
          {card.type === "hottake" && !myRatingGiven && (
            <div className="hottake-rate fade-in">
              <p>Rate their take 🔥</p>
              <div className="fire-row">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} className={`fire-btn ${myRating >= s ? "lit" : ""}`} onClick={() => handleRatePartner(s)}>🔥</button>
                ))}
              </div>
            </div>
          )}
          {card.type === "hottake" && myRatingGiven && theirRating && (
            <div className="hottake-results fade-in">
              <p>You rated theirs: {"🔥".repeat(myRatingGiven)}</p>
              <p>They rated yours: {"🔥".repeat(theirRating)}</p>
            </div>
          )}

          {/* Actions: Pin, Fav, Next */}
          <div className="reveal-actions">
            <button className={`btn btn-secondary pin-btn ${pinned ? "pinned" : ""}`} onClick={handlePin}>
              {pinned ? "📌 Pinned!" : "📌 Pin"}
            </button>
            <button className={`btn btn-secondary fav-btn ${faved ? "faved" : ""}`} onClick={handleFav}>
              {faved ? "❤️ Faved" : "🤍 Fav"}
            </button>
          </div>
          <button className="btn btn-primary" onClick={handleNext} style={{ marginTop: ".5rem" }}>
            Next Card →
          </button>
        </div>
      )}
    </div>
  );
}
