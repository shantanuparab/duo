import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
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

export async function createRoom(playerName, character, partnerName, welcomeMsg, opts = {}) {
  // opts.code lets the dev room flow create a room at a specific known code.
  // opts.dev marks the room as a developer test room (used by isDev gating in UI).
  const code = opts.code || Math.random().toString(36).substring(2, 8).toUpperCase();
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
    ...(opts.dev ? { dev: true } : {}),
  });
  localStorage.setItem("vc_pid", playerId);
  localStorage.setItem("vc_room", code);
  return { code, playerId };
}

// Set/override the room's XP. Dev-only. Used by the Dev Panel to test level-gated features.
export async function setRoomXp(code, xp) {
  const roomRef = doc(db, "rooms", code);
  await updateDoc(roomRef, { xp: Math.max(0, Math.floor(xp)) });
}

// --- Adventures (chapters + side quests) ---
//
// Subcollection layout:
//   rooms/{code}/adventures/{chapterId}        — linear chapter state
//   rooms/{code}/adventures/sidequest-{id}     — one-off repair tool sessions
//
// Phase 1 enforces the partner-gated + 24h-elapsed advance rule both client-side
// (UX pre-check) AND server-side (firestore.rules, Day 6). Without rules-as-code
// the server-side check is missing today; Day 6 closes that gap.

const TWENTY_FOUR_HOURS_MS = 86_400_000;

export function adventureDocRef(code, chapterId) {
  return doc(db, "rooms", code, "adventures", chapterId);
}

export function subscribeAdventure(code, chapterId, cb) {
  return onSnapshot(adventureDocRef(code, chapterId), (snap) => {
    cb(snap.exists() ? snap.data() : null);
  });
}

// Submit / overwrite a single player's answer on the current prompt.
// `playerSlot` is the literal string "player1" or "player2" (not the player id);
// the chapter doc stores answers by slot so dev-mode single-client testing works.
//
// Throws if the answer's shape doesn't match the prompt's type.
export async function submitAdventureAnswer({ code, chapterId, prompt, playerSlot, answer }) {
  if (playerSlot !== "player1" && playerSlot !== "player2") {
    throw new Error(`submitAdventureAnswer: invalid playerSlot ${playerSlot}`);
  }
  // Lazy import to avoid a circular dep at module load.
  const { validateAnswerShape } = await import("./data/adventureChapters");
  validateAnswerShape(prompt, answer);

  const ref = adventureDocRef(code, chapterId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    // Lazy-create the chapter doc on first answer
    await setDoc(ref, {
      schemaVersion: 1,
      currentPromptIndex: 0,
      answers: { [prompt.id]: { [playerSlot]: { value: answer, ts: Date.now() } } },
      lastUnlockTs: Date.now(),
      completed: false,
    });
    return;
  }
  await updateDoc(ref, {
    [`answers.${prompt.id}.${playerSlot}`]: { value: answer, ts: Date.now() },
  });
}

// Advance to the next prompt. Client-side enforcement: both partners must have
// answered the current prompt AND >=24h since the last unlock. Day 6 adds the
// same checks in firestore.rules so a malicious client can't bypass.
//
// Throws on `permission-denied` only after one retry-after-refetch (handles the
// concurrent-advance race from eng review 1E).
export async function advanceAdventure({ code, chapter, currentPromptIndex, currentPrompt, skipTimeGate = false }) {
  const ref = adventureDocRef(code, chapter.id);

  async function attempt() {
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("advanceAdventure: chapter doc not found");
    const data = snap.data();

    // Idempotent — if we're already past this prompt, nothing to do.
    if (data.currentPromptIndex > currentPromptIndex) return data;

    const promptAnswers = data.answers?.[currentPrompt.id] || {};
    const bothAnswered = promptAnswers.player1 !== undefined && promptAnswers.player2 !== undefined;
    if (!bothAnswered) {
      throw new Error("advanceAdventure: both players must answer first");
    }

    if (!skipTimeGate) {
      const last = data.lastUnlockTs ?? 0;
      const lastMs = typeof last === "number" ? last : last.toMillis?.() ?? 0;
      if (Date.now() - lastMs < TWENTY_FOUR_HOURS_MS) {
        throw new Error("advanceAdventure: 24h not yet elapsed");
      }
    }

    const isLast = currentPromptIndex >= chapter.prompts.length - 1;
    const next = currentPromptIndex + 1;
    await updateDoc(ref, {
      currentPromptIndex: next,
      lastUnlockTs: Date.now(),
      ...(isLast ? { completed: true } : {}),
    });
    return { ...data, currentPromptIndex: next };
  }

  try {
    return await attempt();
  } catch (e) {
    // Retry once on permission-denied (concurrent advance race)
    if (e?.code === "permission-denied") {
      return await attempt();
    }
    throw e;
  }
}

// Start a new Side Quest session. Each session is its own doc so you can have
// multiple repair sessions over time without clobbering history.
export async function startSideQuest({ code, sideQuest }) {
  const sessionId = `sidequest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const ref = doc(db, "rooms", code, "adventures", sessionId);
  await setDoc(ref, {
    schemaVersion: 1,
    sideQuestId: sideQuest.id,
    sessionId,
    currentPromptIndex: 0,
    answers: {},
    startedAt: serverTimestamp(),
    completed: false,
  });
  return sessionId;
}

export async function joinRoom(code, playerName, character) {
  const upper = code.toUpperCase();
  const roomRef = doc(db, "rooms", upper);
  const snap = await getDocFromServer(roomRef).catch(() => getDoc(roomRef));
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
  const snap = await getDocFromServer(roomRef).catch(() => getDoc(roomRef));
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
  const lastDate = data.lastPlayedDate;
  const wasToday = lastDate === today;
  // Check if last played was yesterday
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const wasYesterday = lastDate === yesterday;
  let newStreak;
  if (wasToday) newStreak = data.streak || 1;
  else if (wasYesterday) newStreak = (data.streak || 0) + 1;
  else newStreak = 1; // streak broken — reset
  await updateDoc(roomRef, {
    currentCard: null,
    playedCards: [...played, cardId],
    xp: (data.xp || 0) + xpGain,
    streak: newStreak,
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
