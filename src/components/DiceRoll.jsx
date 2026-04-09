import { useState, useEffect } from "react";
import { decks } from "../data/cards";

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export default function DiceRoll({ availableDecks, onResult, onCancel }) {
  const [rolling, setRolling] = useState(false);
  const [face, setFace] = useState("🎲");
  const [result, setResult] = useState(null);

  function roll() {
    setRolling(true);
    setResult(null);
    let ticks = 0;
    const maxTicks = 20;
    const iv = setInterval(() => {
      setFace(DICE_FACES[Math.floor(Math.random() * DICE_FACES.length)]);
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(iv);
        const pool = availableDecks.length > 0 ? availableDecks : decks;
        const picked = pool[Math.floor(Math.random() * pool.length)];
        setResult(picked);
        setFace(picked.emoji);
        setRolling(false);
      }
    }, 80);
  }

  return (
    <div className="dice-overlay fade-in" onClick={!rolling && !result ? onCancel : undefined}>
      <div className="dice-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`dice-face ${rolling ? "dice-rolling" : ""}`}>{face}</div>

        {!rolling && !result && (
          <>
            <h3>Roll for a deck!</h3>
            <p className="dice-sub">Let fate decide what you play next</p>
            <button className="btn btn-primary" onClick={roll}>Roll the Dice</button>
            <button className="btn btn-ghost" onClick={onCancel}>Pick manually</button>
          </>
        )}

        {result && (
          <div className="dice-result fade-in">
            <h3 style={{ color: result.color }}>{result.emoji} {result.name}</h3>
            <p className="dice-sub">{result.description}</p>
            <button className="btn btn-primary" onClick={() => onResult(result.id)}>
              Draw from {result.name}!
            </button>
            <button className="btn btn-ghost" onClick={() => { setResult(null); setFace("🎲"); }}>
              Roll again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
