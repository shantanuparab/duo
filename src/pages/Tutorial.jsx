import { useState } from "react";

const CARD_TUTORIALS = [
  {
    id: "wyr", name: "Would You Rather", emoji: "🤔", color: "#a855f7",
    howToPlay: [
      "You see two options: A or B",
      "Pick the one you'd rather do",
      "Both answers stay hidden until you both pick",
      "Reveals whether you matched or picked differently",
    ],
    scoring: "10 XP per card",
    tip: "Go with your gut — no overthinking!",
  },
  {
    id: "tot", name: "This or That", emoji: "⚡", color: "#f59e0b",
    howToPlay: [
      "Quick binary choice — Coffee or Tea?",
      "Tap your pick instantly",
      "Both hidden until both pick",
      "See if you're on the same page",
    ],
    scoring: "5 XP per card",
    tip: "Speed round energy — first instinct wins",
  },
  {
    id: "daily", name: "Daily Vibes", emoji: "🌅", color: "#f97316",
    howToPlay: [
      "Open-ended questions about your day",
      "Write your answer (up to 500 characters)",
      "Both answers revealed when you're both done",
      "Share little slices of your life",
    ],
    scoring: "15 XP per card",
    tip: "Be real — the more honest, the better",
  },
  {
    id: "deep", name: "Deep Talks", emoji: "🌙", color: "#6366f1",
    howToPlay: [
      "Vulnerable, meaningful questions",
      "Write your heart out (500 char max)",
      "Both answers revealed together",
      "Late night energy — go deep",
    ],
    scoring: "15 XP per card",
    tip: "These hit different at 2am",
  },
  {
    id: "spicy", name: "Butterflies", emoji: "🦋", color: "#ec4899",
    howToPlay: [
      "Flirty questions about each other",
      "Mix of open text and choice questions",
      "Both answers revealed when both done",
      "Getting closer, one card at a time",
    ],
    scoring: "15 XP per card (text) / 10 XP (choice)",
    tip: "Be bold — that's the whole point",
  },
  {
    id: "challenge", name: "Challenges", emoji: "📸", color: "#10b981",
    howToPlay: [
      "Real-world photo challenges",
      "Use your camera or pick from gallery",
      "Add an optional caption",
      "Both photos revealed when both submit",
    ],
    scoring: "20 XP per card",
    tip: "Don't overthink the photo — candid is better",
  },
  {
    id: "hottake", name: "Hot Takes", emoji: "🔥", color: "#ef4444",
    howToPlay: [
      "Share your wildest opinion on the topic",
      "Your partner sees it and rates 1-5 fire emojis",
      "You also rate theirs",
      "See both ratings after",
    ],
    scoring: "15 XP per card",
    tip: "The spicier the take, the more fun it is",
  },
  {
    id: "2truths", name: "2 Truths 1 Lie", emoji: "🎭", color: "#14b8a6",
    howToPlay: [
      "Write 3 statements: 2 true, 1 false",
      "Your partner guesses which one is the lie",
      "You also guess theirs",
      "Reveals who fooled who!",
    ],
    scoring: "20 XP per card",
    tip: "Make the lie believable — that's how you win",
  },
  {
    id: "aboutus", name: "About Us", emoji: "💜", color: "#8b5cf6",
    howToPlay: [
      "Questions about your relationship and future",
      "Write open text answers",
      "Both answers revealed together",
      "Build the story of you two",
    ],
    scoring: "15 XP per card",
    tip: "No wrong answers — just honest ones",
  },
  {
    id: "rate", name: "Rate Wars", emoji: "⭐", color: "#eab308",
    howToPlay: [
      "Both rate the same thing 1-5 stars",
      "Tap to set your rating, then lock it in",
      "Reveals both ratings side by side",
      "Within 1 star = 'So close!', 2+ apart = 'Big gap!'",
    ],
    scoring: "10 XP per card",
    tip: "Rate honestly — the mismatches are the funny part",
  },
];

