import { useState, useEffect, useRef } from "react";
import { updateDoc, doc, getFirestore, serverTimestamp, setDoc, onSnapshot, collection, getDocs } from "firebase/firestore";
import PixelPet, { PET_TYPES, PET_NAMES_DEFAULT, PET_UNLOCK } from "../components/PixelPet";
import { getUnlockedFeatures } from "../data/milestones";

// --- Gifts with level gating ---
const GIFTS = [
  { id: "rose", emoji: "🌹", name: "Rose", level: 3 },
  { id: "star", emoji: "⭐", name: "Star", level: 3 },
  { id: "cookie", emoji: "🍪", name: "Cookie", level: 3 },
  { id: "hug", emoji: "🤗", name: "Virtual Hug", level: 3 },
  { id: "sunflower", emoji: "🌻", name: "Sunflower", level: 4 },
  { id: "tulip", emoji: "🌷", name: "Tulip", level: 4 },
  { id: "heart", emoji: "💝", name: "Heart", level: 5 },
  { id: "kiss", emoji: "💋", name: "Kiss", level: 5 },
  { id: "teddy", emoji: "🧸", name: "Teddy Bear", level: 6 },
  { id: "letter", emoji: "💌", name: "Love Letter", level: 7, hasMessage: true },
];

const BOUQUET_TYPES = [
  { id: "roses", emoji: "🌹🌹🌹", name: "Rose Bouquet", waterPerDay: 2 },
  { id: "mixed", emoji: "🌷🌻🌹", name: "Mixed Bouquet", waterPerDay: 1 },
  { id: "sunflowers", emoji: "🌻🌻🌻", name: "Sunflower Bunch", waterPerDay: 1 },
];

const PET_TRICKS = [
  { id: "sit", name: "Sit", emoji: "🪑", xpNeeded: 0 },
  { id: "shake", name: "Shake", emoji: "🤝", xpNeeded: 3 },
  { id: "roll", name: "Roll Over", emoji: "🔄", xpNeeded: 6 },
  { id: "fetch", name: "Fetch", emoji: "🎾", xpNeeded: 10 },
  { id: "dance", name: "Dance", emoji: "💃", xpNeeded: 15 },
];

const PLAYGROUND_TOYS = [
  { id: "ball", emoji: "🎾", name: "Ball" },
  { id: "frisbee", emoji: "🥏", name: "Frisbee" },
  { id: "rope", emoji: "🪢", name: "Rope" },
  { id: "bone", emoji: "🦴", name: "Bone" },
];

// --- Helpers ---
function toDate(v) {
  if (!v) return new Date(0);
  if (v.toDate) return v.toDate();
  if (v instanceof Date) return v;
  if (v.seconds) return new Date(v.seconds * 1000);
  return new Date(v);
}

function getPetStats(pet) {
  const lastFed = toDate(pet?.lastFed);
  const hoursSinceFed = (Date.now() - lastFed.getTime()) / 3600000;
  const hunger = Math.max(0, Math.min(100, 100 - hoursSinceFed * 2)); // slower drain: 2%/hr
  const lastPetted = toDate(pet?.lastPetted);
  const hoursSincePetted = (Date.now() - lastPetted.getTime()) / 3600000;
  const happiness = Math.max(0, Math.min(100, 100 - hoursSincePetted * 1.5)); // slower drain
  const state = hunger < 30 || happiness < 30 ? "idle" : "happy";
  return { hunger, happiness, state };
}

function getBouquetHealth(bouquet) {
  const lastWatered = toDate(bouquet?.lastWatered);
  const hoursSince = (Date.now() - lastWatered.getTime()) / 3600000;
  const health = Math.max(0, Math.min(100, 100 - hoursSince * 2));
  return health;
}

// Level calc (same as Hub)
const LEVELS = [0, 50, 150, 300, 500, 800, 1200, 1700, 2400, 3200, 99999];
function getLevel(xp) {
  for (let i = 0; i < LEVELS.length - 1; i++) {
    if (xp < LEVELS[i + 1]) return i + 1;
  }
  return LEVELS.length;
}

