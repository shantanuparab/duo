import { useState, useRef, useEffect } from "react";
import { updateDoc, doc, getFirestore, arrayUnion, arrayRemove } from "firebase/firestore";
import PixelChar, { DEFAULT_CHAR } from "../components/PixelChar";
import PixelPet from "../components/PixelPet";

// Pokemon-style rooms with pixel art backgrounds
const ROOMS = [
  { id: "living",     name: "Living Room",   status: "Hanging out",        color: "#6366f1", floorY: 16, emoji: "🛋️",
    palette: { wall: "#4a3f6b", floor: "#5c4f82", accent: "#7c6fa6", furniture: "#6b5e94", detail: "#8878b0" } },
  { id: "bedroom",    name: "Bedroom",       status: "Resting",            color: "#8b5cf6", floorY: 16, emoji: "🛏️",
    palette: { wall: "#4b3d70", floor: "#5a4d80", accent: "#7a6daa", furniture: "#6960a0", detail: "#9080c0" } },
  { id: "kitchen",    name: "Kitchen",       status: "Cooking",            color: "#f59e0b", floorY: 16, emoji: "🍳",
    palette: { wall: "#6b5a30", floor: "#7a6a40", accent: "#a09060", furniture: "#8a7a50", detail: "#c0a868" } },
  { id: "balcony",    name: "Balcony",       status: "Relaxing",           color: "#14b8a6", floorY: 32, emoji: "🌅",
    palette: { wall: "#1a5c54", floor: "#2a7a70", accent: "#40a898", furniture: "#358a80", detail: "#50c8b8" } },
  { id: "playground", name: "Pet Park",      status: "Playing with pets",  color: "#10b981", floorY: 12, emoji: "🌳",
    palette: { wall: "#2a6848", floor: "#3a8860", accent: "#50b880", furniture: "#40a070", detail: "#60d090" } },
  { id: "movies",     name: "Movie Room",    status: "Watching something", color: "#ec4899", floorY: 16, emoji: "🎬",
    palette: { wall: "#5a2848", floor: "#6a3858", accent: "#9a5888", furniture: "#804870", detail: "#b070a0" } },
];

