import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Room ---

export async function createRoom(playerName, character, partnerName, welcomeMsg) {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const playerId = generatePlayerId();
  const roomRef = doc(db, "rooms", code);
  await setDoc(roomRef, {
    createdAt: serverTimestamp(),
    player1: { name: playerName, id: playerId, character },
    player2: null,
    partnerName: partnerName || "",
    welcomeMsg: welcomeMsg || "",
    creatorName: playerName,
    xp: 0,
    streak: 0,
    lastPlayedDate: null,
    currentCard: null,
    playedCards: [],
    ended: false,
    onboarded: false,
  });
  localStorage.setItem("vc_pid", playerId);
  localStorage.setItem("vc_room", code);
  return { code, playerId };
}

export async function joinRoom(code, playerName, character) {
  const upper = code.toUpperCase();
  const roomRef = doc(db, "rooms", upper);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) throw new Error("Room not found");

  const data = snap.data();
  const storedId = localStorage.getItem("vc_pid");

  // 1. Check if localStorage player ID matches someone in the room
  if (storedId === data.player1?.id || storedId === data.player2?.id) {
    localStorage.setItem("vc_room", upper);
    return { code: upper, playerId: storedId };
  }

  // 2. Check if name matches an existing player (rejoin after localStorage cleared)
  if (data.player1?.name?.toLowerCase() === playerName.toLowerCase()) {
    localStorage.setItem("vc_pid", data.player1.id);
    localStorage.setItem("vc_room", upper);
    return { code: upper, playerId: data.player1.id };
  }
  if (data.player2?.name?.toLowerCase() === playerName.toLowerCase()) {
    localStorage.setItem("vc_pid", data.player2.id);
    localStorage.setItem("vc_room", upper);
    return { code: upper, playerId: data.player2.id };
  }

  // 3. Room has an empty slot — join as player2
  if (!data.player2 || !data.player2.name) {
    const playerId = generatePlayerId();
    await updateDoc(roomRef, {
      player2: { name: playerName, id: playerId, character },
    });
    localStorage.setItem("vc_pid", playerId);
    localStorage.setItem("vc_room", upper);
    return { code: upper, playerId };
  }

  throw new Error("Room is full — if you're already in this room, use the same name to rejoin");
}

// Quick rejoin with just a room code (tries localStorage first, then needs name)
export async function rejoinRoom(code) {
  const upper = code.toUpperCase();
  const roomRef = doc(db, "rooms", upper);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) throw new Error("Room not found");

  const data = snap.data();
  const storedId = localStorage.getItem("vc_pid");

  // If stored ID matches, instant rejoin
  if (storedId && (storedId === data.player1?.id || storedId === data.player2?.id)) {
    localStorage.setItem("vc_room", upper);
    return { code: upper, playerId: storedId };
  }

  // Can't auto-rejoin — need name to identify
  return null;
}

export function subscribeRoom(code, cb) {
  return onSnapshot(doc(db, "rooms", code), (snap) => {
    cb(snap.exists() ? snap.data() : null);
  });
}

// --- Cards / Responses ---

export async function drawCard(code, deckId, cardId) {
  const roomRef = doc(db, "rooms", code);
  await updateDoc(roomRef, { currentCard: { deckId, cardId } });
}

export function subscribeCard(code, cardId, cb) {
  return onSnapshot(doc(db, "rooms", code, "cards", cardId), (snap) => {
    cb(snap.exists() ? snap.data() : {});
  });
}

export async function submitAnswer(code, cardId, playerId, answer) {
  const ref = doc(db, "rooms", code, "cards", cardId);
  await setDoc(ref, { [playerId]: { answer, at: serverTimestamp() } }, { merge: true });
}

export async function submitRating(code, cardId, playerId, rating) {
  const ref = doc(db, "rooms", code, "cards", cardId);
  await setDoc(ref, { [`${playerId}_rating`]: rating }, { merge: true });
}

export async function submitGuess(code, cardId, playerId, guessIndex) {
  const ref = doc(db, "rooms", code, "cards", cardId);
  await setDoc(ref, { [`${playerId}_guess`]: guessIndex }, { merge: true });
}

