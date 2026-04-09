import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Hub from "./pages/Hub";
import { subscribeRoom } from "./firebase";
import MoodParticles from "./components/MoodParticles";
import { applyMoodTheme } from "./components/MoodSlider";

// Extract ?code=XYZ from URL
function getCodeFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("code")?.toUpperCase() || null;
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

  useEffect(() => {
    if (!room) return;
    return subscribeRoom(room, (data) => {
      if (data) {
        setRoomData(data);
      } else {
        // Room was deleted or doesn't exist — clear and go to landing
        localStorage.removeItem("vc_room");
        localStorage.removeItem("vc_pid");
        setRoom(null);
        setPlayerId(null);
        setRoomData(null);
      }
    });
  }, [room]);

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
    // Clean the URL so the code doesn't stick around
    if (window.history.replaceState) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }

  function handleLeave() {
    localStorage.removeItem("vc_room");
    localStorage.removeItem("vc_pid");
    setRoom(null);
    setPlayerId(null);
    setRoomData(null);
  }

  if (!room || !playerId) {
    return <Home onJoin={handleJoin} inviteCode={inviteCode} />;
  }

  return (
    <>
      <MoodParticles moodId={partnerMoodId} />
      <Hub
        room={room}
        playerId={playerId}
        roomData={roomData}
        onLeave={handleLeave}
      />
    </>
  );
}