// Generate a Pokemon-style room background on canvas
function drawRoomBackground(roomConfig, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const p = roomConfig.palette;
  const tileSize = 8;

  // Wall
  ctx.fillStyle = p.wall;
  ctx.fillRect(0, 0, width, height * 0.55);

  // Wall detail — horizontal line
  ctx.fillStyle = p.accent;
  ctx.fillRect(0, height * 0.35, width, 2);
  ctx.fillRect(0, height * 0.36 + 2, width, 1);

  // Floor — checkerboard tiles
  const floorY = Math.floor(height * 0.55);
  for (let y = floorY; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      const checker = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = checker ? p.floor : p.accent;
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }

  // Floor line
  ctx.fillStyle = p.detail;
  ctx.fillRect(0, floorY - 1, width, 2);

  // Room-specific furniture
  const fw = tileSize;
  if (roomConfig.id === "living") {
    // Couch
    ctx.fillStyle = p.furniture;
    ctx.fillRect(fw * 2, floorY - fw * 4, fw * 8, fw * 3);
    ctx.fillStyle = p.detail;
    ctx.fillRect(fw * 2, floorY - fw * 4, fw * 8, fw);
    // TV
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(fw * 16, height * 0.15, fw * 6, fw * 4);
    ctx.fillStyle = "#3a4a6e";
    ctx.fillRect(fw * 17, height * 0.15 + fw, fw * 4, fw * 2);
    // Plant
    ctx.fillStyle = "#40a060";
    ctx.fillRect(fw * 26, floorY - fw * 3, fw * 2, fw * 2);
    ctx.fillStyle = "#6b4a30";
    ctx.fillRect(fw * 26, floorY - fw, fw * 2, fw);
  } else if (roomConfig.id === "bedroom") {
    // Bed
    ctx.fillStyle = p.furniture;
    ctx.fillRect(fw * 2, floorY - fw * 4, fw * 10, fw * 4);
    ctx.fillStyle = p.detail;
    ctx.fillRect(fw * 2, floorY - fw * 4, fw * 2, fw * 4);
    ctx.fillStyle = "#f0e0f0";
    ctx.fillRect(fw * 3, floorY - fw * 3, fw * 8, fw * 2);
    // PC desk
    ctx.fillStyle = p.furniture;
    ctx.fillRect(fw * 20, floorY - fw * 4, fw * 6, fw * 4);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(fw * 21, floorY - fw * 5, fw * 4, fw * 3);
    ctx.fillStyle = "#3a5a8e";
    ctx.fillRect(fw * 22, floorY - fw * 4, fw * 2, fw);
    // Window
    ctx.fillStyle = "#2a4a7a";
    ctx.fillRect(fw * 12, height * 0.08, fw * 5, fw * 5);
    ctx.fillStyle = "#5a8aba";
    ctx.fillRect(fw * 13, height * 0.08 + fw, fw * 3, fw * 3);
  } else if (roomConfig.id === "kitchen") {
    // Counter
    ctx.fillStyle = p.furniture;
    ctx.fillRect(fw * 1, floorY - fw * 3, fw * 12, fw * 3);
    ctx.fillStyle = p.detail;
    ctx.fillRect(fw * 1, floorY - fw * 3, fw * 12, fw);
    // Fridge
    ctx.fillStyle = "#d0d0d8";
    ctx.fillRect(fw * 22, floorY - fw * 6, fw * 4, fw * 6);
    ctx.fillStyle = "#b0b0b8";
    ctx.fillRect(fw * 22, floorY - fw * 3, fw * 4, fw);
    // Pots
    ctx.fillStyle = "#808080";
    ctx.fillRect(fw * 4, floorY - fw * 4, fw * 2, fw);
    ctx.fillRect(fw * 7, floorY - fw * 4, fw * 2, fw);
  } else if (roomConfig.id === "balcony") {
    // Sky gradient
    ctx.fillStyle = "#1a3050";
    ctx.fillRect(0, 0, width, height * 0.4);
    ctx.fillStyle = "#2a4a70";
    ctx.fillRect(0, height * 0.2, width, height * 0.2);
    // Stars
    ctx.fillStyle = "#f0e8a0";
    for (let i = 0; i < 8; i++) {
      const sx = (i * 37 + 13) % width;
      const sy = (i * 23 + 7) % (height * 0.35);
      ctx.fillRect(sx, sy, 2, 2);
    }
    // Railing
    ctx.fillStyle = p.furniture;
    ctx.fillRect(0, height * 0.45, width, fw);
    for (let x = 0; x < width; x += fw * 3) {
      ctx.fillRect(x + fw, height * 0.45, fw, fw * 2);
    }
    // Plants
    ctx.fillStyle = "#40a060";
    ctx.fillRect(fw * 2, floorY - fw * 2, fw * 3, fw * 2);
    ctx.fillRect(fw * 24, floorY - fw * 2, fw * 3, fw * 2);
  } else if (roomConfig.id === "playground") {
    // Sky
    ctx.fillStyle = "#4a8ab0";
    ctx.fillRect(0, 0, width, height * 0.3);
    // Grass wall
    ctx.fillStyle = "#408040";
    ctx.fillRect(0, height * 0.3, width, height * 0.25);
    // Tree
    ctx.fillStyle = "#306030";
    ctx.fillRect(fw * 3, height * 0.1, fw * 5, fw * 4);
    ctx.fillStyle = "#604020";
    ctx.fillRect(fw * 5, height * 0.1 + fw * 4, fw, fw * 4);
    // Fence
    ctx.fillStyle = "#c0a870";
    ctx.fillRect(0, height * 0.48, width, fw);
    for (let x = 0; x < width; x += fw * 4) {
      ctx.fillRect(x + fw, height * 0.42, fw, fw * 2);
    }
    // Pond
    ctx.fillStyle = "#4090c0";
    ctx.fillRect(fw * 18, floorY - fw * 2, fw * 6, fw * 2);
    ctx.fillStyle = "#60b0e0";
    ctx.fillRect(fw * 19, floorY - fw, fw * 4, fw);
  } else if (roomConfig.id === "movies") {
    // Screen
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(fw * 6, height * 0.08, fw * 18, fw * 7);
    ctx.fillStyle = "#2a3a5a";
    ctx.fillRect(fw * 7, height * 0.08 + fw, fw * 16, fw * 5);
    // Bean bags
    ctx.fillStyle = p.furniture;
    ctx.fillRect(fw * 6, floorY - fw * 3, fw * 5, fw * 3);
    ctx.fillRect(fw * 18, floorY - fw * 3, fw * 5, fw * 3);
    // Popcorn
    ctx.fillStyle = "#f0d040";
    ctx.fillRect(fw * 13, floorY - fw * 2, fw * 2, fw * 2);
    ctx.fillStyle = "#e0c030";
    ctx.fillRect(fw * 13, floorY - fw * 3, fw * 2, fw);
  }

  return canvas;
}

