import { useState, useEffect } from "react";
import { drawCard, setOnline, endRoom, subscribeCustomCards, subscribeFavorites, setMood, sendPoke } from "../firebase";
import { collection, getFirestore, onSnapshot, query, orderBy } from "firebase/firestore";
import { getSavedRooms } from "../App";
import { PhotoImg } from "../components/PhotoViewer";
import { decks, getRandomCard } from "../data/cards";
import PixelChar, { DEFAULT_CHAR } from "../components/PixelChar";
import PixelPet from "../components/PixelPet";
import DiceRoll from "../components/DiceRoll";
import MoodSlider, { getMood, DEFAULT_MOOD } from "../components/MoodSlider";
import { getUnlockedDecks, getUnlockedFeatures, getNextMilestone, getLockedPreviews, MILESTONES } from "../data/milestones";
import Play from "./Play";
import DateBoard from "./DateBoard";
import CharEdit from "./CharEdit";
import Onboarding from "./Onboarding";
import CreateCard from "./CreateCard";
import OurSpace from "./OurSpace";
import Apartment from "./Apartment";
import AnswerHistory from "./AnswerHistory";
import MiniGames from "./MiniGames";
import Tutorial from "./Tutorial";
import { getLevel } from "../data/levels";

// Heart evolves with level — each stage has a relationship phase
const HEART_STAGES = [
  { emoji: "🌱", label: "Planting the seed" },
  { emoji: "🌿", label: "Getting to know you" },
  { emoji: "🌸", label: "Something's blooming" },
  { emoji: "🤍", label: "Soft spot for you" },
  { emoji: "💛", label: "You make me smile" },
  { emoji: "🧡", label: "Can't stop thinking about you" },
  { emoji: "💗", label: "Catching real feelings" },
  { emoji: "💜", label: "You're my person" },
  { emoji: "❤️‍🔥", label: "On fire for you" },
  { emoji: "❤️", label: "All in" },
  { emoji: "💍", label: "Committed" },
  { emoji: "🌌", label: "Written in the stars" },
  { emoji: "⚡", label: "Unstoppable together" },
  { emoji: "🌠", label: "Dreaming together" },
  { emoji: "🏆", label: "Legendary love" },
  { emoji: "⏳", label: "Timeless connection" },
  { emoji: "💫", label: "Eternal flame" },
  { emoji: "🪐", label: "Cosmic bond" },
  { emoji: "♾️", label: "Infinite love" },
  { emoji: "❤️", label: "Forever yours" },
];
function getHeart(level) {
  return HEART_STAGES[Math.min(level, HEART_STAGES.length) - 1] || HEART_STAGES[0];
}

