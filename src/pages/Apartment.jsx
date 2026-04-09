import { useState } from "react";
import { updateDoc, doc, getFirestore } from "firebase/firestore";
import PixelChar, { DEFAULT_CHAR } from "../components/PixelChar";
import PixelPet from "../components/PixelPet";

const ROOMS = [
  { id: "living", name: "Living Room", emoji: "🛋️", status: "Hanging out" },
  { id: "bedroom", name: "Bedroom", emoji: "🛏️", status: "Resting" },
  { id: "kitchen", name: "Kitchen", emoji: "🍳", status: "Cooking" },
  { id: "balcony", name: "Balcony", emoji: "🌅", status: "Relaxing" },
  { id: "playground", name: "Pet Playground", emoji: "🎾", status: "Playing with pets" },
];

const OFFICE_ITEMS = [
  { id: "laptop", emoji: "💻" },
  { id: "coffee", emoji: "☕" },
  { id: "plant", emoji: "🪴" },
  { id: "books", emoji: "📚" },
  { id: "headphones", emoji: "🎧" },
  { id: "snack", emoji: "🍪" },
];

export default function Apartment({ room, playerId, roomData, onBack }) {
  const [view, setView] = useState("home"); // home | office-mine | office-theirs
  const db = getFirestore();

  const p1 = roomData?.player1;
  const p2 = roomData?.player2;
  const isP1 = playerId === p1?.id;
  const me = isP1 ? p1 : p2;
  const them = isP1 ? p2 : p1;
  const partnerId = them?.id;

  const myRoom = roomData?.[`room_${playerId}`] || "living";
  const theirRoom = partnerId ? roomData?.[`room_${partnerId}`] || "living" : "living";
  const myOfficeItems = roomData?.[`office_${playerId}`] || [];
  const theirOfficeItems = partnerId ? roomData?.[`office_${partnerId}`] || [] : [];

  const pets = (roomData?.pets || []).slice(0, 2);

  // Partner online check
  const theirOnlineTs = partnerId ? roomData?.[`online_${partnerId}`] : null;
  const theirOnline = theirOnlineTs && (Date.now() - (theirOnlineTs?.toDate?.()?.getTime?.() || 0) < 60000);

  async function moveToRoom(roomId) {
    await updateDoc(doc(db, "rooms", room), { [`room_${playerId}`]: roomId });
  }

  async function toggleOfficeItem(itemId) {
    const current = myOfficeItems;
    const next = current.includes(itemId)
      ? current.filter((i) => i !== itemId)
      : [...current, itemId];
    await updateDoc(doc(db, "rooms", room), { [`office_${playerId}`]: next });
  }

  // === HOME VIEW ===
  if (view === "home") {
    return (
      <div className="page apt fade-in">
        <div className="apt-header">
          <button className="btn btn-ghost back-btn" onClick={onBack}>←</button>
          <h2>🏠 Our Home</h2>
        </div>

        {/* Room grid */}
        <div className="apt-rooms">
          {ROOMS.map((r) => {
            const imHere = myRoom === r.id;
            const theyHere = theirRoom === r.id;
            const petsHere = r.id === "playground" || r.id === "living";
            return (
              <button
                key={r.id}
                className={`apt-room ${imHere ? "me-here" : ""} ${theyHere ? "them-here" : ""}`}
                onClick={() => moveToRoom(r.id)}
              >
                <div className="apt-room-top">
                  <span className="apt-room-emoji">{r.emoji}</span>
                  <span className="apt-room-name">{r.name}</span>
                </div>
                <div className="apt-room-chars">
                  {imHere && <PixelChar config={me?.character || DEFAULT_CHAR} state="idle" size={2} />}
                  {theyHere && <PixelChar config={them?.character || DEFAULT_CHAR} state="idle" size={2} />}
                  {petsHere && pets.map((p, i) => <PixelPet key={i} type={p.type} state="happy" size={2} />)}
                </div>
                {imHere && <span className="apt-you-badge">You</span>}
              </button>
            );
          })}
        </div>

        {/* Current status */}
        <div className="apt-status">
          <p>You: <strong>{ROOMS.find((r) => r.id === myRoom)?.status || "Home"}</strong></p>
          {them && (
            <p>{them.name}: <strong>
              {theirOnline
                ? (ROOMS.find((r) => r.id === theirRoom)?.status || "Home")
                : "Offline"}
            </strong> {theirOnline && <span className="online-dot on" style={{ display: "inline-block", width: 6, height: 6 }} />}</p>
          )}
        </div>

        {/* Office buttons */}
        <div className="apt-offices">
          <button className="btn btn-secondary" onClick={() => setView("office-mine")}>
            💼 My Office
          </button>
          <button className="btn btn-secondary" onClick={() => setView("office-theirs")}>
            💼 Visit {them?.name}'s Office
          </button>
        </div>
      </div>
    );
  }

  // === OFFICE VIEW ===
  const isMyOffice = view === "office-mine";
  const officeOwner = isMyOffice ? me : them;
  const officeItems = isMyOffice ? myOfficeItems : theirOfficeItems;

  return (
    <div className="page apt fade-in">
      <div className="apt-header">
        <button className="btn btn-ghost back-btn" onClick={() => setView("home")}>←</button>
        <h2>💼 {officeOwner?.name}'s Office</h2>
      </div>

      {/* Office scene */}
      <div className="office-scene">
        <div className="office-desk">
          <PixelChar config={officeOwner?.character || DEFAULT_CHAR} state="idle" size={4} />
          <div className="office-desk-items">
            {officeItems.map((id) => {
              const item = OFFICE_ITEMS.find((i) => i.id === id);
              return item ? <span key={id} className="office-item">{item.emoji}</span> : null;
            })}
          </div>
        </div>
        {!isMyOffice && theirOnline && (
          <p className="office-online">{them?.name} is online right now ✨</p>
        )}
        {!isMyOffice && !theirOnline && (
          <p className="office-offline">{them?.name} is away</p>
        )}
      </div>

      {/* Customize (own office only) */}
      {isMyOffice && (
        <>
          <h3 className="apt-section-title">Customize your desk</h3>
          <div className="office-items-grid">
            {OFFICE_ITEMS.map((item) => {
              const placed = myOfficeItems.includes(item.id);
              return (
                <button
                  key={item.id}
                  className={`office-item-btn ${placed ? "placed" : ""}`}
                  onClick={() => toggleOfficeItem(item.id)}
                >
                  <span>{item.emoji}</span>
                  {placed && <span className="office-check">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
