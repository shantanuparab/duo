import { useState } from "react";
import { updateDoc, doc, getFirestore } from "firebase/firestore";

const STEPS = [
  {
    emoji: "🃏",
    title: "Play cards together",
    text: "Draw from different decks — Would You Rather, This or That, Deep Talks, Photo Challenges, and more. Both of you answer, then see each other's answers.",
  },
  {
    emoji: "📌",
    title: "Pin answers for later",
    text: "Found out their favorite food? Dream date spot? Pin answers to the Date Board so you can plan the perfect date when the time comes.",
  },
  {
    emoji: "🐾",
    title: "Adopt pets together",
    text: "Get a virtual pet that you both take care of. Feed it, pet it — whoever cares more gets the pet on their side!",
  },
  {
    emoji: "🎵",
    title: "Share songs",
    text: "Share what's playing in your head. Paste a Spotify or YouTube link and they can listen right in the app.",
  },
  {
    emoji: "🎁",
    title: "Send gifts & love letters",
    text: "Send flowers, hearts, cookies, or a love letter with a personal message — anytime you're thinking of them.",
  },
  {
    emoji: "😊",
    title: "Set your mood",
    text: "Pick how you're feeling. It changes the color and vibe of their entire app — so they always know where you're at.",
  },
  {
    emoji: "🌱",
    title: "Watch it grow",
    text: "The more you play, the more you level up. The little seed between your characters grows into a heart over time — from strangers to something real.",
  },
];

export default function Onboarding({ creatorName, partnerName, welcomeMsg, room, onDone }) {
  const [page, setPage] = useState(0); // 0 = welcome, 1+ = tutorial steps
  const db = getFirestore();

  async function handleFinish() {
    await updateDoc(doc(db, "rooms", room), { onboarded: true });
    onDone();
  }

  // Welcome page
  if (page === 0) {
    return (
      <div className="page onboarding fade-in">
        <div className="ob-welcome">
          <div className="ob-welcome-emoji">✨</div>
          <h1 className="ob-welcome-title">Hey {partnerName}</h1>
          {welcomeMsg && (
            <div className="ob-letter">
              <p className="ob-letter-from">From {creatorName}</p>
              <p className="ob-letter-text">"{welcomeMsg}"</p>
            </div>
          )}
          {!welcomeMsg && (
            <p className="ob-welcome-sub">{creatorName} made this for you two</p>
          )}
          <button className="btn btn-primary" onClick={() => setPage(1)} style={{ marginTop: "1.5rem" }}>
            Show me around
          </button>
        </div>
      </div>
    );
  }

  // Tutorial steps
  const stepIdx = page - 1;
  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  return (
    <div className="page onboarding fade-in" key={page}>
      <div className="ob-progress">
        {STEPS.map((_, i) => (
          <div key={i} className={`ob-dot ${i <= stepIdx ? "filled" : ""}`} />
        ))}
      </div>

      <div className="ob-step">
        <div className="ob-step-emoji">{step.emoji}</div>
        <h2 className="ob-step-title">{step.title}</h2>
        <p className="ob-step-text">{step.text}</p>
      </div>

      <div className="ob-nav">
        {stepIdx > 0 && (
          <button className="btn btn-ghost" onClick={() => setPage(page - 1)}>Back</button>
        )}
        {!isLast ? (
          <button className="btn btn-primary" onClick={() => setPage(page + 1)}>Next</button>
        ) : (
          <button className="btn btn-primary" onClick={handleFinish}>Let's go! ✨</button>
        )}
      </div>
    </div>
  );
}