export default function Hub({ room, playerId, roomData, onLeave, onSwitchRoom }) {
  const [view, setView] = useState("hub");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showHeartbreak, setShowHeartbreak] = useState(false);
  const [showDice, setShowDice] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(true);
  const [customCards, setCustomCards] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [toast, setToast] = useState(null);
  const [wasPartnerOnline, setWasPartnerOnline] = useState(false);
  const [lastPokeId, setLastPokeId] = useState(null);
  const [pokeCooldown, setPokeCooldown] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [dismissedCard, setDismissedCard] = useState(null); // card ID we chose to leave
  const [unreadNotes, setUnreadNotes] = useState([]);
  const [showUnreadNotes, setShowUnreadNotes] = useState(false);

  const p1 = roomData?.player1;
  const p2 = roomData?.player2;
  const isP1 = playerId === p1?.id;
  const me = isP1 ? p1 : p2;
  const them = isP1 ? p2 : p1;
  const xp = roomData?.xp || 0;
  const streak = roomData?.streak || 0;
  const lvl = getLevel(xp);
  const playedCards = roomData?.playedCards || [];
  const currentCard = roomData?.currentCard;
  const ended = roomData?.ended;

  // Partner's mood (theme applied at App level now)
  const partnerMoodId = them?.id ? roomData?.[`mood_${them.id}`] : null;
  const myMoodId = me?.id ? roomData?.[`mood_${me.id}`] : null;
  const partnerMood = partnerMoodId ? getMood(partnerMoodId) : null;

  async function handleMoodSet(moodId) {
    await setMood(room, playerId, moodId);
    setShowMoodPicker(false);
  }

  // Presence ping
  useEffect(() => {
    if (!room || !playerId) return;
    setOnline(room, playerId);
    const iv = setInterval(() => setOnline(room, playerId), 30000);
    return () => clearInterval(iv);
  }, [room, playerId]);

  // Ask for notification permission on first load
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Detect partner online/offline transitions
  const partnerOnlineTs = them?.id ? roomData?.[`online_${them.id}`] : null;
  const partnerIsOnline = partnerOnlineTs && (Date.now() - partnerOnlineTs?.toDate?.()?.getTime?.() < 60000);

  useEffect(() => {
    if (!them?.name) return;

    if (partnerIsOnline && !wasPartnerOnline) {
      // Partner just came online
      setToast(`${them.name} is here ✨`);
      setTimeout(() => setToast(null), 4000);

      // Browser notification if tab not focused
      if (document.hidden && "Notification" in window && Notification.permission === "granted") {
        new Notification("vibe check", { body: `${them.name} is online!`, icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✨</text></svg>" });
      }
    }

    setWasPartnerOnline(!!partnerIsOnline);
  }, [partnerIsOnline, them?.name]);

  // Re-check online status every 30s (timestamps go stale)
  const [, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  // Detect pokes from partner
  const lastPoke = roomData?.lastPoke;
  useEffect(() => {
    if (!lastPoke || !me?.name || lastPoke.from === me.name) return;
    if (lastPoke.id === lastPokeId) return;
    setLastPokeId(lastPoke.id);
    setToast(`👉 ${lastPoke.from} poked you!`);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    setTimeout(() => setToast(null), 4000);
    if (document.hidden && "Notification" in window && Notification.permission === "granted") {
      new Notification("vibe check", { body: `${lastPoke.from} poked you! 👉` });
    }
  }, [lastPoke?.id]);

  async function handlePoke() {
    if (pokeCooldown) return;
    setPokeCooldown(true);
    await sendPoke(room, me?.name);
    setToast("👉 Poke sent!");
    setTimeout(() => setToast(null), 2000);
    setTimeout(() => setPokeCooldown(false), 10000);
  }

  // Subscribe custom cards
  useEffect(() => {
    if (!room) return;
    return subscribeCustomCards(room, setCustomCards);
  }, [room]);

  // Subscribe favorites
  useEffect(() => {
    if (!room) return;
    return subscribeFavorites(room, setFavorites);
  }, [room]);

  // Subscribe to unread notes from partner
  useEffect(() => {
    if (!room || !me?.name) return;
    const db = getFirestore();
    return onSnapshot(collection(db, "rooms", room, "notes"), (snap) => {
      const lastSeen = parseInt(localStorage.getItem(`vc_notes_seen_${room}`) || "0");
      const unread = [];
      snap.forEach((d) => {
        const n = { id: d.id, ...d.data() };
        const noteTime = n.at?.toMillis?.() || parseInt(d.id) || 0;
        if (n.from !== me.name && noteTime > lastSeen) unread.push(n);
      });
      unread.sort((a, b) => (a.at?.toMillis?.() || 0) - (b.at?.toMillis?.() || 0));
      if (unread.length > 0) {
        setUnreadNotes(unread);
        setShowUnreadNotes(true);
      }
    });
  }, [room, me?.name]);

  function dismissUnreadNotes() {
    localStorage.setItem(`vc_notes_seen_${room}`, Date.now().toString());
    setShowUnreadNotes(false);
    setUnreadNotes([]);
  }

  // Detect ended
  useEffect(() => {
    if (ended) setShowHeartbreak(true);
  }, [ended]);

  // Active card → play (but not if user dismissed it to go to hub)
  useEffect(() => {
    if (currentCard && view === "hub" && dismissedCard !== currentCard?.cardId) setView("play");
  }, [currentCard, view, dismissedCard]);

  // Reset dismissed when card changes (partner answered, new card drawn)
  useEffect(() => {
    if (!currentCard || currentCard?.cardId !== dismissedCard) setDismissedCard(null);
  }, [currentCard?.cardId]);

  async function handleDrawCard(deckId) {
    if (deckId === "custom") {
      const available = customCards.filter((c) => !playedCards.includes(c.id));
      if (available.length === 0) return alert("No custom cards left!");
      const pick = available[Math.floor(Math.random() * available.length)];
      await drawCard(room, "custom", pick.id);
      setView("play");
      return;
    }
    if (deckId === "favorites") {
      const available = favorites.filter((f) => !playedCards.includes("fav-" + f.cardId));
      if (available.length === 0) return alert("No favorites to replay!");
      const pick = available[Math.floor(Math.random() * available.length)];
      await drawCard(room, pick.deckId || "favorites", "fav-" + pick.cardId);
      setView("play");
      return;
    }
    const card = getRandomCard(deckId, playedCards);
    if (!card) return alert("You've played all cards in this deck!");
    await drawCard(room, deckId, card.id);
    setView("play");
  }

  async function handleEnd() {
    setShowEndConfirm(false);
    await endRoom(room, me?.name);
  }

  // Loading — roomData hasn't arrived yet
  if (!roomData) {
    return (
      <div className="page">
        <div className="waiting-card fade-in">
          <div className="logo-glow">✨</div>
          <p style={{ color: "var(--text-dim)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Heartbreak
  if (showHeartbreak) {
    return (
      <div className="page">
        <div className="heartbreak-screen fade-in">
          <div className="heartbreak-emoji"><span className="heart-left">💔</span></div>
          <h2>It's over</h2>
          <p className="heartbreak-text">{roomData?.endedByName || "Someone"} ended the vibe check.</p>
          <p className="heartbreak-sub">Some things aren't meant to be — and that's okay.<br />The right person won't need convincing.</p>
          <div className="heartbreak-stats">
            <span>{playedCards.length} cards played</span>
            <span>Level {lvl.level} reached</span>
            <span>{streak} day streak</span>
          </div>
          <button className="btn btn-secondary" onClick={() => { setShowHeartbreak(false); setView("dateboard"); }}>View Our Answers</button>
          <button className="btn btn-ghost" onClick={onLeave}>Leave</button>
        </div>
        <div className="falling-hearts" aria-hidden="true">
          {[...Array(12)].map((_, i) => (
            <span key={i} className="falling-heart" style={{ left: `${Math.random()*100}%`, animationDelay: `${Math.random()*3}s`, animationDuration: `${2+Math.random()*3}s` }}>💔</span>
          ))}
        </div>
      </div>
    );
  }

  // Waiting
  if (!p2) {
    return (
      <div className="page">
        <div className="waiting-card fade-in">
          <PixelChar config={me?.character || DEFAULT_CHAR} state="walk" size={5} />
          <h2>Waiting for your person...</h2>
          <p>Share this code:</p>
          <div className="room-code">{room}</div>
          <button className="btn btn-secondary" onClick={() => navigator.clipboard?.writeText(room)}>Copy Code</button>
          <button className="btn btn-ghost" onClick={onLeave} style={{ marginTop: "2rem" }}>Leave</button>
        </div>
      </div>
    );
  }

  // Onboarding for partner on first join
  const isPartner = playerId !== p1?.id;
  const needsOnboarding = isPartner && roomData?.onboarded === false;

  if (needsOnboarding && !onboarded) {
    return (
      <Onboarding
        creatorName={roomData?.creatorName || p1?.name || "Someone"}
        partnerName={roomData?.partnerName || me?.name || "you"}
        welcomeMsg={roomData?.welcomeMsg || ""}
        room={room}
        onDone={() => setOnboarded(true)}
      />
    );
  }

  // Mood picker on entry
  if (showMoodPicker && p2 && !ended) {
    return (
      <div className="page">
        <MoodSlider currentMood={myMoodId || DEFAULT_MOOD} onSelect={handleMoodSet} />
        <button className="btn btn-ghost" onClick={() => setShowMoodPicker(false)} style={{ marginTop: ".5rem" }}>
          Skip
        </button>
      </div>
    );
  }

  // Unread notes popup
  if (showUnreadNotes && unreadNotes.length > 0) {
    return (
      <div className="page">
        <div className="unread-notes-popup fade-in">
          <div className="unread-notes-header">
            <span className="unread-notes-emoji">📝</span>
            <h2>{them?.name} left you {unreadNotes.length === 1 ? "a note" : `${unreadNotes.length} notes`}</h2>
          </div>
          <div className="unread-notes-list">
            {unreadNotes.map((n) => (
              <div key={n.id} className="unread-note-card fade-in">
                {n.text && <p className="unread-note-text">{n.text}</p>}
                {n.photo && <PhotoImg src={n.photo} className="unread-note-photo" />}
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={dismissUnreadNotes} style={{ marginTop: ".75rem" }}>
            Got it
          </button>
        </div>
      </div>
    );
  }

  // Sub-views
  if (view === "play" && currentCard) return <Play room={room} playerId={playerId} roomData={roomData} customCards={customCards} favorites={favorites} onBack={() => { setDismissedCard(currentCard?.cardId); setView("hub"); }} />;
  if (view === "dateboard") return <DateBoard room={room} playerId={playerId} p1={p1} p2={p2} onBack={() => setView("hub")} />;
  if (view === "charedit") return <CharEdit room={room} playerId={playerId} roomData={roomData} onBack={() => setView("hub")} />;
  if (view === "createcard") return <CreateCard room={room} onBack={() => setView("hub")} />;
  if (view === "ourspace") return <OurSpace room={room} playerId={playerId} roomData={roomData} onBack={() => setView("hub")} />;
  if (view === "apartment") return <Apartment room={room} playerId={playerId} roomData={roomData} onBack={() => setView("hub")} />;
  if (view === "games") return <MiniGames room={room} playerId={playerId} roomData={roomData} onBack={() => setView("hub")} />;
  if (view === "answers") return <AnswerHistory room={room} playerId={playerId} roomData={roomData} onBack={() => setView("hub")} />;
  if (view === "tutorial") return <Tutorial type="cards" onBack={() => setView("hub")} />;
  if (view === "tutorial-games") return <Tutorial type="games" onBack={() => setView("hub")} />;

  // Milestones
  const unlockedDeckIds = getUnlockedDecks(lvl.level);
  const features = getUnlockedFeatures(lvl.level);
  const nextMs = getNextMilestone(lvl.level);
  const lockedPreviews = getLockedPreviews(lvl.level);

  // Is there a card waiting for partner? Lock card drawing
  const waitingForPartner = currentCard && dismissedCard === currentCard?.cardId;

  // Build all decks including custom + favorites
  const customRemaining = customCards.filter((c) => !playedCards.includes(c.id)).length;
  const favRemaining = favorites.filter((f) => !playedCards.includes("fav-" + f.cardId)).length;

  const allDecks = decks.map((d) => ({
    ...d,
    remaining: d.cards.filter((c) => !playedCards.includes(c.id)).length,
    locked: !unlockedDeckIds.has(d.id),
  }));

  // Available decks for dice roll (unlocked + cards remaining)
  const availableForDice = allDecks.filter((d) => d.remaining > 0 && !d.locked);

  return (
    <div className="page hub fade-in">
      {/* Partner mood banner */}
      {partnerMood && (
        <div className="mood-banner fade-in" style={{ borderColor: partnerMood.accent + "44" }}>
          <span>{partnerMood.emoji}</span>
          <span className="mood-banner-text">{them?.name} is feeling <strong>{partnerMood.label.toLowerCase()}</strong></span>
          <button className="mood-change-btn" onClick={() => setShowMoodPicker(true)}>Update yours</button>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="toast slide-down">{toast}</div>
      )}

      {/* Characters + Pets on sides */}
      {(() => {
        const allPets = (roomData?.pets || (roomData?.pet ? [roomData.pet] : [])).slice(0, 2);
        const pid = them?.id;
        const myPets = [];
        const theirPets = [];
        allPets.forEach((p, i) => {
          const counts = p.careCount || {};
          const myC = counts[playerId] || 0;
          const theirC = counts[pid] || 0;
          if (myC > theirC) myPets.push(p);
          else if (theirC > myC) theirPets.push(p);
          else (i % 2 === 0 ? myPets : theirPets).push(p);
        });
        if (allPets.length === 2 && myPets.length === 2) theirPets.push(myPets.pop());
        if (allPets.length === 2 && theirPets.length === 2) myPets.push(theirPets.pop());

        return (
          <div className="hub-chars">
            {/* My side: pet + character */}
            <div className="hub-char-side" onClick={() => setView("charedit")}>
              {myPets.length > 0 && (
                <div className="hub-side-pet" onClick={(e) => { e.stopPropagation(); setView("ourspace"); }}>
                  {myPets.map((p, i) => <PixelPet key={i} type={p.type} state="happy" size={3} />)}
                </div>
              )}
              <div className="hub-char-inner">
                <div className="char-with-status">
                  <PixelChar config={me?.character || DEFAULT_CHAR} state="idle" size={4} />
                  <span className="online-dot on" />
                </div>
                <span className="hub-char-name">{me?.name}</span>
              </div>
            </div>

            {/* Heart in center */}
            <div className="hub-heart-wrap">
              <div className="hub-heart">{getHeart(lvl.level).emoji}</div>
              <span className="hub-phase">{getHeart(lvl.level).label}</span>
            </div>

            {/* Their side: character + pet — tap to poke */}
            <div className="hub-char-side them" onClick={() => { if (!pokeCooldown) handlePoke(); }}>
              <div className="hub-char-inner">
                <div className="char-with-status">
                  <PixelChar config={them?.character || DEFAULT_CHAR} state={partnerIsOnline ? "idle" : "walk"} size={4} />
                  <span className={`online-dot ${partnerIsOnline ? "on" : "off"}`} />
                </div>
                <span className="hub-char-name">
                  {them?.name}
                  {partnerIsOnline && <span className="online-label"> online</span>}
                </span>
              </div>
              {theirPets.length > 0 && (
                <div className="hub-side-pet" onClick={(e) => { e.stopPropagation(); setView("ourspace"); }}>
                  {theirPets.map((p, i) => <PixelPet key={i} type={p.type} state="happy" size={3} />)}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Stats */}
      <div className="hub-stats">
        <div className="stat-card">
          <span className="stat-num">Lv.{lvl.level}</span>
          <div className="xp-bar"><div className="xp-fill" style={{ width: `${(lvl.current / lvl.needed) * 100}%` }} /></div>
          <span className="stat-label">{lvl.current}/{lvl.needed} XP</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">🔥 {streak}</span>
          <span className="stat-label">streak</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">🃏 {playedCards.length}</span>
          <span className="stat-label">cards</span>
        </div>
        <div className="stat-card" onClick={() => setView("games")} style={{ cursor: "pointer" }}>
          <span className="stat-num">🏆 {(roomData?.leaderboard?.[playerId] || 0)}-{(roomData?.leaderboard?.[them?.id] || 0)}</span>
          <span className="stat-label">games</span>
        </div>
      </div>

      {/* Next milestone */}
      {nextMs && (
        <div className="milestone-preview">
          <span className="milestone-next-label">Next unlock:</span>
          <span className="milestone-next-info">{nextMs.emoji} Lv.{nextMs.level} — {nextMs.unlock}</span>
        </div>
      )}

      {/* Partner's song — subtle bar */}
      {(() => {
        const theirSong = them?.id ? roomData?.[`song_${them.id}`] : null;
        return theirSong ? (
          <div className="hub-song fade-in" onClick={() => setView("ourspace")}>
            <span>🎵</span>
            <span className="hub-song-text">{them?.name}: <em>{theirSong.title}</em></span>
          </div>
        ) : null;
      })()}

      {/* Feature buttons */}
      <div className="hub-feature-row">
        {(features.has("pet") || features.has("notes")) && (
          <button className="btn btn-secondary" onClick={() => setView("ourspace")}>🐾 Our Space</button>
        )}
        {features.has("apartment") && (
          <button className="btn btn-secondary" onClick={() => setView("apartment")}>🏠 Home</button>
        )}
        <button className="btn btn-secondary" onClick={() => setView("games")}>
          🎮 Games {partnerIsOnline && <span style={{ fontSize: ".6rem", color: "var(--green)" }}> LIVE</span>}
        </button>
      </div>

      {/* Waiting banner */}
      {waitingForPartner && (
        <div className="waiting-banner fade-in">
          <span className="pulse-dot" style={{ display: "inline-block", width: 8, height: 8 }} />
          <span>Waiting for {them?.name} to answer...</span>
          <button className="btn btn-ghost" onClick={() => { setDismissedCard(null); setView("play"); }} style={{ width: "auto", padding: ".3rem .6rem", fontSize: ".75rem" }}>View card</button>
        </div>
      )}

      {/* Dice roll button */}
      <button className="btn btn-primary dice-btn" onClick={() => setShowDice(true)} disabled={waitingForPartner}>
        🎲 Roll for a Deck
      </button>

      {/* Deck grid */}
      <div className="hub-section-row">
        <h3 className="hub-section-title">Or pick a deck</h3>
        <button className="btn btn-ghost tutorial-link" onClick={() => setView("tutorial")}>How to Play</button>
      </div>
      <div className="deck-grid">
        {allDecks.map((d) => (
          <button
            key={d.id}
            className={`deck-card ${d.locked ? "locked" : ""}`}
            style={{ borderColor: d.locked ? "rgba(255,255,255,.04)" : d.color + "44", background: d.locked ? "rgba(255,255,255,.02)" : d.color + "11" }}
            onClick={() => !d.locked && !waitingForPartner && handleDrawCard(d.id)}
            disabled={d.remaining === 0 || d.locked || waitingForPartner}
          >
            {d.locked ? (
              <>
                <span className="deck-emoji">🔒</span>
                <span className="deck-name">{d.name}</span>
                <span className="deck-remaining locked-label">Unlocks later</span>
              </>
            ) : (
              <>
                <span className="deck-emoji">{d.emoji}</span>
                <span className="deck-name">{d.name}</span>
                <span className="deck-remaining" style={{ color: d.color }}>{d.remaining} left</span>
              </>
            )}
          </button>
        ))}

        {/* Custom deck */}
        <button
          className="deck-card"
          style={{ borderColor: "#f472b644", background: "#f472b611" }}
          onClick={() => handleDrawCard("custom")}
          disabled={customRemaining === 0}
        >
          <span className="deck-emoji">✏️</span>
          <span className="deck-name">Custom</span>
          <span className="deck-remaining" style={{ color: "#f472b6" }}>{customRemaining} left</span>
        </button>

        {/* Favorites replay */}
        {favorites.length > 0 && (
          <button
            className="deck-card"
            style={{ borderColor: "#f43f5e44", background: "#f43f5e11" }}
            onClick={() => handleDrawCard("favorites")}
            disabled={favRemaining === 0}
          >
            <span className="deck-emoji">❤️</span>
            <span className="deck-name">Favorites</span>
            <span className="deck-remaining" style={{ color: "#f43f5e" }}>{favRemaining} left</span>
          </button>
        )}
      </div>

      {/* Quick links */}
      <div className="hub-links">
        <button className="btn btn-secondary" onClick={() => setView("createcard")}>
          ✏️ Create Card
        </button>
        <button className="btn btn-secondary" onClick={() => setView("dateboard")}>
          📌 Date Board
        </button>
      </div>
      <div className="hub-links">
        <button className="btn btn-secondary" onClick={() => setView("answers")}>
          💬 Our Answers
        </button>
      </div>
      <div className="hub-links">
        <button className="btn btn-secondary" onClick={() => setView("charedit")}>
          🎨 Character
        </button>
        <button className="btn btn-secondary" onClick={() => navigator.clipboard?.writeText(room)}>
          🔗 {(() => { const sr = getSavedRooms().find(r => r.code === room); return sr?.nickname || room; })()}
        </button>
      </div>

      {/* Coming Soon — locked previews */}
      {lockedPreviews.length > 0 && (
        <>
          <h3 className="hub-section-title">Coming Soon</h3>
          <div className="locked-previews">
            {lockedPreviews.map((p) => (
              <div key={p.feature} className="locked-preview-card">
                <span className="lp-emoji">{p.emoji}</span>
                <div className="lp-info">
                  <span className="lp-label">{p.label}</span>
                  <span className="lp-desc">{p.desc}</span>
                </div>
                <span className="lp-level">Lv.{p.level}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="hub-footer">
        {(() => {
          // "End It" fades in based on partner inactivity
          // Hidden if active within 3 days. Fades from 0→1 over days 3-7.
          const lastSeen = partnerOnlineTs?.toDate?.()?.getTime?.() || 0;
          const daysSince = (Date.now() - lastSeen) / 86400000;
          if (daysSince < 3) return null;
          const opacity = Math.min(1, (daysSince - 3) / 4); // 0 at day 3, 1 at day 7
          return (
            <button className="btn btn-ghost" onClick={() => setShowEndConfirm(true)}
              style={{ opacity, transition: "opacity .5s" }}>End It 💔</button>
          );
        })()}
        {onSwitchRoom && (
          <button className="btn btn-secondary" onClick={onSwitchRoom}>Switch Room</button>
        )}
        <button className="btn btn-ghost" onClick={onLeave}>Leave Room</button>
      </div>

      {/* Dice overlay */}
      {showDice && (
        <DiceRoll
          availableDecks={availableForDice}
          onResult={(deckId) => { setShowDice(false); handleDrawCard(deckId); }}
          onCancel={() => setShowDice(false)}
        />
      )}

      {/* End confirmation */}
      {showEndConfirm && (
        <div className="modal-overlay fade-in" onClick={() => setShowEndConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-emoji">💔</div>
            <h3>End the vibe check?</h3>
            <p>This can't be undone. They'll see it too.</p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowEndConfirm(false)}>Nevermind</button>
              <button className="btn btn-danger" onClick={handleEnd}>End It</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
