import { useState, useEffect } from "react";
import { updateDoc, doc, getFirestore, serverTimestamp, setDoc, onSnapshot, collection } from "firebase/firestore";
import PixelPet, { PET_TYPES, PET_NAMES_DEFAULT } from "../components/PixelPet";

const GIFTS = [
  { id: "rose", emoji: "🌹", name: "Rose", hasMessage: false },
  { id: "sunflower", emoji: "🌻", name: "Sunflower", hasMessage: false },
  { id: "tulip", emoji: "🌷", name: "Tulip", hasMessage: false },
  { id: "heart", emoji: "💝", name: "Heart", hasMessage: false },
  { id: "star", emoji: "⭐", name: "Star", hasMessage: false },
  { id: "cookie", emoji: "🍪", name: "Cookie", hasMessage: false },
  { id: "letter", emoji: "💌", name: "Love Letter", hasMessage: true },
  { id: "teddy", emoji: "🧸", name: "Teddy Bear", hasMessage: false },
  { id: "hug", emoji: "🤗", name: "Virtual Hug", hasMessage: false },
  { id: "kiss", emoji: "💋", name: "Kiss", hasMessage: false },
];

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
  const hunger = Math.max(0, Math.min(100, 100 - hoursSinceFed * 4));
  const lastPetted = toDate(pet?.lastPetted);
  const hoursSincePetted = (Date.now() - lastPetted.getTime()) / 3600000;
  const happiness = Math.max(0, Math.min(100, 100 - hoursSincePetted * 3));
  const state = hunger < 20 || happiness < 20 ? "idle" : "happy";
  return { hunger, happiness, state };
}

