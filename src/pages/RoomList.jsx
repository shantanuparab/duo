import { useState } from "react";

export default function RoomList({ rooms, onEnter, onNewRoom, onJoinRoom, onRemove, onRename }) {
  const [editingCode, setEditingCode] = useState(null);
  const [nickname, setNickname] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);

  const sorted = [...rooms].sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));

  function startRename(room) {
    setEditingCode(room.code);
    setNickname(room.nickname || "");
  }

  function saveNickname(code) {
    onRename(code, nickname.trim());
    setEditingCode(null);
    setNickname("");
  }

  function handleRemove(code) {
    setConfirmRemove(null);
    onRemove(code);
  }

  return (
    <div className="page room-list fade-in">
      <div className="home-hero" style={{ paddingTop: "8dvh" }}>
        <div className="logo-glow">✨</div>
        <h1>vibe check</h1>
        <p className="subtitle">your rooms</p>
      </div>

      <div className="room-list-items">
        {sorted.map((r) => (
          <div key={r.code} className="room-list-card fade-in">
            {editingCode === r.code ? (
              <div className="room-edit-row">
                <input
                  className="input"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Room nickname..."
                  maxLength={24}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && saveNickname(r.code)}
                />
                <div style={{ display: "flex", gap: ".4rem", marginTop: ".4rem" }}>
                  <button className="btn btn-primary" onClick={() => saveNickname(r.code)} style={{ flex: 1 }}>Save</button>
                  <button className="btn btn-ghost" onClick={() => setEditingCode(null)} style={{ flex: 1 }}>Cancel</button>
                </div>
              </div>
            ) : confirmRemove === r.code ? (
              <div className="room-confirm-remove">
                <p style={{ fontSize: ".85rem", color: "var(--text-dim)", marginBottom: ".5rem" }}>Remove this room from your list?</p>
                <div style={{ display: "flex", gap: ".4rem" }}>
                  <button className="btn btn-danger" onClick={() => handleRemove(r.code)} style={{ flex: 1 }}>Remove</button>
                  <button className="btn btn-ghost" onClick={() => setConfirmRemove(null)} style={{ flex: 1 }}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="room-card-content" onClick={() => onEnter(r)}>
                <div className="room-card-info">
                  <span className="room-card-name">
                    {r.nickname || (r.myName && r.partnerName ? `${r.myName} & ${r.partnerName}` : r.code)}
                  </span>
                  <span className="room-card-code">{r.code}</span>
                </div>
                <div className="room-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="room-action-btn" onClick={() => startRename(r)} title="Rename">✏️</button>
                  <button className="room-action-btn" onClick={() => setConfirmRemove(r.code)} title="Remove">🗑️</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="home-actions" style={{ marginTop: "1.5rem" }}>
        <button className="btn btn-primary" onClick={onNewRoom}>New Room</button>
        <button className="btn btn-secondary" onClick={onJoinRoom}>Join with Code</button>
      </div>
    </div>
  );
}