export default function OurSpace({ room, playerId, roomData, onBack }) {
  const [tab, setTab] = useState("pet");
  const [giftHistory, setGiftHistory] = useState([]);
  const [notes, setNotes] = useState([]);
  const [sending, setSending] = useState(false);
  const [petAction, setPetAction] = useState(null);
  const [selectedPet, setSelectedPet] = useState(0);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [pendingGift, setPendingGift] = useState(null);
  const [giftMessage, setGiftMessage] = useState("");
  const [songInput, setSongInput] = useState("");
  const [songLink, setSongLink] = useState("");
  const [savingSong, setSavingSong] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notePhoto, setNotePhoto] = useState(null);
  const [savingNote, setSavingNote] = useState(false);
  const [trickResult, setTrickResult] = useState(null);
  const fileRef = useRef(null);

  const db = getFirestore();
  const pets = roomData?.pets || [];
  const legacyPet = roomData?.pet;
  const allPets = pets.length > 0 ? pets : (legacyPet ? [legacyPet] : []);
  const bouquets = roomData?.bouquets || [];

  const p1 = roomData?.player1;
  const p2 = roomData?.player2;
  const isP1 = playerId === p1?.id;
  const me = isP1 ? p1 : p2;
  const them = isP1 ? p2 : p1;
  const partnerId = them?.id;
  const xp = roomData?.xp || 0;
  const level = getLevel(xp);
  const features = getUnlockedFeatures(level);

  const pet = allPets[selectedPet];
  const stats = pet ? getPetStats(pet) : null;

  const mySong = roomData?.[`song_${playerId}`];
  const theirSong = partnerId ? roomData?.[`song_${partnerId}`] : null;

  // Max pets based on level
  const maxPets = features.has("secondPet") ? 2 : 1;

  // Subscribe gifts
  useEffect(() => {
    return onSnapshot(collection(db, "rooms", room, "gifts"), (snap) => {
      const g = [];
      snap.forEach((d) => g.push({ id: d.id, ...d.data() }));
      g.sort((a, b) => (b.at?.toMillis?.() || 0) - (a.at?.toMillis?.() || 0));
      setGiftHistory(g);
    });
  }, [room]);

  // Subscribe notes
  useEffect(() => {
    return onSnapshot(collection(db, "rooms", room, "notes"), (snap) => {
      const n = [];
      snap.forEach((d) => n.push({ id: d.id, ...d.data() }));
      n.sort((a, b) => (b.at?.toMillis?.() || 0) - (a.at?.toMillis?.() || 0));
      setNotes(n);
    });
  }, [room]);

  // --- Pet functions ---
  async function adoptPet(type) {
    if (allPets.length >= maxPets) return;
    const now = new Date();
    const newPet = { type, name: PET_NAMES_DEFAULT[type], lastFed: now, lastPetted: now, careCount: { [playerId]: 1 }, tricks: 0 };
    await updateDoc(doc(db, "rooms", room), { pets: [...allPets, newPet] });
    setSelectedPet(allPets.length);
  }

  async function feedPet() {
    if (!pet) return;
    setPetAction({ index: selectedPet, type: "feed" });
    const updated = [...allPets];
    const care = { ...(updated[selectedPet].careCount || {}) };
    care[playerId] = (care[playerId] || 0) + 1;
    updated[selectedPet] = { ...updated[selectedPet], lastFed: new Date(), careCount: care };
    await updateDoc(doc(db, "rooms", room), { pets: updated });
    setTimeout(() => setPetAction(null), 1500);
  }

  async function petThePet() {
    if (!pet) return;
    setPetAction({ index: selectedPet, type: "pet" });
    const updated = [...allPets];
    const care = { ...(updated[selectedPet].careCount || {}) };
    care[playerId] = (care[playerId] || 0) + 1;
    updated[selectedPet] = { ...updated[selectedPet], lastPetted: new Date(), careCount: care };
    await updateDoc(doc(db, "rooms", room), { pets: updated });
    setTimeout(() => setPetAction(null), 1500);
  }

  async function teachTrick() {
    if (!pet) return;
    const tricks = pet.tricks || 0;
    const available = PET_TRICKS.filter((t) => t.xpNeeded <= tricks);
    const next = PET_TRICKS.find((t) => t.xpNeeded > tricks);
    const success = Math.random() > 0.3;
    if (success && next) {
      const updated = [...allPets];
      updated[selectedPet] = { ...updated[selectedPet], tricks: tricks + 1 };
      await updateDoc(doc(db, "rooms", room), { pets: updated });
      setTrickResult(`${pet.name} learned something new! 🎉`);
    } else {
      setTrickResult(success ? `${pet.name} did a trick! ${available[available.length - 1]?.emoji || "🐾"}` : `${pet.name} got confused... try again! 😅`);
    }
    setTimeout(() => setTrickResult(null), 2500);
  }

  async function playWithToy(toy) {
    setPetAction({ index: selectedPet, type: "pet" });
    const updated = [...allPets];
    const care = { ...(updated[selectedPet].careCount || {}) };
    care[playerId] = (care[playerId] || 0) + 1;
    updated[selectedPet] = { ...updated[selectedPet], lastPetted: new Date(), careCount: care };
    await updateDoc(doc(db, "rooms", room), { pets: updated });
    setTrickResult(`${pet.name} is playing with the ${toy.name}! ${toy.emoji}`);
    setTimeout(() => { setPetAction(null); setTrickResult(null); }, 2000);
  }

  async function handleRename() {
    if (!newName.trim() || !pet) return;
    const updated = [...allPets];
    updated[selectedPet] = { ...updated[selectedPet], name: newName.trim() };
    await updateDoc(doc(db, "rooms", room), { pets: updated });
    setRenaming(false);
    setNewName("");
  }

  // --- Gifts ---
  function handleGiftTap(gift) {
    if (gift.hasMessage) { setPendingGift(gift); setGiftMessage(""); }
    else sendGift(gift, "");
  }

  async function sendGift(gift, message) {
    setSending(true);
    await setDoc(doc(db, "rooms", room, "gifts", Date.now().toString()), {
      emoji: gift.emoji, name: gift.name, from: me?.name, to: them?.name, message: message || "", at: serverTimestamp(),
    });
    setSending(false);
    setPendingGift(null);
    setGiftMessage("");
  }

  // --- Bouquets ---
  async function sendBouquet(type) {
    const b = { ...type, from: me?.name, lastWatered: new Date(), createdAt: new Date() };
    await updateDoc(doc(db, "rooms", room), { bouquets: [...bouquets, b] });
  }

  async function waterBouquet(idx) {
    const updated = [...bouquets];
    updated[idx] = { ...updated[idx], lastWatered: new Date() };
    await updateDoc(doc(db, "rooms", room), { bouquets: updated });
  }

  // --- Notes ---
  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        const max = 400;
        if (w > h) { if (w > max) { h *= max / w; w = max; } } else { if (h > max) { w *= max / h; h = max; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        setNotePhoto(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function sendNote() {
    if (!noteText.trim() && !notePhoto) return;
    setSavingNote(true);
    await setDoc(doc(db, "rooms", room, "notes", Date.now().toString()), {
      from: me?.name, text: noteText.trim(), photo: notePhoto || null, at: serverTimestamp(),
    });
    setSavingNote(false);
    setNoteText("");
    setNotePhoto(null);
  }

  // --- Songs ---
  function parseEmbed(url) {
    if (!url) return null;
    let m = url.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (m) return { type: "spotify", kind: m[1], id: m[2] };
    m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (m) return { type: "youtube", id: m[1] };
    return null;
  }

  async function saveSong() {
    if (!songInput.trim() && !songLink.trim()) return;
    setSavingSong(true);
    const embed = parseEmbed(songLink.trim());
    await updateDoc(doc(db, "rooms", room), {
      [`song_${playerId}`]: {
        title: songInput.trim() || songLink.trim(), link: songLink.trim() || "",
        embedType: embed?.type || null, embedId: embed?.id || null, embedKind: embed?.kind || null,
        at: new Date(), by: me?.name,
      },
    });
    setSavingSong(false);
    setSongInput("");
    setSongLink("");
  }

  // Available pets for adoption (level-gated)
  const availablePetTypes = PET_TYPES.filter((t) => (PET_UNLOCK[t] || 99) <= level);

  // Available gifts (level-gated)
  const availableGifts = GIFTS.filter((g) => g.level <= level);

  // --- Tabs ---
  const tabs = [{ id: "pet", label: "🐾 Pets" }];
  if (features.has("gifts")) tabs.push({ id: "gifts", label: "🎁 Gifts" });
  if (features.has("notes")) tabs.push({ id: "notes", label: "📝 Notes" });
  if (features.has("songs")) tabs.push({ id: "songs", label: "🎵 Songs" });
  if (features.has("bouquets")) tabs.push({ id: "bouquets", label: "💐 Bouquets" });
  if (features.has("playground") && allPets.length > 0) tabs.push({ id: "play", label: "🎾 Play" });

  return (
    <div className="page ourspace fade-in">
      <div className="os-header">
        <button className="btn btn-ghost back-btn" onClick={onBack}>←</button>
        <h2>Our Space</h2>
      </div>

      <div className="os-tabs">
        {tabs.map((t) => (
          <button key={t.id} className={`os-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ===== PET TAB ===== */}
      {tab === "pet" && (
        <div className="os-pet-tab fade-in">
          {allPets.length > 0 && (
            <div className="pet-selector">
              {allPets.map((p, i) => (
                <button key={i} className={`pet-sel-btn ${selectedPet === i ? "active" : ""}`} onClick={() => setSelectedPet(i)}>
                  <PixelPet type={p.type} state="idle" size={3} />
                  <span>{p.name}</span>
                </button>
              ))}
              {allPets.length < maxPets && (
                <button className="pet-sel-btn add" onClick={() => setSelectedPet(-1)}>
                  <span className="pet-add-icon">+</span><span>New</span>
                </button>
              )}
            </div>
          )}

          {(allPets.length === 0 || (selectedPet === -1 && allPets.length < maxPets)) && (
            <div className="pet-adopt">
              <h3>{allPets.length === 0 ? "Adopt your first pet!" : "Add a second pet!"}</h3>
              <p className="os-hint">Pick one — you'll both take care of it</p>
              <div className="pet-grid">
                {availablePetTypes.map((t) => (
                  <button key={t} className="pet-option" onClick={() => adoptPet(t)}>
                    <PixelPet type={t} state="happy" size={5} />
                    <span>{PET_NAMES_DEFAULT[t]}</span>
                    <span className="pet-type-label">{t}</span>
                  </button>
                ))}
                {PET_TYPES.filter((t) => (PET_UNLOCK[t] || 99) > level).map((t) => (
                  <div key={t} className="pet-option locked">
                    <span style={{ fontSize: "1.5rem", opacity: .3 }}>🔒</span>
                    <span>{PET_NAMES_DEFAULT[t]}</span>
                    <span className="pet-type-label">Lv.{PET_UNLOCK[t]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pet && selectedPet >= 0 && stats && (
            <div className="pet-zone">
              <div className={`pet-display ${petAction?.index === selectedPet ? petAction.type : ""}`}>
                <PixelPet type={pet.type} state={stats.state} size={7} />
                {petAction?.index === selectedPet && petAction.type === "feed" && <span className="pet-action-emoji">🍖</span>}
                {petAction?.index === selectedPet && petAction.type === "pet" && <span className="pet-action-emoji">💕</span>}
              </div>
              {trickResult && <p className="trick-result fade-in">{trickResult}</p>}

              {renaming ? (
                <div className="pet-rename-row">
                  <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New name" maxLength={16} autoFocus />
                  <button className="btn btn-primary" onClick={handleRename} style={{ width: "auto", padding: ".5rem 1rem" }}>Save</button>
                  <button className="btn btn-ghost" onClick={() => setRenaming(false)} style={{ width: "auto" }}>Cancel</button>
                </div>
              ) : (
                <h3 className="pet-name" onClick={() => { setRenaming(true); setNewName(pet.name); }}>
                  {pet.name} <span className="pet-rename-hint">✏️</span>
                </h3>
              )}

              <div className="pet-meters">
                <div className="pet-meter">
                  <span className="meter-label">🍖 Hunger</span>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: `${stats.hunger}%`, background: stats.hunger < 30 ? "#ef4444" : stats.hunger < 60 ? "#f59e0b" : "#34d399" }} /></div>
                </div>
                <div className="pet-meter">
                  <span className="meter-label">💕 Happy</span>
                  <div className="meter-bar"><div className="meter-fill" style={{ width: `${stats.happiness}%`, background: stats.happiness < 30 ? "#ef4444" : stats.happiness < 60 ? "#f59e0b" : "#34d399" }} /></div>
                </div>
              </div>

              <div className="pet-actions">
                <button className="btn btn-secondary" onClick={feedPet}>🍖 Feed</button>
                <button className="btn btn-secondary" onClick={petThePet}>💕 Pet</button>
                <button className="btn btn-secondary" onClick={teachTrick}>🎓 Trick</button>
              </div>

              {/* Tricks learned */}
              <div className="pet-tricks">
                {PET_TRICKS.filter((t) => t.xpNeeded <= (pet.tricks || 0)).map((t) => (
                  <span key={t.id} className="trick-badge">{t.emoji} {t.name}</span>
                ))}
              </div>

              <p className="os-hint">{stats.hunger < 30 ? `${pet.name} is hungry!` : stats.happiness < 30 ? `${pet.name} wants attention!` : `${pet.name} is doing great!`}</p>
            </div>
          )}
        </div>
      )}

      {/* ===== PLAYGROUND ===== */}
      {tab === "play" && pet && (
        <div className="os-play-tab fade-in">
          <div className="pet-display small">
            <PixelPet type={pet.type} state="happy" size={5} />
          </div>
          <h3>{pet.name}'s Playground</h3>
          {trickResult && <p className="trick-result fade-in">{trickResult}</p>}
          <div className="toy-grid">
            {PLAYGROUND_TOYS.map((t) => (
              <button key={t.id} className="toy-btn" onClick={() => playWithToy(t)}>
                <span className="toy-emoji">{t.emoji}</span>
                <span className="toy-name">{t.name}</span>
              </button>
            ))}
          </div>
          <p className="os-hint">Playing increases happiness and strengthens your bond</p>
        </div>
      )}

      {/* ===== GIFTS TAB ===== */}
      {tab === "gifts" && (
        <div className="os-gifts-tab fade-in">
          <p className="os-hint">Send {them?.name} something nice</p>
          {pendingGift ? (
            <div className="gift-compose fade-in">
              <div className="gift-compose-header"><span className="gift-compose-emoji">{pendingGift.emoji}</span><span>Write a {pendingGift.name.toLowerCase()}</span></div>
              <textarea className="input textarea" placeholder="Write your message..." value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} rows={4} maxLength={500} autoFocus />
              <div className="gift-compose-actions">
                <button className="btn btn-ghost" onClick={() => setPendingGift(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => sendGift(pendingGift, giftMessage)} disabled={sending || !giftMessage.trim()}>
                  {sending ? "..." : "Send 💌"}
                </button>
              </div>
            </div>
          ) : (
            <div className="gift-grid">
              {availableGifts.map((g) => (
                <button key={g.id} className="gift-btn" onClick={() => handleGiftTap(g)} disabled={sending}>
                  <span className="gift-emoji">{g.emoji}</span><span className="gift-name">{g.name}</span>
                </button>
              ))}
              {GIFTS.filter((g) => g.level > level).map((g) => (
                <div key={g.id} className="gift-btn locked"><span className="gift-emoji" style={{ opacity: .3 }}>🔒</span><span className="gift-name">Lv.{g.level}</span></div>
              ))}
            </div>
          )}
          {giftHistory.length > 0 && !pendingGift && (
            <div className="gift-history">
              <h4>Gift History</h4>
              {giftHistory.slice(0, 20).map((g) => (
                <div key={g.id} className="gift-entry">
                  <span>{g.emoji}</span>
                  <div className="gift-entry-content">
                    <span className="gift-entry-text"><strong>{g.from}</strong> sent a {g.name}</span>
                    {g.message && <p className="gift-entry-msg">"{g.message}"</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== NOTES TAB ===== */}
      {tab === "notes" && (
        <div className="os-notes-tab fade-in">
          <p className="os-hint">Leave notes for each other</p>
          <div className="note-compose">
            <textarea className="input textarea" placeholder="Write a note..." value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} maxLength={500} />
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: "none" }} />
            <div className="note-compose-row">
              <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} style={{ flex: 0, padding: ".5rem .8rem" }}>📷</button>
              {notePhoto && <img src={notePhoto} className="note-photo-preview" alt="" />}
              <button className="btn btn-primary" onClick={sendNote} disabled={savingNote || (!noteText.trim() && !notePhoto)} style={{ flex: 1 }}>
                {savingNote ? "..." : "Leave Note"}
              </button>
            </div>
          </div>
          <div className="note-list">
            {notes.map((n) => (
              <div key={n.id} className={`note-card ${n.from === me?.name ? "mine" : "theirs"} fade-in`}>
                <span className="note-from">{n.from}</span>
                {n.text && <p className="note-text">{n.text}</p>}
                {n.photo && <img src={n.photo} className="note-photo" alt="" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== BOUQUETS TAB ===== */}
      {tab === "bouquets" && (
        <div className="os-bouquet-tab fade-in">
          <p className="os-hint">Send a bouquet — they have to water it or it wilts!</p>
          <div className="bouquet-send-row">
            {BOUQUET_TYPES.map((b) => (
              <button key={b.id} className="bouquet-send-btn" onClick={() => sendBouquet(b)}>
                <span>{b.emoji}</span><span className="gift-name">{b.name}</span>
              </button>
            ))}
          </div>
          {bouquets.length > 0 && <h4 style={{ color: "var(--text-dim)", margin: ".75rem 0 .4rem", fontSize: ".8rem" }}>Your Bouquets</h4>}
          <div className="bouquet-list">
            {bouquets.map((b, i) => {
              const health = getBouquetHealth(b);
              return (
                <div key={i} className="bouquet-card">
                  <span className="bouquet-emoji" style={{ opacity: health < 20 ? 0.3 : 1 }}>{b.emoji}</span>
                  <div className="bouquet-info">
                    <span className="bouquet-name">{b.name} <span style={{ fontSize: ".7rem", color: "var(--text-dim)" }}>from {b.from}</span></span>
                    <div className="meter-bar"><div className="meter-fill" style={{ width: `${health}%`, background: health < 30 ? "#ef4444" : health < 60 ? "#f59e0b" : "#34d399" }} /></div>
                    <span style={{ fontSize: ".65rem", color: "var(--text-dim)" }}>{health < 20 ? "Wilting! 😢" : health < 50 ? "Needs water" : "Healthy 🌱"}</span>
                  </div>
                  <button className="btn btn-secondary" onClick={() => waterBouquet(i)} style={{ width: "auto", padding: ".4rem .7rem", fontSize: ".8rem" }}>💧</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== SONGS TAB ===== */}
      {tab === "songs" && (
        <div className="os-songs-tab fade-in">
          <p className="os-hint">Share what's playing in your head</p>
          {theirSong && (
            <div className="song-section fade-in">
              <div className="song-card partner"><span className="song-icon">🎵</span><div className="song-info"><span className="song-who">{theirSong.by || them?.name}'s song</span><span className="song-title">{theirSong.title}</span>{theirSong.link && !theirSong.embedType && <a href={theirSong.link} target="_blank" rel="noopener" className="song-link">Open link ↗</a>}</div></div>
              {theirSong.embedType === "spotify" && <iframe className="song-embed" src={`https://open.spotify.com/embed/${theirSong.embedKind || "track"}/${theirSong.embedId}?theme=0`} allow="encrypted-media" loading="lazy" />}
              {theirSong.embedType === "youtube" && <iframe className="song-embed yt" src={`https://www.youtube-nocookie.com/embed/${theirSong.embedId}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />}
            </div>
          )}
          {mySong && (
            <div className="song-section fade-in">
              <div className="song-card mine"><span className="song-icon">🎶</span><div className="song-info"><span className="song-who">Your song</span><span className="song-title">{mySong.title}</span></div></div>
              {mySong.embedType === "spotify" && <iframe className="song-embed" src={`https://open.spotify.com/embed/${mySong.embedKind || "track"}/${mySong.embedId}?theme=0`} allow="encrypted-media" loading="lazy" />}
              {mySong.embedType === "youtube" && <iframe className="song-embed yt" src={`https://www.youtube-nocookie.com/embed/${mySong.embedId}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />}
            </div>
          )}
          <div className="song-form">
            <input className="input" placeholder="Song name..." value={songInput} onChange={(e) => setSongInput(e.target.value)} maxLength={100} />
            <input className="input" placeholder="Spotify or YouTube link (optional)" value={songLink} onChange={(e) => setSongLink(e.target.value)} />
            <button className="btn btn-primary" onClick={saveSong} disabled={savingSong || (!songInput.trim() && !songLink.trim())}>{savingSong ? "..." : "Share Song 🎵"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
