import { useState, useEffect } from "react";
import { createRoom, joinRoom, rejoinRoom } from "../firebase";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import PixelChar, { DEFAULT_CHAR, BODY_TYPES, SKIN_COLORS, HAIR_COLORS, OUTFIT_COLORS, SHOE_COLORS, HAIR_STYLE_NAMES } from "../components/PixelChar";

export default function Home({ onJoin, inviteCode }) {
  const [step, setStep] = useState(inviteCode ? "invite-loading" : "landing");
  const [name, setName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [code, setCode] = useState(inviteCode || "");
  const [rejoinCode, setRejoinCode] = useState("");
  const [rejoinName, setRejoinName] = useState("");
  const [createdCode, setCreatedCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [char, setChar] = useState({ ...DEFAULT_CHAR });

  function updateChar(key, val) { setChar((c) => ({ ...c, [key]: val })); }

  // When opened via invite link, fetch room data to get names + welcome message
  useEffect(() => {
    if (!inviteCode || step !== "invite-loading") return;
    const db = getFirestore();
    getDoc(doc(db, "rooms", inviteCode)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCreatorName(data.creatorName || data.player1?.name || "Someone");
        setPartnerName(data.partnerName || "");
        setWelcomeMsg(data.welcomeMsg || "");
        setName(data.partnerName || ""); // Pre-fill their name
        setStep("invite-welcome");
      } else {
        setError("Room not found");
        setStep("landing");
      }
    });
  }, [inviteCode, step]);

  // Create room
  async function handleCreate() {
    setLoading(true);
    setError("");
    try {
      const r = await createRoom(name.trim(), char, partnerName.trim(), welcomeMsg.trim());
      setCreatedCode(r.code);
      setStep("create-invite");
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  function handleJoinFromInvite() {
    onJoin(createdCode, localStorage.getItem("vc_pid"));
  }

  // Join room
  async function handleJoin() {
    if (!name.trim() || !code.trim()) return;
    setLoading(true);
    setError("");
    try {
      const r = await joinRoom(code.trim(), name.trim(), char);
      onJoin(r.code, r.playerId);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function handleQuickRejoin() {
    if (rejoinCode.length < 4) return;
    setLoading(true);
    setError("");
    try {
      const result = await rejoinRoom(rejoinCode.trim());
      if (result) { onJoin(result.code, result.playerId); return; }
      setStep("rejoin");
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function handleRejoinWithName() {
    if (!rejoinName.trim() || rejoinCode.length < 4) return;
    setLoading(true);
    setError("");
    try {
      const r = await joinRoom(rejoinCode.trim(), rejoinName.trim(), null);
      onJoin(r.code, r.playerId);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  function getInviteLink() {
    const base = window.location.origin + window.location.pathname;
    return `${base}?code=${createdCode}`;
  }

  function copyInvite() {
    const link = getInviteLink();
    const msg = `Hey ${partnerName}! I made something for us — it's a little app called vibe check ✨\n\nJust tap this link:\n${link}`;
    navigator.clipboard?.writeText(msg);
    setCopied("invite");
    setTimeout(() => setCopied(""), 2000);
  }

  function copyLink() {
    navigator.clipboard?.writeText(getInviteLink());
    setCopied("link");
    setTimeout(() => setCopied(""), 2000);
  }

  // ========== INVITE LOADING ==========
  if (step === "invite-loading") {
    return (
      <div className="page home">
        <div className="home-hero">
          <div className="logo-glow">✨</div>
          <p className="subtitle">Loading...</p>
        </div>
      </div>
    );
  }

  // ========== INVITE WELCOME — she sees this first ==========
  if (step === "invite-welcome") {
    return (
      <div className="page home fade-in">
        <div className="ob-welcome">
          <div className="ob-welcome-emoji">✨</div>
          <h1 className="ob-welcome-title">Hey {partnerName || "you"}</h1>
          {welcomeMsg ? (
            <div className="ob-letter">
              <p className="ob-letter-from">From {creatorName}</p>
              <p className="ob-letter-text">"{welcomeMsg}"</p>
            </div>
          ) : (
            <p className="ob-welcome-sub">{creatorName} made this for you two</p>
          )}
          <button className="btn btn-primary" onClick={() => setStep("invite-char")} style={{ marginTop: "1.5rem" }}>
            Let's go ✨
          </button>
        </div>
      </div>
    );
  }

  // ========== INVITE CHARACTER — she edits name + character ==========
  if (step === "invite-char") {
    return (
      <div className="page home char-setup fade-in">
        <h2>Create your character</h2>
        <div className="char-preview"><PixelChar config={char} state="idle" size={5} /></div>
        {renderCharEditor()}
        <div className="char-form">
          <input className="input" type="text" placeholder="Your name" value={name}
            onChange={(e) => setName(e.target.value)} maxLength={16} />
          <p className="os-hint" style={{ textAlign: "center" }}>
            You can change this anytime
          </p>
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" onClick={handleJoin} disabled={loading || !name.trim()}>
            {loading ? "Joining..." : "Join Room"}
          </button>
          <button className="btn btn-ghost" onClick={() => setStep("invite-welcome")}>Back</button>
        </div>
      </div>
    );
  }

  // ========== LANDING ==========
  if (step === "landing") {
    return (
      <div className="page home">
        <div className="home-hero">
          <div className="logo-glow">✨</div>
          <h1>vibe check</h1>
          <p className="subtitle">a card game for two</p>
        </div>
        <div className="home-actions fade-in">
          <button className="btn btn-primary" onClick={() => setStep("create-name")}>New Room</button>
          <button className="btn btn-secondary" onClick={() => setStep("join-char")}>Join with Code</button>
        </div>
        <div className="rejoin-section fade-in">
          <p className="rejoin-label">Already in a room?</p>
          <div className="rejoin-row">
            <input className="input rejoin-input" type="text" placeholder="Room code" value={rejoinCode}
              onChange={(e) => { setRejoinCode(e.target.value.toUpperCase()); setError(""); }}
              maxLength={6} style={{ textTransform: "uppercase", letterSpacing: ".15em", textAlign: "center" }} />
            <button className="btn btn-ghost" disabled={rejoinCode.length < 4 || loading} onClick={handleQuickRejoin}>
              {loading ? "..." : "Rejoin"}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    );
  }

  // ========== REJOIN ==========
  if (step === "rejoin") {
    return (
      <div className="page home fade-in">
        <div className="home-hero" style={{ paddingTop: "15dvh" }}>
          <div className="logo-glow">🔑</div>
          <h1>Welcome back</h1>
          <p className="subtitle">Room {rejoinCode} — enter your name to get back in</p>
        </div>
        <div className="home-form fade-in">
          <input className="input" type="text" placeholder="Your name (same as before)" value={rejoinName}
            onChange={(e) => { setRejoinName(e.target.value); setError(""); }} maxLength={16} autoFocus />
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" onClick={handleRejoinWithName} disabled={loading || !rejoinName.trim()}>
            {loading ? "..." : "Rejoin Room"}
          </button>
          <button className="btn btn-ghost" onClick={() => { setStep("landing"); setError(""); }}>Back</button>
        </div>
      </div>
    );
  }

  // ========== CREATE: Step 1 — Your name ==========
  if (step === "create-name") {
    return (
      <div className="page home fade-in">
        <div className="home-hero" style={{ paddingTop: "12dvh" }}>
          <div className="logo-glow">✨</div>
          <h2>What's your name?</h2>
        </div>
        <div className="home-form">
          <input className="input" type="text" placeholder="Your name" value={name}
            onChange={(e) => setName(e.target.value)} maxLength={16} autoFocus />
          <button className="btn btn-primary" onClick={() => setStep("create-partner")} disabled={!name.trim()}>Next</button>
          <button className="btn btn-ghost" onClick={() => setStep("landing")}>Back</button>
        </div>
      </div>
    );
  }

  // ========== CREATE: Step 2 — Partner's name + welcome ==========
  if (step === "create-partner") {
    return (
      <div className="page home fade-in">
        <div className="home-hero" style={{ paddingTop: "10dvh" }}>
          <div className="logo-glow">💌</div>
          <h2>Who is this for?</h2>
          <p className="subtitle">They'll see a personalized welcome when they join</p>
        </div>
        <div className="home-form">
          <input className="input" type="text" placeholder="Their name" value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)} maxLength={16} autoFocus />
          <textarea className="input textarea" placeholder={`Write a welcome message for ${partnerName || "them"}...\n\ne.g. "Hey! I made this little game for us. No pressure, just for fun ✨"`}
            value={welcomeMsg} onChange={(e) => setWelcomeMsg(e.target.value)} rows={4} maxLength={300} />
          <button className="btn btn-primary" onClick={() => setStep("create-char")} disabled={!partnerName.trim()}>Next</button>
          <button className="btn btn-ghost" onClick={() => setStep("create-name")}>Back</button>
        </div>
      </div>
    );
  }

  // ========== CREATE: Step 3 — Your character ==========
  if (step === "create-char") {
    return (
      <div className="page home char-setup fade-in">
        <h2>Create your character</h2>
        <div className="char-preview"><PixelChar config={char} state="idle" size={5} /></div>
        {renderCharEditor()}
        <div className="char-form">
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create Room"}
          </button>
          <button className="btn btn-ghost" onClick={() => setStep("create-partner")}>Back</button>
        </div>
      </div>
    );
  }

  // ========== CREATE: Step 4 — Invite screen ==========
  if (step === "create-invite") {
    return (
      <div className="page home fade-in">
        <div className="home-hero" style={{ paddingTop: "8dvh" }}>
          <div className="logo-glow">🎉</div>
          <h2>Room created!</h2>
          <p className="subtitle">Send this link to {partnerName}</p>
        </div>
        <div className="invite-link-box">
          <span className="invite-link-text">{getInviteLink()}</span>
        </div>
        <div className="invite-preview">
          <p className="invite-text">
            Hey {partnerName}! I made something for us — it's a little app called vibe check ✨
          </p>
          <p className="invite-text" style={{ fontSize: ".75rem", marginTop: ".3rem" }}>
            They tap the link → see your message → create their character → walkthrough → start playing
          </p>
        </div>
        <div className="home-form">
          <button className="btn btn-primary" onClick={copyInvite}>{copied === "invite" ? "Copied! ✓" : "Copy Invite Message"}</button>
          <button className="btn btn-secondary" onClick={copyLink}>{copied === "link" ? "Copied! ✓" : "Copy Link Only"}</button>
          <button className="btn btn-secondary" onClick={handleJoinFromInvite}>Enter Room</button>
        </div>
      </div>
    );
  }

  // ========== JOIN: Name + Code + Character (manual, no invite link) ==========
  if (step === "join-char") {
    return (
      <div className="page home char-setup fade-in">
        <h2>Join & create your character</h2>
        <div className="char-preview"><PixelChar config={char} state="idle" size={5} /></div>
        {renderCharEditor()}
        <div className="char-form">
          <input className="input" type="text" placeholder="Your name" value={name}
            onChange={(e) => setName(e.target.value)} maxLength={16} />
          <input className="input" type="text" placeholder="Room code" value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6}
            style={{ textTransform: "uppercase", letterSpacing: "0.2em", textAlign: "center" }} />
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" onClick={handleJoin} disabled={loading || !name.trim() || !code.trim()}>
            {loading ? "..." : "Join Room"}
          </button>
          <button className="btn btn-ghost" onClick={() => { setStep("landing"); setError(""); }}>Back</button>
        </div>
      </div>
    );
  }

  // Shared character editor
  function renderCharEditor() {
    return (
      <>
        <div className="char-row">
          <span className="char-label">Body</span>
          <div className="char-options">
            {BODY_TYPES.map((b) => (
              <button key={b} className={`char-opt ${char.body === b ? "active" : ""}`} onClick={() => updateChar("body", b)}>
                {b === "male" ? "👦 Boy" : "👧 Girl"}
              </button>
            ))}
          </div>
        </div>
        <div className="char-row">
          <span className="char-label">Hair</span>
          <div className="char-options">
            {HAIR_STYLE_NAMES.map((s) => (
              <button key={s} className={`char-opt ${char.hairStyle === s ? "active" : ""}`} onClick={() => updateChar("hairStyle", s)}>{s}</button>
            ))}
          </div>
        </div>
        <div className="char-row">
          <span className="char-label">Hair color</span>
          <div className="char-colors">
            {HAIR_COLORS.map((c) => (
              <button key={c} className={`color-dot ${char.hairColor === c ? "active" : ""}`} style={{ background: c }} onClick={() => updateChar("hairColor", c)} aria-label={`Hair color ${c}`} />
            ))}
          </div>
        </div>
        <div className="char-row">
          <span className="char-label">Skin</span>
          <div className="char-colors">
            {SKIN_COLORS.map((c) => (
              <button key={c} className={`color-dot ${char.skinColor === c ? "active" : ""}`} style={{ background: c }} onClick={() => updateChar("skinColor", c)} aria-label={`Skin color ${c}`} />
            ))}
          </div>
        </div>
        <div className="char-row">
          <span className="char-label">Outfit</span>
          <div className="char-colors">
            {OUTFIT_COLORS.map((c) => (
              <button key={c} className={`color-dot ${char.outfitColor === c ? "active" : ""}`} style={{ background: c }} onClick={() => updateChar("outfitColor", c)} aria-label={`Outfit color ${c}`} />
            ))}
          </div>
        </div>
        <div className="char-row">
          <span className="char-label">Shoes</span>
          <div className="char-colors">
            {SHOE_COLORS.map((c) => (
              <button key={c} className={`color-dot ${char.shoeColor === c ? "active" : ""}`} style={{ background: c }} onClick={() => updateChar("shoeColor", c)} aria-label={`Shoe color ${c}`} />
            ))}
          </div>
        </div>
      </>
    );
  }

  return null;
}