// Generate a Pokemon-style office background
function drawOfficeBackground(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const fw = 8;

  // Wall — warm wood paneling
  ctx.fillStyle = "#3a3050";
  ctx.fillRect(0, 0, width, height * 0.55);

  // Wall accent stripe
  ctx.fillStyle = "#4a4068";
  ctx.fillRect(0, height * 0.32, width, 2);
  ctx.fillRect(0, height * 0.34, width, 1);

  // Floor — office carpet checkerboard
  const floorY = Math.floor(height * 0.55);
  for (let y = floorY; y < height; y += fw) {
    for (let x = 0; x < width; x += fw) {
      const checker = ((x / fw) + (y / fw)) % 2 === 0;
      ctx.fillStyle = checker ? "#3a3548" : "#453f58";
    ctx.fillRect(x, y, fw, fw);
    }
  }
  ctx.fillStyle = "#5a5078";
  ctx.fillRect(0, floorY - 1, width, 2);

  // Desk — large L-shaped
  ctx.fillStyle = "#6a5a40";
  ctx.fillRect(fw * 3, floorY - fw * 4, fw * 12, fw * 4);
  ctx.fillStyle = "#7a6a50";
  ctx.fillRect(fw * 3, floorY - fw * 4, fw * 12, fw);

  // Monitor on desk
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(fw * 6, floorY - fw * 7, fw * 6, fw * 4);
  ctx.fillStyle = "#3a5a8e";
  ctx.fillRect(fw * 7, floorY - fw * 6, fw * 4, fw * 2);
  // Monitor stand
  ctx.fillStyle = "#2a2a3e";
  ctx.fillRect(fw * 8, floorY - fw * 3, fw * 2, fw);

  // Keyboard
  ctx.fillStyle = "#2a2a3e";
  ctx.fillRect(fw * 6, floorY - fw * 3, fw * 5, fw);
  ctx.fillStyle = "#4a4a5e";
  for (let x = 0; x < 4; x++) {
    ctx.fillRect(fw * (7 + x), floorY - fw * 3 + 2, fw - 2, fw - 4);
  }

  // Chair
  ctx.fillStyle = "#4a3060";
  ctx.fillRect(fw * 7, floorY - fw * 2, fw * 4, fw * 2);
  ctx.fillStyle = "#5a4070";
  ctx.fillRect(fw * 7, floorY - fw * 2, fw * 4, fw);

  // Bookshelf on wall (right side)
  ctx.fillStyle = "#5a4a38";
  ctx.fillRect(fw * 20, height * 0.1, fw * 6, fw * 7);
  ctx.fillStyle = "#6a5a48";
  ctx.fillRect(fw * 20, height * 0.1, fw * 6, fw);
  ctx.fillRect(fw * 20, height * 0.1 + fw * 3, fw * 6, fw);
  // Books
  const bookColors = ["#c04040", "#4080c0", "#40a060", "#c0a040", "#8060c0"];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = bookColors[i];
    ctx.fillRect(fw * (21 + i), height * 0.1 + fw, fw - 1, fw * 2);
  }
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = bookColors[i + 1];
    ctx.fillRect(fw * (21 + i), height * 0.1 + fw * 4, fw - 1, fw * 2);
  }

  // Plant in corner
  ctx.fillStyle = "#40a060";
  ctx.fillRect(fw * 27, floorY - fw * 3, fw * 2, fw * 2);
  ctx.fillStyle = "#308048";
  ctx.fillRect(fw * 27 + 2, floorY - fw * 4, fw, fw);
  ctx.fillStyle = "#6b4a30";
  ctx.fillRect(fw * 27, floorY - fw, fw * 2, fw);

  // Window/poster on wall
  ctx.fillStyle = "#2a2a4a";
  ctx.fillRect(fw * 12, height * 0.08, fw * 5, fw * 4);
  ctx.fillStyle = "#4a6a9a";
  ctx.fillRect(fw * 13, height * 0.08 + fw * 0.5, fw * 3, fw * 3);

  return canvas;
}

