import { useState } from "react";
import { updateDoc, doc, getFirestore, arrayUnion, arrayRemove } from "firebase/firestore";
import PixelChar, { DEFAULT_CHAR } from "../components/PixelChar";
import PixelPet from "../components/PixelPet";

// Pixel art rooms with tile aesthetics
const ROOMS = [
  { id: "living",     name: "Living Room",     tiles: "🛋️🪴🖼️",   status: "Hanging out",         color: "#6366f1" },
  { id: "bedroom",    name: "Bedroom",         tiles: "🛏️🧸💤",    status: "Resting",             color: "#8b5cf6" },
  { id: "kitchen",    name: "Kitchen",         tiles: "🍳🧑‍🍳🍽️",  status: "Cooking",             color: "#f59e0b" },
  { id: "balcony",    name: "Balcony",         tiles: "🌅☕🪴",     status: "Relaxing",            color: "#14b8a6" },
  { id: "playground", name: "Pet Park",        tiles: "🌳🎾🦴",    status: "Playing with pets",   color: "#10b981" },
  { id: "movies",     name: "Movie Room",      tiles: "🎬🍿📺",    status: "Watching something",  color: "#ec4899" },
];

export default function Apartment({ room, playerId, roomData, onBack }) {
  const [view, setView] = useState("map"); // map | office-mine | office-theirs | movies | food
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
  const pets = (roomData?.pets || []).slice(0, roomData?.pets?.length || 0);

  const theirOnlineTs = partnerId ? roomData?.[`online_${partnerId}`] : null;
  const theirOnline = theirOnlineTs && (Date.now() - (theirOnlineTs?.toDate?.()?.getTime?.() || 0) < 60000);

  // Movie & food lists (shared)
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
        <div className="office-scene pixel-room">
          <div className="pixel-floor" />
          <PixelChar config={owner?.character || DEFAULT_CHAR} state="idle" size={4} />
          <div className="office-desk-items">
            {items.map((id) => { const it = OFFICE_ITEMS.find((i) => i.id === id); return it ? <span key={id} className="office-item">{it.emoji}</span> : null; })}
          </div>
          {!isMyOffice && <p className="office-status">{theirOnline ? `${them?.name} is here ✨` : `${them?.name} is away`}</p>}
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

  // === MAP VIEW (pixel art rooms) ===
  return (
    <div className="page apt fade-in">
      <div className="apt-header">
        <button className="btn btn-ghost back-btn" onClick={onBack}>←</button>
        <h2>🏠 Our Home</h2>
      </div>

      {/* Status bar */}
      <div className="apt-status-bar">
        <span>You: <strong>{ROOMS.find((r) => r.id === myRoom)?.status}</strong></span>
        {them && <span>{them.name}: <strong>{theirOnline ? ROOMS.find((r) => r.id === theirRoom)?.status : "Away"}</strong>
          {theirOnline && <span className="online-dot on" style={{ display: "inline-block", width: 6, height: 6, marginLeft: 4 }} />}
        </span>}
      </div>

      {/* Pixel art room grid */}
      <div className="pixel-map">
        {ROOMS.map((r) => {
          const imHere = myRoom === r.id;
          const theyHere = theirRoom === r.id && theirOnline;
          const petsHere = r.id === "playground" && pets.length > 0;
          return (
            <button
              key={r.id}
              className={`pixel-room-card ${imHere ? "me-here" : ""}`}
              style={{ "--room-color": r.color }}
              onClick={() => { moveToRoom(r.id); if (r.id === "movies") setView("movies"); }}
            >
              <div className="pixel-room-tiles">{r.tiles}</div>
              <span className="pixel-room-name">{r.name}</span>
              <div className="pixel-room-chars">
                {imHere && <PixelChar config={me?.character || DEFAULT_CHAR} state="walk" size={2} />}
                {theyHere && <PixelChar config={them?.character || DEFAULT_CHAR} state="idle" size={2} />}
                {petsHere && pets.map((p, i) => <PixelPet key={i} type={p.type} state="happy" size={2} />)}
              </div>
              {imHere && <span className="pixel-you">▼</span>}
            </button>
          );
        })}
      </div>

      {/* Quick links */}
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