const GAME_TUTORIALS = [
  {
    id: "speed-wyr", name: "Speed WYR", emoji: "⚡", color: "#a855f7",
    howToPlay: [
      "5 rounds of rapid-fire Would You Rather",
      "10 seconds to pick A or B each round",
      "Both pick independently, then reveal",
      "Match = 1 point. Most matches wins!",
    ],
    duration: "2 minutes",
    scoring: "Match your partner's pick to score. Higher total wins.",
    tip: "Think fast — hesitation costs you",
  },
  {
    id: "memory", name: "Memory Match", emoji: "🧠", color: "#14b8a6",
    howToPlay: [
      "6x2 board of hidden emoji pairs",
      "Take turns flipping 2 cards",
      "Match a pair = 1 point + keep your turn",
      "No match = cards flip back, partner's turn",
    ],
    duration: "3 minutes",
    scoring: "1 point per matched pair. Most pairs wins.",
    tip: "Watch what your partner flips — memory is key",
  },
  {
    id: "word-chain", name: "Word Chain", emoji: "🔗", color: "#f59e0b",
    howToPlay: [
      "Take turns typing words",
      "Each word must start with the last letter of the previous word",
      "No repeating words",
      "Can't think of one? Hit 'Give up' — they win!",
    ],
    duration: "2 minutes",
    scoring: "Last person standing wins. Give up = opponent wins.",
    tip: "Avoid ending on hard letters like X or Z",
  },
  {
    id: "trivia", name: "Quick Trivia", emoji: "🧐", color: "#6366f1",
    howToPlay: [
      "5 multiple choice questions",
      "Both answer each question independently",
      "Correct answer = 1 point",
      "See who got it right after each round",
    ],
    duration: "2 minutes",
    scoring: "1 point per correct answer. Higher total wins.",
    tip: "Trust your gut if you're not sure",
  },
  {
    id: "reaction", name: "Tap Battle", emoji: "👆", color: "#ef4444",
    howToPlay: [
      "A big TAP button appears",
      "Tap it as fast and as many times as you can",
      "Both tap simultaneously for 30 seconds",
      "Higher tap count wins!",
    ],
    duration: "30 seconds",
    scoring: "Most taps wins. Simple as that.",
    tip: "Use your thumb — it's faster than your finger",
  },
  {
    id: "emoji-guess", name: "Emoji Guess", emoji: "🎨", color: "#f59e0b",
    howToPlay: [
      "A combo of emojis appears representing a movie or show",
      "Both players pick from 4 multiple choice answers",
      "Correct guess = 1 point",
      "5 rounds total — see who knows their emoji movies!",
    ],
    duration: "2 minutes",
    scoring: "1 point per correct guess. Higher total wins.",
    tip: "Look at ALL the emojis before picking — the details matter",
  },
  {
    id: "rank-it", name: "Rank It", emoji: "📊", color: "#22c55e",
    howToPlay: [
      "You both get the same 4 items to rank best to worst",
      "Tap items in order to build your ranking",
      "Lock in when you're done",
      "Score = number of positions that match your partner's ranking",
    ],
    duration: "2 minutes",
    scoring: "Matching positions with your partner. Max 4 per round.",
    tip: "Think about what THEY would rank, not just you",
  },
  {
    id: "number-guess", name: "Higher Lower", emoji: "🔢", color: "#ec4899",
    howToPlay: [
      "A random number (1-100) appears on screen",
      "Guess if the next number is higher or lower",
      "Take turns — correct guess = 1 point",
      "More correct guesses = more points!",
    ],
    duration: "90 seconds",
    scoring: "1 point per correct guess. Turn-based — alternate with your partner.",
    tip: "Numbers near 50 are the hardest — it's a coin flip!",
  },
];

export default function Tutorial({ type, onBack }) {
  const [tab, setTab] = useState(type === "games" ? "games" : "cards");
  const items = tab === "cards" ? CARD_TUTORIALS : GAME_TUTORIALS;

  return (
    <div className="page tutorial fade-in">
      <div className="tutorial-header">
        <button className="btn btn-ghost back-btn" onClick={onBack}>←</button>
        <h2>How to Play</h2>
      </div>

      {/* Tabs */}
      <div className="tutorial-tabs">
        <button
          className={`tutorial-tab ${tab === "cards" ? "active" : ""}`}
          onClick={() => setTab("cards")}
        >
          🃏 Card Decks
        </button>
        <button
          className={`tutorial-tab ${tab === "games" ? "active" : ""}`}
          onClick={() => setTab("games")}
        >
          🎮 Mini Games
        </button>
      </div>

      {/* General scoring info */}
      <div className="tutorial-scoring-banner">
        <span className="tutorial-scoring-title">Scoring</span>
        <p className="tutorial-scoring-text">
          {tab === "cards"
            ? "Every card earns XP. Level up to unlock new decks and features. Keep a daily streak for bonus vibes!"
            : "Win games to earn trophies. Send trophies as gifts. Track wins on the leaderboard!"}
        </p>
      </div>

      {/* Item list */}
      <div className="tutorial-list">
        {items.map((item) => (
          <TutorialCard key={item.id} item={item} isGame={tab === "games"} />
        ))}
      </div>
    </div>
  );
}

function TutorialCard({ item, isGame }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="tutorial-card"
      style={{ borderColor: item.color + "44", background: item.color + "08" }}
    >
      <div className="tutorial-card-header" onClick={() => setExpanded(!expanded)}>
        <span className="tutorial-card-emoji">{item.emoji}</span>
        <div className="tutorial-card-title">
          <span className="tutorial-card-name" style={{ color: item.color }}>{item.name}</span>
          <span className="tutorial-card-xp">{item.scoring}</span>
        </div>
        <span className={`tutorial-chevron ${expanded ? "open" : ""}`}>▾</span>
      </div>

      {expanded && (
        <div className="tutorial-card-body fade-in">
          {isGame && item.duration && (
            <p className="tutorial-duration">Duration: {item.duration}</p>
          )}
          <div className="tutorial-steps">
            {item.howToPlay.map((step, i) => (
              <div key={i} className="tutorial-step">
                <span className="tutorial-step-num">{i + 1}</span>
                <span className="tutorial-step-text">{step}</span>
              </div>
            ))}
          </div>
          {item.tip && (
            <div className="tutorial-tip">
              <span className="tutorial-tip-label">Tip:</span> {item.tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
