import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Hub from "./pages/Hub";
import RoomList from "./pages/RoomList";
import { subscribeRoom } from "./firebase";
import MoodParticles from "./components/MoodParticles";
import { applyMoodTheme } from "./components/MoodSlider";

const APP_VERSION = "3.0";
const UPDATE_NOTES = [
  "500 cards across all 10 decks (was 190) — way more to play",
  "3 new mini games: Emoji Guess, Rank It, Higher Lower",
  "100 Speed WYR questions & 95 trivia questions",
  "How to Play tutorials for every deck and game",
  "Games now wait for both players before starting",
  "Answer history card stack — swipe through old answers",
  "20 levels (was 10) with new unlocks all the way up",
  "14 new gifts including Diamond, Crown, Ring & Soulmate",
  "7 new apartment rooms: Study, Rooftop, Garden, Arcade & more",
  "20 moods (was 12) — Grateful, Nostalgic, Focused & more",
  "10 bouquet types (was 3) — Cherry Blossoms, Midnight Garden...",
  "More character options: skin tones, hair colors, outfits, shoes",
  "24 memory emojis (was 8) for bigger variety",
  "Switch Room button to hop between rooms easily",
];

// ---- Room list helpers ----

export function getSavedRooms() {
  try {
    return JSON.parse(localStorage.getItem("vc_rooms") || "[]");
  } catch { return []; }
}

export function saveRoomToList(code, pid, myName, partnerName) {
  const rooms = getSavedRooms();
  const idx = rooms.findIndex((r) => r.code === code);
  const entry = {
    code,
    pid,
    nickname: idx >= 0 ? rooms[idx].nickname || "" : "",
    myName: myName || (idx >= 0 ? rooms[idx].myName : "") || "",
    partnerName: partnerName || (idx >= 0 ? rooms[idx].partnerName : "") || "",
    lastAccessed: Date.now(),
  };
  if (idx >= 0) {
    rooms[idx] = { ...rooms[idx], ...entry };
  } else {
    rooms.push(entry);
  }
  localStorage.setItem("vc_rooms", JSON.stringify(rooms));
}

function removeRoomFromList(code) {
  const rooms = getSavedRooms().filter((r) => r.code !== code);
  localStorage.setItem("vc_rooms", JSON.stringify(rooms));
}

function renameRoom(code, nickname) {
  const rooms = getSavedRooms();
  const idx = rooms.findIndex((r) => r.code === code);
  if (idx >= 0) {
    rooms[idx].nickname = nickname;
    localStorage.setItem("vc_rooms", JSON.stringify(rooms));
  }
}

function updateRoomAccess(code) {
  const rooms = getSavedRooms();
  const idx = rooms.findIndex((r) => r.code === code);
  if (idx >= 0) {
    rooms[idx].lastAccessed = Date.now();
    localStorage.setItem("vc_rooms", JSON.stringify(rooms));
  }
}

// Migrate legacy single-room localStorage to rooms list
function migrateLegacyRoom() {
  const code = localStorage.getItem("vc_room");
  const pid = localStorage.getItem("vc_pid");
  if (code && pid) {
    const rooms = getSavedRooms();
    if (!rooms.some((r) => r.code === code)) {
      saveRoomToList(code, pid, "", "");
    }
  }
}

// Migrate legacy single-room localStorage to rooms list on first load
migrateLegacyRoom();

// Extract ?code=XYZ from URL
function getCodeFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("code")?.toUpperCase() || null;
}

