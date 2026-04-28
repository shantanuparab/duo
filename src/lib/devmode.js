// Dev mode helpers — for the founder's solo testing.
//
// Activation: open the app with `?dev=1` (e.g., https://duo-shantanu5.vercel.app?dev=1).
// The flag persists in sessionStorage for the tab session.
//
// Dev rooms are tagged on saveRoomToList with `dev: true` so the regular RoomList
// filters them out. The dev room code is generated once per device, stored in
// localStorage, and is unguessable (D + 5 random chars from a non-ambiguous alphabet).
// Nobody else can stumble into your dev room.

export function isDevMode() {
  if (typeof window === "undefined") return false;
  // URL param wins for the current load
  const params = new URLSearchParams(window.location.search);
  if (params.get("dev") === "1") {
    sessionStorage.setItem("vc_dev", "1");
    return true;
  }
  return sessionStorage.getItem("vc_dev") === "1";
}

export function exitDevMode() {
  sessionStorage.removeItem("vc_dev");
}

// Stable per-device dev room code, generated lazily. Stored in localStorage.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I/O/0/1 to avoid confusion
export function getOrCreateDevRoomCode() {
  let code = localStorage.getItem("vc_dev_room_code");
  if (code) return code;
  let generated = "D";
  for (let i = 0; i < 5; i++) {
    generated += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  localStorage.setItem("vc_dev_room_code", generated);
  return generated;
}

// Forget the current dev room code — next dev-room tap creates a fresh one.
export function clearDevRoomCode() {
  localStorage.removeItem("vc_dev_room_code");
}

// Returns true if the given room code is the founder's dev room.
export function isDevRoomCode(code) {
  if (!code) return false;
  return code === localStorage.getItem("vc_dev_room_code");
}

// Create or rejoin the founder's dev room.
// - If a room already exists at the dev code: rejoin using stored pid (or join fresh)
// - Otherwise: create a fresh room at that code, marked dev: true in Firestore
import { createRoom, joinRoom } from "../firebase";
import { saveRoomToList } from "../App";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { DEFAULT_CHAR } from "../components/PixelChar";

const DEV_PLAYER_NAME = "DevMe";
const DEV_PARTNER_NAME = "Test Partner";

export async function enterDevRoom() {
  const code = getOrCreateDevRoomCode();
  const db = getFirestore();
  const snap = await getDoc(doc(db, "rooms", code));

  if (snap.exists()) {
    // Already exists — try to rejoin with stored pid first
    const storedPid = localStorage.getItem("vc_pid");
    const data = snap.data();
    if (storedPid && (storedPid === data.player1?.id || storedPid === data.player2?.id)) {
      localStorage.setItem("vc_room", code);
      saveRoomToList(code, storedPid, data.player1?.name || DEV_PLAYER_NAME, data.player2?.name || DEV_PARTNER_NAME, { dev: true });
      return { code, playerId: storedPid };
    }
    // Stored pid doesn't match — fall back to joinRoom by name (rejoin path).
    const r = await joinRoom(code, DEV_PLAYER_NAME, { ...DEFAULT_CHAR });
    saveRoomToList(code, r.playerId, DEV_PLAYER_NAME, data.player2?.name || DEV_PARTNER_NAME, { dev: true });
    return r;
  }

  // Doesn't exist — create fresh, marked dev
  const r = await createRoom(
    DEV_PLAYER_NAME,
    { ...DEFAULT_CHAR },
    DEV_PARTNER_NAME,
    "Dev mode test room. Reset XP and Adventures state freely.",
    { code, dev: true }
  );
  saveRoomToList(code, r.playerId, DEV_PLAYER_NAME, DEV_PARTNER_NAME, { dev: true });
  return r;
}