// Cache room backgrounds
const roomBgCache = {};
function getRoomBg(roomConfig) {
  if (!roomBgCache[roomConfig.id]) {
    roomBgCache[roomConfig.id] = drawRoomBackground(roomConfig, 240, 160);
  }
  return roomBgCache[roomConfig.id];
}

let officeBgCache = null;
function getOfficeBg() {
  if (!officeBgCache) officeBgCache = drawOfficeBackground(240, 160);
  return officeBgCache;
}

export default function Apartment({ room, playerId, roomData, onBack }) {
  const [view, setView] = useState("map");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [movieInput, setMovieInput] = useState("");
  const [foodInput, setFoodInput] = useState("");
  const db = getFirestore();

  const p1 = roomData?.player1;
  const p2 = roomData?.player2;
  const isP1 = playerId === p1?.id;
  const me = isP1 ? p1 : p2;
  const them = isP1 ? p2 : p1;
  const partnerId = them?.id;

  const myRoom = roomData?.[`room_${playerId}`] || "living";
  const theirRoom = partnerId ? roomData?.[`room_${partnerId}`] || "living" : "living";
  const pets = roomData?.pets || [];

  const theirOnlineTs = partnerId ? roomData?.[`online_${partnerId}`] : null;
  const theirOnline = theirOnlineTs && (Date.now() - (theirOnlineTs?.toDate?.()?.getTime?.() || 0) < 60000);

  const movieList = roomData?.movieList || [];
  const foodList = roomData?.foodList || [];

  async function moveToRoom(roomId) {
    await updateDoc(doc(db, "rooms", room), { [`room_${playerId}`]: roomId });
  }

  async function addMovie() {
    if (!movieInput.trim()) return;
    await updateDoc(doc(db, "rooms", room), { movieList: arrayUnion({ title: movieInput.trim(), addedBy: me?.name }) });
    setMovieInput("");
  }

  async function addFood() {
    if (!foodInput.trim()) return;
    await updateDoc(doc(db, "rooms", room), { foodList: arrayUnion({ name: foodInput.trim(), addedBy: me?.name }) });
    setFoodInput("");
  }

  async function removeMovie(item) {
    await updateDoc(doc(db, "rooms", room), { movieList: arrayRemove(item) });
  }

  async function removeFood(item) {
    await updateDoc(doc(db, "rooms", room), { foodList: arrayRemove(item) });
  }

  // === ROOM VIEW — Pokemon-style room with character overlay ===
  if (view === "room" && selectedRoom) {
    const roomConfig = ROOMS.find(r => r.id === selectedRoom);
    const imHere = myRoom === selectedRoom;
    const theyHere = theirRoom === selectedRoom && theirOnline;
    const petsHere = selectedRoom === "playground" && pets.length > 0;

    return (
      <div className="page apt fade-in">
        <div className="apt-header">
          <button className="btn btn-ghost back-btn" onClick={() => setView("map")}>← Map</button>
          <h2>{roomConfig.emoji} {roomConfig.name}</h2>
        </div>
        <div className="room-view" style={{ "--room-color": roomConfig.color }}>
          <RoomCanvas roomConfig={roomConfig} />
          {imHere && (
            <div className="room-char room-char-me" style={{ bottom: roomConfig.floorY }}>
              <PixelChar config={me?.character || DEFAULT_CHAR} state="idle" size={3} />
            </div>
          )}
          {theyHere && (
            <div className="room-char room-char-them" style={{ bottom: roomConfig.floorY }}>
              <PixelChar config={them?.character || DEFAULT_CHAR} state="idle" size={3} />
            </div>
          )}
          {petsHere && (
            <div className="room-pets" style={{ bottom: roomConfig.floorY - 4 }}>
              {pets.map((p, i) => <PixelPet key={i} type={p.type} state="happy" size={2} />)}
            </div>
          )}
        </div>
        {!imHere && (
          <button className="btn btn-primary" onClick={() => moveToRoom(selectedRoom)} style={{ marginTop: ".5rem" }}>
            Move here
          </button>
        )}
        {imHere && <p className="os-hint" style={{ textAlign: "center" }}>You're here {roomConfig.emoji}</p>}
        {selectedRoom === "movies" && (
          <button className="btn btn-secondary" onClick={() => setView("movies")} style={{ marginTop: ".5rem" }}>
            🎬 Watch List ({movieList.length})
          </button>
        )}
      </div>
    );
  }

  // === MOVIE ROOM ===
  if (view === "movies") {
    return (
      <div className="page apt fade-in">
        <div className="apt-header">
          <button className="btn btn-ghost back-btn" onClick={() => setView("map")}>←</button>
          <h2>🎬 Watch List</h2>
        </div>
        <p className="os-hint">Movies & shows to watch together on the date</p>
        <div className="list-input-row">
          <input className="input" placeholder="Add a movie or show..." value={movieInput} onChange={(e) => setMovieInput(e.target.value)} maxLength={80}
            onKeyDown={(e) => e.key === "Enter" && addMovie()} />
          <button className="btn btn-primary" onClick={addMovie} style={{ width: "auto", padding: ".7rem 1rem" }}>+</button>
        </div>
        <div className="list-items">
          {movieList.map((m, i) => (
            <div key={i} className="list-item">
              <span className="list-item-emoji">🎬</span>
              <div className="list-item-info">
                <span className="list-item-title">{m.title}</span>
                <span className="list-item-by">{m.addedBy}</span>
              </div>
              <button className="list-item-remove" onClick={() => removeMovie(m)}>✕</button>
            </div>
          ))}
          {movieList.length === 0 && <p className="os-hint" style={{ textAlign: "center", padding: "1rem" }}>No movies yet — add some!</p>}
        </div>
      </div>
    );
  }

  // === FOOD LIST ===
  if (view === "food") {
    return (
      <div className="page apt fade-in">
        <div className="apt-header">
          <button className="btn btn-ghost back-btn" onClick={() => setView("map")}>←</button>
          <h2>🍽️ Food List</h2>
        </div>
        <p className="os-hint">Foods & restaurants to try on the date</p>
        <div className="list-input-row">
          <input className="input" placeholder="Add a food or restaurant..." value={foodInput} onChange={(e) => setFoodInput(e.target.value)} maxLength={80}
            onKeyDown={(e) => e.key === "Enter" && addFood()} />
          <button className="btn btn-primary" onClick={addFood} style={{ width: "auto", padding: ".7rem 1rem" }}>+</button>
        </div>
        <div className="list-items">
          {foodList.map((f, i) => (
            <div key={i} className="list-item">
              <span className="list-item-emoji">🍽️</span>
              <div className="list-item-info">
                <span className="list-item-title">{f.name}</span>
                <span className="list-item-by">{f.addedBy}</span>
              </div>
              <button className="list-item-remove" onClick={() => removeFood(f)}>✕</button>
            </div>
          ))}
          {foodList.length === 0 && <p className="os-hint" style={{ textAlign: "center", padding: "1rem" }}>No food yet — what are you craving?</p>}
        </div>
      </div>
    );
  }

  // === OFFICE ===
  if (view === "office-mine" || view === "office-theirs") {
    const isMyOffice = view === "office-mine";
    const owner = isMyOffice ? me : them;
    const items = isMyOffice ? (roomData?.[`office_${playerId}`] || []) : (roomData?.[`office_${partnerId}`] || []);
    const OFFICE_ITEMS = [
      { id: "laptop", emoji: "💻" }, { id: "coffee", emoji: "☕" }, { id: "plant", emoji: "🪴" },
      { id: "books", emoji: "📚" }, { id: "headphones", emoji: "🎧" }, { id: "snack", emoji: "🍪" },
    ];

    return (
      <div className="page apt fade-in">
        <div className="apt-header">
          <button className="btn btn-ghost back-btn" onClick={() => setView("map")}>←</button>
          <h2>💼 {owner?.name}'s Office</h2>
        </div>
        <div className="room-view" style={{ "--room-color": "#6366f1" }}>
          <OfficeCanvas />
          <div className="room-char" style={{ bottom: 16, left: "40%" }}>
            <PixelChar config={owner?.character || DEFAULT_CHAR} state="idle" size={3} />
          </div>
          <div className="office-desk-overlay">
            {items.map((id) => { const it = OFFICE_ITEMS.find((i) => i.id === id); return it ? <span key={id} className="office-item-overlay">{it.emoji}</span> : null; })}
          </div>
          {!isMyOffice && <p className="office-status-overlay">{theirOnline ? `${them?.name} is here ✨` : `${them?.name} is away`}</p>}
        </div>
        {isMyOffice && (
          <>
            <h3 className="apt-section-title">Your desk</h3>
            <div className="office-items-grid">
              {OFFICE_ITEMS.map((item) => (
                <button key={item.id} className={`office-item-btn ${items.includes(item.id) ? "placed" : ""}`}
                  onClick={async () => {
                    const next = items.includes(item.id) ? items.filter((i) => i !== item.id) : [...items, item.id];
                    await updateDoc(doc(db, "rooms", room), { [`office_${playerId}`]: next });
                  }}>
                  <span>{item.emoji}</span>
                  {items.includes(item.id) && <span className="office-check">✓</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // === MAP VIEW — Pokemon-style room thumbnails ===
  return (
    <div className="page apt fade-in">
      <div className="apt-header">
        <button className="btn btn-ghost back-btn" onClick={onBack}>←</button>
        <h2>🏠 Our Home</h2>
      </div>

      <div className="apt-status-bar">
        <span>You: <strong>{ROOMS.find((r) => r.id === myRoom)?.status}</strong></span>
        {them && <span>{them.name}: <strong>{theirOnline ? ROOMS.find((r) => r.id === theirRoom)?.status : "Away"}</strong>
          {theirOnline && <span className="online-dot on" style={{ display: "inline-block", width: 6, height: 6, marginLeft: 4 }} />}
        </span>}
      </div>

      <div className="pixel-map">
        {ROOMS.map((r) => {
          const imHere = myRoom === r.id;
          const theyHere = theirRoom === r.id && theirOnline;
          return (
            <button
              key={r.id}
              className={`pixel-room-card ${imHere ? "me-here" : ""}`}
              style={{ "--room-color": r.color }}
              onClick={() => { moveToRoom(r.id); setSelectedRoom(r.id); setView("room"); }}
            >
              <RoomThumb roomConfig={r} />
              <span className="pixel-room-name">{r.name}</span>
              <div className="pixel-room-chars">
                {imHere && <PixelChar config={me?.character || DEFAULT_CHAR} state="idle" size={2} />}
                {theyHere && <PixelChar config={them?.character || DEFAULT_CHAR} state="idle" size={2} />}
              </div>
              {imHere && <span className="pixel-you">▼</span>}
            </button>
          );
        })}
      </div>

      <div className="apt-links">
        <button className="btn btn-secondary" onClick={() => setView("office-mine")}>💼 My Office</button>
        <button className="btn btn-secondary" onClick={() => setView("office-theirs")}>💼 {them?.name}'s</button>
      </div>
      <div className="apt-links">
        <button className="btn btn-secondary" onClick={() => setView("movies")}>🎬 Watch List ({movieList.length})</button>
        <button className="btn btn-secondary" onClick={() => setView("food")}>🍽️ Food List ({foodList.length})</button>
      </div>
    </div>
  );
}

// Room background rendered to canvas (full size for room view)
function RoomCanvas({ roomConfig }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bg = getRoomBg(roomConfig);
    canvas.width = bg.width;
    canvas.height = bg.height;
    canvas.getContext("2d").drawImage(bg, 0, 0);
  }, [roomConfig.id]);
  return <canvas ref={canvasRef} className="room-bg-canvas" />;
}

// Office background canvas
function OfficeCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bg = getOfficeBg();
    canvas.width = bg.width;
    canvas.height = bg.height;
    canvas.getContext("2d").drawImage(bg, 0, 0);
  }, []);
  return <canvas ref={canvasRef} className="room-bg-canvas" />;
}

// Small room thumbnail for the map grid
function RoomThumb({ roomConfig }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bg = getRoomBg(roomConfig);
    canvas.width = 80;
    canvas.height = 53;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bg, 0, 0, 80, 53);
  }, [roomConfig.id]);
  return <canvas ref={canvasRef} className="room-thumb-canvas" />;
}