export async function clearCurrentCard(code, cardId, xpGain) {
  const roomRef = doc(db, "rooms", code);
  const snap = await getDoc(roomRef);
  const data = snap.data();
  const played = data.playedCards || [];
  const today = new Date().toISOString().slice(0, 10);
  const wasToday = data.lastPlayedDate === today;
  await updateDoc(roomRef, {
    currentCard: null,
    playedCards: [...played, cardId],
    xp: (data.xp || 0) + xpGain,
    streak: wasToday ? (data.streak || 0) : (data.streak || 0) + 1,
    lastPlayedDate: today,
  });
}

// --- Pins ---

export async function pinAnswer(code, pinData) {
  const ref = doc(db, "rooms", code, "pins", pinData.cardId);
  await setDoc(ref, { ...pinData, pinnedAt: serverTimestamp() });
}

export async function unpinAnswer(code, cardId) {
  await deleteDoc(doc(db, "rooms", code, "pins", cardId));
}

export async function getPins(code) {
  const snap = await getDocs(collection(db, "rooms", code, "pins"));
  const pins = [];
  snap.forEach((d) => pins.push({ id: d.id, ...d.data() }));
  return pins;
}

export function subscribePins(code, cb) {
  return onSnapshot(collection(db, "rooms", code, "pins"), (snap) => {
    const pins = [];
    snap.forEach((d) => pins.push({ id: d.id, ...d.data() }));
    cb(pins);
  });
}

// --- Character ---

export async function updateCharacter(code, playerKey, character) {
  const roomRef = doc(db, "rooms", code);
  await updateDoc(roomRef, { [`${playerKey}.character`]: character });
}

// --- Mood ---

export async function setMood(code, playerId, moodId) {
  const roomRef = doc(db, "rooms", code);
  await updateDoc(roomRef, { [`mood_${playerId}`]: moodId });
}

// --- Online presence ---

export async function setOnline(code, playerId) {
  const ref = doc(db, "rooms", code);
  await updateDoc(ref, { [`online_${playerId}`]: serverTimestamp() });
}

// --- Poke ---

export async function sendPoke(code, fromName) {
  const ref = doc(db, "rooms", code);
  await updateDoc(ref, { lastPoke: { from: fromName, at: serverTimestamp(), id: Math.random().toString(36).slice(2) } });
}

// --- End room ---

export async function endRoom(code, endedByName) {
  await updateDoc(doc(db, "rooms", code), { ended: true, endedByName, endedAt: serverTimestamp() });
}

// --- Custom cards ---

export async function addCustomCard(code, card) {
  const id = "custom-" + Math.random().toString(36).substring(2, 10);
  const ref = doc(db, "rooms", code, "customCards", id);
  await setDoc(ref, { ...card, id, createdAt: serverTimestamp() });
  return id;
}

export function subscribeCustomCards(code, cb) {
  return onSnapshot(collection(db, "rooms", code, "customCards"), (snap) => {
    const cards = [];
    snap.forEach((d) => cards.push({ id: d.id, ...d.data() }));
    cb(cards);
  });
}

export async function getCustomCards(code) {
  const snap = await getDocs(collection(db, "rooms", code, "customCards"));
  const cards = [];
  snap.forEach((d) => cards.push({ id: d.id, ...d.data() }));
  return cards;
}

// --- Favorites ---

export async function toggleFavorite(code, cardId, deckId, prompt, type) {
  const ref = doc(db, "rooms", code, "favorites", cardId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await deleteDoc(ref);
    return false;
  } else {
    await setDoc(ref, { cardId, deckId, prompt, type, favAt: serverTimestamp() });
    return true;
  }
}

export function subscribeFavorites(code, cb) {
  return onSnapshot(collection(db, "rooms", code, "favorites"), (snap) => {
    const favs = [];
    snap.forEach((d) => favs.push({ id: d.id, ...d.data() }));
    cb(favs);
  });
}

// --- Helpers ---

export async function getAllCardResponses(code) {
  const snap = await getDocs(collection(db, "rooms", code, "cards"));
  const data = {};
  snap.forEach((d) => { data[d.id] = d.data(); });
  return data;
}

function generatePlayerId() {
  return "p_" + Math.random().toString(36).substring(2, 12);
}