function WhatsNew({ onDismiss }) {
  return (
    <div className="modal-overlay fade-in" onClick={onDismiss} style={{ overflowY: "auto", padding: "2rem 1rem" }}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360, maxHeight: "80dvh", display: "flex", flexDirection: "column" }}>
        <div className="modal-emoji">✨</div>
        <h3>What's New</h3>
        <div style={{ textAlign: "left", fontSize: ".85rem", color: "var(--text)", lineHeight: 1.7, overflowY: "auto", flex: 1 }}>
          {UPDATE_NOTES.map((note, i) => (
            <p key={i} style={{ marginBottom: ".3rem" }}>
              <span style={{ color: "var(--accent)", marginRight: ".4rem" }}>•</span>{note}
            </p>
          ))}
        </div>
        <button className="btn btn-primary" onClick={onDismiss} style={{ marginTop: "1rem", flexShrink: 0 }}>
          Let's go!
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [inviteCode] = useState(getCodeFromURL);

  // If there's an invite code and localStorage points to a DIFFERENT room, clear it
  // so the invite flow takes over
  const storedRoom = localStorage.getItem("vc_room");
  const storedPid = localStorage.getItem("vc_pid");
  const shouldShowInvite = inviteCode && (!storedRoom || storedRoom !== inviteCode);

  const [room, setRoom] = useState(shouldShowInvite ? null : storedRoom);
  const [playerId, setPlayerId] = useState(shouldShowInvite ? null : storedPid);
  const [roomData, setRoomData] = useState(null);
  const [showHome, setShowHome] = useState(false); // force Home for new/join
  const [showWhatsNew, setShowWhatsNew] = useState(() => {
    const seen = localStorage.getItem("vc_version");
    return seen !== APP_VERSION;
  });

  useEffect(() => {
    if (!room) return;
    return subscribeRoom(room, (data) => {
      if (data) {
        setRoomData(data);
        // Update room list with partner name once available
        const myName = playerId === data.player1?.id ? data.player1?.name : data.player2?.name;
        const theirName = playerId === data.player1?.id ? data.player2?.name : data.player1?.name;
        if (myName || theirName) {
          saveRoomToList(room, playerId, myName, theirName);
        }
      } else {
        // Room was deleted or doesn't exist — clear and go to landing
        localStorage.removeItem("vc_room");
        localStorage.removeItem("vc_pid");
        removeRoomFromList(room);
        setRoom(null);
        setPlayerId(null);
        setRoomData(null);
      }
    });
  }, [room, playerId]);

  const p1 = roomData?.player1;
  const p2 = roomData?.player2;
  const isP1 = playerId === p1?.id;
  const them = isP1 ? p2 : p1;
  const partnerMoodId = them?.id ? roomData?.[`mood_${them.id}`] : null;

  useEffect(() => {
    if (partnerMoodId) applyMoodTheme(partnerMoodId);
  }, [partnerMoodId]);

  function handleJoin(code, pid) {
    setRoom(code);
    setPlayerId(pid);
    setShowHome(false);
    // Save to room list
    saveRoomToList(code, pid, "", "");
    // Clean the URL so the code doesn't stick around
    if (window.history.replaceState) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }

  function handleLeave() {
    // Keep room in list but clear active
    localStorage.removeItem("vc_room");
    localStorage.removeItem("vc_pid");
    setRoom(null);
    setPlayerId(null);
    setRoomData(null);
    setShowHome(false);
  }

  function handleSwitchRoom() {
    localStorage.removeItem("vc_room");
    localStorage.removeItem("vc_pid");
    setRoom(null);
    setPlayerId(null);
    setRoomData(null);
    setShowHome(false);
  }

  function handleEnterRoom(savedRoom) {
    localStorage.setItem("vc_room", savedRoom.code);
    localStorage.setItem("vc_pid", savedRoom.pid);
    updateRoomAccess(savedRoom.code);
    setRoom(savedRoom.code);
    setPlayerId(savedRoom.pid);
    setShowHome(false);
  }

  function handleRemoveRoom(code) {
    removeRoomFromList(code);
    // If it's the active room, also clear active
    if (code === room) {
      localStorage.removeItem("vc_room");
      localStorage.removeItem("vc_pid");
      setRoom(null);
      setPlayerId(null);
      setRoomData(null);
    }
    // Force re-render by checking if any rooms left
    if (getSavedRooms().length === 0) {
      setShowHome(true);
    }
  }

  function handleRenameRoom(code, nickname) {
    renameRoom(code, nickname);
  }

  function dismissWhatsNew() {
    localStorage.setItem("vc_version", APP_VERSION);
    setShowWhatsNew(false);
  }

  if (!room || !playerId) {
    const savedRooms = getSavedRooms();

    // Invite code always goes to Home
    if (inviteCode) {
      return (
        <>
          {showWhatsNew && <WhatsNew onDismiss={dismissWhatsNew} />}
          <Home onJoin={handleJoin} inviteCode={inviteCode} />
        </>
      );
    }

    // Show Home if user clicked New Room / Join with Code
    if (showHome || savedRooms.length === 0) {
      return (
        <>
          {showWhatsNew && <WhatsNew onDismiss={dismissWhatsNew} />}
          <Home
            onJoin={handleJoin}
            inviteCode={inviteCode}
            onBackToRooms={savedRooms.length > 0 ? () => setShowHome(false) : null}
          />
        </>
      );
    }

    // Show room list
    return (
      <>
        {showWhatsNew && <WhatsNew onDismiss={dismissWhatsNew} />}
        <RoomList
          rooms={savedRooms}
          onEnter={handleEnterRoom}
          onNewRoom={() => setShowHome(true)}
          onJoinRoom={() => setShowHome(true)}
          onRemove={handleRemoveRoom}
          onRename={handleRenameRoom}
        />
      </>
    );
  }

  return (
    <>
      {showWhatsNew && <WhatsNew onDismiss={dismissWhatsNew} />}
      <MoodParticles moodId={partnerMoodId} />
      <Hub
        room={room}
        playerId={playerId}
        roomData={roomData}
        onLeave={handleLeave}
        onSwitchRoom={handleSwitchRoom}
      />
    </>
  );
}