export default function OurSpace({ room, playerId, roomData, onBack }) {
  const [tab, setTab] = useState("pet");
  const [giftHistory, setGiftHistory] = useState([]);
  const [sending, setSending] = useState(false);
  const [petAction, setPetAction] = useState(null);
  const [selectedPet, setSelectedPet] = useState(0);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  // Gift message (for love letter etc)
  const [pendingGift, setPendingGift] = useState(null);
  const [giftMessage, setGiftMessage] = useState("");
  // Song on my mind
  const [songInput, setSongInput] = useState("");
  const [songLink, setSongLink] = useState("");
  const [savingSong, setSavingSong] = useState(false);

  const db = getFirestore();
  const pets = roomData?.pets || [];
  const legacyPet = roomData?.pet;
  const allPets = pets.length > 0 ? pets : (legacyPet ? [legacyPet] : []);

  const p1 = roomData?.player1;
  const p2 = roomData?.player2;
  const isP1 = playerId === p1?.id;
  const me = isP1 ? p1 : p2;
  const them = isP1 ? p2 : p1;
  const partnerId = them?.id;

  const pet = allPets[selectedPet];
  const stats = pet ? getPetStats(pet) : null;

  // My current song & partner's song
  const mySong = roomData?.[`song_${playerId}`];
  const theirSong = partnerId ? roomData?.[`song_${partnerId}`] : null;

  useEffect(() => {
    return onSnapshot(collection(db, "rooms", room, "gifts"), (snap) => {
      const g = [];
      snap.forEach((d) => g.push({ id: d.id, ...d.data() }));
      g.sort((a, b) => (b.at?.toMillis?.() || 0) - (a.at?.toMillis?.() || 0));
      setGiftHistory(g);
    });
  }, [room]);

  const MAX_PETS = 2;

  async function adoptPet(type) {
    if (allPets.length >= MAX_PETS) return;
    const now = new Date();
    const newPet = { type, name: PET_NAMES_DEFAULT[type], lastFed: now, lastPetted: now, careCount: { [playerId]: 1 } };
    const updated = [...allPets, newPet];
    await updateDoc(doc(db, "rooms", room), { pets: updated });
    setSelectedPet(updated.length - 1);
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

  async function handleRename() {
    if (!newName.trim() || !pet) return;
    const updated = [...allPets];
    updated[selectedPet] = { ...updated[selectedPet], name: newName.trim() };
    await updateDoc(doc(db, "rooms", room), { pets: updated });
    setRenaming(false);
    setNewName("");
  }

  function handleGiftTap(gift) {
    if (gift.hasMessage) {
      setPendingGift(gift);
      setGiftMessage("");
    } else {
      sendGift(gift, "");
    }
  }

  async function sendGift(gift, message) {
    setSending(true);
    await setDoc(doc(db, "rooms", room, "gifts", Date.now().toString()), {
      ...gift, from: me?.name, to: them?.name, message: message || "", at: serverTimestamp(),
    });
    setSending(false);
    setPendingGift(null);
    setGiftMessage("");
  }

  async function saveSong() {
    if (!songInput.trim() && !songLink.trim()) return;
    setSavingSong(true);
    const link = songLink.trim();
    const embed = parseEmbed(link);
    await updateDoc(doc(db, "rooms", room), {
      [`song_${playerId}`]: {
        title: songInput.trim() || link,
        link: link || "",
        embedType: embed?.type || null,
        embedId: embed?.id || null,
        embedKind: embed?.kind || null,
        at: new Date(),
        by: me?.name,
      },
    });
    setSavingSong(false);
    setSongInput("");
    setSongLink("");
  }

  // Parse Spotify / YouTube / Apple Music links into embeddable IDs
  function parseEmbed(url) {
    if (!url) return null;
    // Spotify: https://open.spotify.com/track/abc123?si=xyz
    let m = url.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (m) return { type: "spotify", kind: m[1], id: m[2] };
    // YouTube: https://www.youtube.com/watch?v=abc123 or https://youtu.be/abc123
    m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (m) return { type: "youtube", id: m[1] };
    return null;
  }

  return (
    <div className="page ourspace fade-in">
      <div className="os-header">
        <button className="btn btn-ghost back-btn" onClick={onBack}>←</button>
        <h2>Our Space</h2>
      </div>

      <div className="os-tabs">
        <button className={`os-tab ${tab === "pet" ? "active" : ""}`} onClick={() => setTab("pet")}>🐾 Pets</button>
        <button className={`os-tab ${tab === "gifts" ? "active" : ""}`} onClick={() => setTab("gifts")}>🎁 Gifts</button>
        <button className={`os-tab ${tab === "songs" ? "active" : ""}`} onClick={() => setTab("songs")}>🎵 Songs</button>
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
              {allPets.length < MAX_PETS && (
                <button className="pet-sel-btn add" onClick={() => setSelectedPet(-1)}>
                  <span className="pet-add-icon">+</span>
                  <span>New</span>
                </button>
              )}
            </div>
          )}

          {(allPets.length === 0 || (selectedPet === -1 && allPets.length < MAX_PETS)) && (
            <div className="pet-adopt">
              <h3>{allPets.length === 0 ? "Adopt your first pet!" : "Add a second pet!"}</h3>
              <p className="os-hint">Pick one — you'll both take care of it</p>
              <div className="pet-grid">
                {PET_TYPES.map((t) => (
                  <button key={t} className="pet-option" onClick={() => adoptPet(t)}>
                    <PixelPet type={t} state="happy" size={5} />
                    <span>{PET_NAMES_DEFAULT[t]}</span>
                    <span className="pet-type-label">{t}</span>
                  </button>
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
                  <div className="meter-bar">
                    <div className="meter-fill" style={{ width: `${stats.hunger}%`, background: stats.hunger < 30 ? "#ef4444" : stats.hunger < 60 ? "#f59e0b" : "#34d399" }} />
                  </div>
                </div>
                <div className="pet-meter">
                  <span className="meter-label">💕 Happy</span>
                  <div className="meter-bar">
                    <div className="meter-fill" style={{ width: `${stats.happiness}%`, background: stats.happiness < 30 ? "#ef4444" : stats.happiness < 60 ? "#f59e0b" : "#34d399" }} />
                  </div>
                </div>
              </div>

              <div className="pet-actions">
                <button className="btn btn-secondary" onClick={feedPet} disabled={stats.hunger > 90}>🍖 Feed</button>
                <button className="btn btn-secondary" onClick={petThePet} disabled={stats.happiness > 90}>💕 Pet</button>
              </div>

              <p className="os-hint" style={{ marginTop: ".5rem" }}>
                {stats.hunger < 30 ? `${pet.name} is hungry!` : stats.happiness < 30 ? `${pet.name} wants attention!` : `${pet.name} is doing great!`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ===== GIFTS TAB ===== */}
      {tab === "gifts" && (
        <div className="os-gifts-tab fade-in">
          <p className="os-hint">Send {them?.name} something nice</p>

          {/* Gift message modal */}
          {pendingGift && (
            <div className="gift-compose fade-in">
              <div className="gift-compose-header">
                <span className="gift-compose-emoji">{pendingGift.emoji}</span>
                <span>Write a {pendingGift.name.toLowerCase()}</span>
              </div>
              <textarea
                className="input textarea"
                placeholder="Write your message..."
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                rows={4}
                maxLength={500}
                autoFocus
              />
              <div className="gift-compose-actions">
                <button className="btn btn-ghost" onClick={() => setPendingGift(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => sendGift(pendingGift, giftMessage)} disabled={sending || !giftMessage.trim()}>
                  {sending ? "..." : "Send 💌"}
                </button>
              </div>
            </div>
          )}

          {!pendingGift && (
            <div className="gift-grid">
              {GIFTS.map((g) => (
                <button key={g.id} className="gift-btn" onClick={() => handleGiftTap(g)} disabled={sending}>
                  <span className="gift-emoji">{g.emoji}</span>
                  <span className="gift-name">{g.name}</span>
                </button>
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

      {/* ===== SONGS TAB ===== */}
      {tab === "songs" && (
        <div className="os-songs-tab fade-in">
          <p className="os-hint">Share what's playing in your head</p>

          {/* Partner's song */}
          {theirSong && (
            <div className="song-section fade-in">
              <div className="song-card partner">
                <span className="song-icon">🎵</span>
                <div className="song-info">
                  <span className="song-who">{theirSong.by || them?.name}'s song</span>
                  <span className="song-title">{theirSong.title}</span>
                  {theirSong.link && !theirSong.embedType && (
                    <a href={theirSong.link} target="_blank" rel="noopener" className="song-link">Open link ↗</a>
                  )}
                </div>
              </div>
              {/* Embedded player */}
              {theirSong.embedType === "spotify" && (
                <iframe
                  className="song-embed"
                  src={`https://open.spotify.com/embed/${theirSong.embedKind || "track"}/${theirSong.embedId}?theme=0`}
                  allow="encrypted-media"
                  loading="lazy"
                />
              )}
              {theirSong.embedType === "youtube" && (
                <iframe
                  className="song-embed yt"
                  src={`https://www.youtube-nocookie.com/embed/${theirSong.embedId}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              )}
            </div>
          )}

          {/* My song */}
          {mySong && (
            <div className="song-section fade-in">
              <div className="song-card mine">
                <span className="song-icon">🎶</span>
                <div className="song-info">
                  <span className="song-who">Your song</span>
                  <span className="song-title">{mySong.title}</span>
                  {mySong.link && !mySong.embedType && (
                    <a href={mySong.link} target="_blank" rel="noopener" className="song-link">Open link ↗</a>
                  )}
                </div>
              </div>
              {mySong.embedType === "spotify" && (
                <iframe
                  className="song-embed"
                  src={`https://open.spotify.com/embed/${mySong.embedKind || "track"}/${mySong.embedId}?theme=0`}
                  allow="encrypted-media"
                  loading="lazy"
                />
              )}
              {mySong.embedType === "youtube" && (
                <iframe
                  className="song-embed yt"
                  src={`https://www.youtube-nocookie.com/embed/${mySong.embedId}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              )}
            </div>
          )}

          {/* Update song */}
          <div className="song-form">
            <input
              className="input"
              placeholder="Song name..."
              value={songInput}
              onChange={(e) => setSongInput(e.target.value)}
              maxLength={100}
            />
            <input
              className="input"
              placeholder="Paste Spotify or YouTube link (optional)"
              value={songLink}
              onChange={(e) => setSongLink(e.target.value)}
            />
            <button className="btn btn-primary" onClick={saveSong} disabled={savingSong || (!songInput.trim() && !songLink.trim())}>
              {savingSong ? "..." : "Share Song 🎵"}
            </button>
          </div>

          <p className="os-hint" style={{ marginTop: ".5rem" }}>
            Paste a Spotify or YouTube link and they can play it right here
          </p>
        </div>
      )}
    </div>
  );
}
