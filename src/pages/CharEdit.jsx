import { useState } from "react";
import { updateCharacter } from "../firebase";
import PixelChar, { BODY_TYPES, SKIN_COLORS, HAIR_COLORS, OUTFIT_COLORS, SHOE_COLORS, HAIR_STYLE_NAMES, DEFAULT_CHAR } from "../components/PixelChar";

export default function CharEdit({ room, playerId, roomData, onBack }) {
  const p1 = roomData?.player1;
  const p2 = roomData?.player2;
  const isP1 = playerId === p1?.id;
  const playerKey = isP1 ? "player1" : "player2";
  const me = isP1 ? p1 : p2;
  const [char, setChar] = useState(me?.character || { ...DEFAULT_CHAR });
  const [saved, setSaved] = useState(false);

  function update(key, val) {
    setChar((c) => ({ ...c, [key]: val }));
    setSaved(false);
  }

  async function handleSave() {
    await updateCharacter(room, playerKey, char);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="page charedit fade-in">
      <div className="ce-header">
        <button className="btn btn-ghost back-btn" onClick={onBack}>←</button>
        <h2>Edit Character</h2>
      </div>

      <div className="char-preview big">
        <PixelChar config={char} state="happy" size={6} />
      </div>

      <div className="char-row">
        <span className="char-label">Body</span>
        <div className="char-options">
          {BODY_TYPES.map((b) => (
            <button key={b} className={`char-opt ${char.body === b ? "active" : ""}`} onClick={() => update("body", b)}>
              {b === "male" ? "👦 Boy" : "👧 Girl"}
            </button>
          ))}
        </div>
      </div>

      <div className="char-row">
        <span className="char-label">Hair</span>
        <div className="char-options">
          {HAIR_STYLE_NAMES.map((s) => (
            <button key={s} className={`char-opt ${char.hairStyle === s ? "active" : ""}`} onClick={() => update("hairStyle", s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="char-row">
        <span className="char-label">Hair color</span>
        <div className="char-colors">
          {HAIR_COLORS.map((c) => (
            <button key={c} className={`color-dot ${char.hairColor === c ? "active" : ""}`} style={{ background: c }} onClick={() => update("hairColor", c)} />
          ))}
        </div>
      </div>

      <div className="char-row">
        <span className="char-label">Skin</span>
        <div className="char-colors">
          {SKIN_COLORS.map((c) => (
            <button key={c} className={`color-dot ${char.skinColor === c ? "active" : ""}`} style={{ background: c }} onClick={() => update("skinColor", c)} />
          ))}
        </div>
      </div>

      <div className="char-row">
        <span className="char-label">Outfit</span>
        <div className="char-colors">
          {OUTFIT_COLORS.map((c) => (
            <button key={c} className={`color-dot ${char.outfitColor === c ? "active" : ""}`} style={{ background: c }} onClick={() => update("outfitColor", c)} />
          ))}
        </div>
      </div>

      <div className="char-row">
        <span className="char-label">Shoes</span>
        <div className="char-colors">
          {SHOE_COLORS.map((c) => (
            <button key={c} className={`color-dot ${char.shoeColor === c ? "active" : ""}`} style={{ background: c }} onClick={() => update("shoeColor", c)} />
          ))}
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave}>
        {saved ? "Saved!" : "Save Character"}
      </button>
    </div>
  );
}
