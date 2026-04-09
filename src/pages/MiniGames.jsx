import { useState, useEffect, useRef } from "react";
import { updateDoc, doc, getFirestore, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

// ====== GAME DEFINITIONS ======

const GAMES = [
  { id: "speed-wyr", name: "Speed WYR", emoji: "⚡", desc: "10s to pick — do you match?", duration: 120 },
  { id: "memory", name: "Memory Match", emoji: "🧠", desc: "Flip cards, find pairs, beat them", duration: 180 },
  { id: "word-chain", name: "Word Chain", emoji: "🔗", desc: "Last letter → first letter. Don't choke", duration: 120 },
  { id: "trivia", name: "Quick Trivia", emoji: "🧐", desc: "Random trivia — who's smarter?", duration: 120 },
  { id: "reaction", name: "Tap Battle", emoji: "👆", desc: "Tap as fast as you can in 10s", duration: 30 },
];

// Speed WYR questions
const WYR_QS = [
  { a: "Never use your phone again", b: "Never eat your favorite food again" },
  { a: "Always be early", b: "Always be perfectly on time" },
  { a: "Read minds", b: "See the future" },
  { a: "Live in space", b: "Live underwater" },
  { a: "Free flights forever", b: "Free food forever" },
  { a: "No AC in summer", b: "No heating in winter" },
  { a: "Only whisper", b: "Only shout" },
  { a: "Unlimited money", b: "Unlimited time" },
  { a: "Be 10 again knowing what you know", b: "Be your age with $10M" },
  { a: "Give up music", b: "Give up movies" },
];

// Trivia questions
const TRIVIA_QS = [
  { q: "How many hearts does an octopus have?", a: "3", opts: ["1", "2", "3", "8"] },
  { q: "What's the smallest country in the world?", a: "Vatican City", opts: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"] },
  { q: "Which planet has the most moons?", a: "Saturn", opts: ["Jupiter", "Saturn", "Uranus", "Neptune"] },
  { q: "What year was the first iPhone released?", a: "2007", opts: ["2005", "2006", "2007", "2008"] },
  { q: "How many bones does a human have?", a: "206", opts: ["186", "196", "206", "216"] },
  { q: "What's the longest river in the world?", a: "Nile", opts: ["Amazon", "Nile", "Yangtze", "Mississippi"] },
  { q: "Which element has the chemical symbol 'Au'?", a: "Gold", opts: ["Silver", "Gold", "Aluminum", "Argon"] },
  { q: "How many time zones does Russia have?", a: "11", opts: ["7", "9", "11", "13"] },
];

// Memory cards (emojis to match)
const MEMORY_EMOJIS = ["🌸", "🦋", "🌙", "⭐", "🎵", "💜", "🔥", "🌊"];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export default function MiniGames({ room, playerId, roomData, onBack }) {
  const [screen, setScreen] = useState("lobby"); // lobby | playing | results
  const [gameId, setGameId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);

  const db = getFirestore();
  const p1 = roomData?.player1;
  const p2 = roomData?.player2;
  const isP1 = playerId === p1?.id;
  const me = isP1 ? p1 : p2;
  const them = isP1 ? p2 : p1;
  const partnerId = them?.id;

  const theirOnlineTs = partnerId ? roomData?.[`online_${partnerId}`] : null;
  const theirOnline = theirOnlineTs && (Date.now() - (theirOnlineTs?.toDate?.()?.getTime?.() || 0) < 60000);

  const leaderboard = roomData?.leaderboard || {};
  const myWins = leaderboard[playerId] || 0;
  const theirWins = leaderboard[partnerId] || 0;

  // Subscribe to active game session
  useEffect(() => {
    if (!room) return;
    return onSnapshot(doc(db, "rooms", room, "game", "current"), (snap) => {
      setGameState(snap.exists() ? snap.data() : null);
    });
  }, [room]);

  // Timer
  useEffect(() => {
    if (screen !== "playing" || !gameState) return;
    const end = gameState.endsAt?.toDate?.()?.getTime?.() || (Date.now() + 120000);
    function tick() {
      const left = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setTimer(left);
      if (left <= 0) { setScreen("results"); clearInterval(timerRef.current); }
    }
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, gameState?.endsAt]);

  async function startGame(id) {
    const game = GAMES.find((g) => g.id === id);
    const now = new Date();
    const endsAt = new Date(now.getTime() + (game.duration * 1000));

    let data = { gameId: id, startedBy: playerId, startedAt: serverTimestamp(), endsAt };

    // Game-specific init
    if (id === "speed-wyr") {
      data.questions = shuffle(WYR_QS).slice(0, 5);
      data.round = 0;
    } else if (id === "memory") {
      const pairs = shuffle(MEMORY_EMOJIS).slice(0, 6);
      data.board = shuffle([...pairs, ...pairs]);
      data.revealed = [];
      data.matched = [];
      data.turn = playerId;
      data[`score_${playerId}`] = 0;
      data[`score_${partnerId}`] = 0;
    } else if (id === "word-chain") {
      data.words = [];
      data.turn = playerId;
    } else if (id === "trivia") {
      data.questions = shuffle(TRIVIA_QS).slice(0, 5);
      data.round = 0;
      data[`score_${playerId}`] = 0;
      data[`score_${partnerId}`] = 0;
    } else if (id === "reaction") {
      data[`taps_${playerId}`] = 0;
      data[`taps_${partnerId}`] = 0;
    }

    await setDoc(doc(db, "rooms", room, "game", "current"), data);
    setGameId(id);
    setScreen("playing");
  }

  // Detect game started by partner
  useEffect(() => {
    if (gameState && gameState.gameId && screen === "lobby") {
      setGameId(gameState.gameId);
      setScreen("playing");
    }
  }, [gameState?.gameId]);

  async function endGame(winnerId) {
    if (winnerId) {
      const lb = { ...leaderboard };
      lb[winnerId] = (lb[winnerId] || 0) + 1;
      await updateDoc(doc(db, "rooms", room), { leaderboard: lb });
    }
    await setDoc(doc(db, "rooms", room, "game", "current"), { gameId: null });
    setScreen("results");
  }

  function backToLobby() {
    setScreen("lobby");
    setGameId(null);
    setGameState(null);
  }

  // ====== LOBBY ======
  if (screen === "lobby") {
    return (
      <div className="page games fade-in">
        <div className="games-header">
          <button className="btn btn-ghost back-btn" onClick={onBack}>←</button>
          <h2>🎮 Game Night</h2>
        </div>

        {/* Leaderboard */}
        <div className="leaderboard">
          <div className={`lb-player ${myWins >= theirWins ? "leading" : ""}`}>
            <span className="lb-name">{me?.name}</span>
            <span className="lb-score">{myWins}</span>
          </div>
          <span className="lb-vs">vs</span>
          <div className={`lb-player ${theirWins > myWins ? "leading" : ""}`}>
            <span className="lb-name">{them?.name}</span>
            <span className="lb-score">{theirWins}</span>
          </div>
        </div>

        {!theirOnline && (
          <div className="games-offline">
            <p>⏳ Waiting for {them?.name} to come online</p>
            <p className="os-hint">Both players need to be online to play games</p>
          </div>
        )}

        {theirOnline && (
          <div className="game-list">
            {GAMES.map((g) => (
              <button key={g.id} className="game-card" onClick={() => startGame(g.id)}>
                <span className="game-emoji">{g.emoji}</span>
                <div className="game-info">
                  <span className="game-name">{g.name}</span>
                  <span className="game-desc">{g.desc}</span>
                </div>
                <span className="game-time">{Math.floor(g.duration / 60)}m</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ====== PLAYING ======
  if (screen === "playing" && gameState) {
    return (
      <div className="page games fade-in">
        <div className="games-header">
          <span className="game-timer">⏱ {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}</span>
          <span className="game-title">{GAMES.find((g) => g.id === gameId)?.emoji} {GAMES.find((g) => g.id === gameId)?.name}</span>
        </div>

        {/* Speed WYR */}
        {gameId === "speed-wyr" && <SpeedWYR gs={gameState} db={db} room={room} playerId={playerId} partnerId={partnerId} me={me} them={them} onEnd={endGame} />}

        {/* Memory */}
        {gameId === "memory" && <MemoryGame gs={gameState} db={db} room={room} playerId={playerId} partnerId={partnerId} me={me} them={them} onEnd={endGame} />}

        {/* Reaction / Tap Battle */}
        {gameId === "reaction" && <TapBattle gs={gameState} db={db} room={room} playerId={playerId} partnerId={partnerId} me={me} them={them} timer={timer} onEnd={endGame} />}

        {/* Word Chain */}
        {gameId === "word-chain" && <WordChain gs={gameState} db={db} room={room} playerId={playerId} partnerId={partnerId} me={me} them={them} onEnd={endGame} />}

        {/* Trivia */}
        {gameId === "trivia" && <TriviaGame gs={gameState} db={db} room={room} playerId={playerId} partnerId={partnerId} me={me} them={them} onEnd={endGame} />}
      </div>
    );
  }

  // ====== RESULTS ======
  return (
    <div className="page games fade-in">
      <div className="games-result">
        <h2>🏆 Game Over!</h2>
        <div className="leaderboard big">
          <div className={`lb-player ${myWins >= theirWins ? "leading" : ""}`}>
            <span className="lb-name">{me?.name}</span>
            <span className="lb-score">{myWins}</span>
          </div>
          <span className="lb-vs">vs</span>
          <div className={`lb-player ${theirWins > myWins ? "leading" : ""}`}>
            <span className="lb-name">{them?.name}</span>
            <span className="lb-score">{theirWins}</span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={backToLobby}>Play Again</button>
        <button className="btn btn-ghost" onClick={onBack}>Back to Hub</button>
      </div>
    </div>
  );
}

// ====== SPEED WYR COMPONENT ======
function SpeedWYR({ gs, db, room, playerId, partnerId, me, them, onEnd }) {
  const round = gs.round || 0;
  const q = gs.questions?.[round];
  const myPick = gs[`r${round}_${playerId}`];
  const theirPick = gs[`r${round}_${partnerId}`];
  const [revealed, setRevealed] = useState(false);

  useEffect(() => { setRevealed(false); }, [round]);

  useEffect(() => {
    if (myPick && theirPick && !revealed) {
      setRevealed(true);
      setTimeout(async () => {
        if (round + 1 >= (gs.questions?.length || 5)) {
          const myScore = gs[`wyrscore_${playerId}`] || 0;
          const theirScore = gs[`wyrscore_${partnerId}`] || 0;
          await onEnd(myScore >= theirScore ? playerId : partnerId);
        } else {
          await setDoc(doc(db, "rooms", room, "game", "current"), { ...gs, round: round + 1 }, { merge: true });
        }
      }, 2000);
    }
  }, [myPick, theirPick, revealed]);

  async function pick(choice) {
    const matched = theirPick === choice;
    const scoreKey = `wyrscore_${playerId}`;
    await setDoc(doc(db, "rooms", room, "game", "current"), {
      [`r${round}_${playerId}`]: choice,
      [scoreKey]: (gs[scoreKey] || 0) + (matched ? 1 : 0),
    }, { merge: true });
  }

  if (!q) return <p>Loading...</p>;

  return (
    <div className="wyr-game">
      <p className="wyr-round">Round {round + 1}/{gs.questions?.length || 5}</p>
      <h3 className="wyr-q">Would you rather...</h3>
      {!myPick ? (
        <div className="choice-buttons">
          <button className="choice-btn a" onClick={() => pick("a")}>{q.a}</button>
          <span className="choice-or">or</span>
          <button className="choice-btn b" onClick={() => pick("b")}>{q.b}</button>
        </div>
      ) : !theirPick ? (
        <p className="os-hint">Waiting for {them?.name}...</p>
      ) : (
        <div className="wyr-reveal fade-in">
          <div className={`reveal-choice ${myPick === theirPick ? "match" : "diff"}`}>
            {myPick === theirPick ? "Match! 🎉" : "Different! 😅"}
          </div>
        </div>
      )}
    </div>
  );
}

// ====== MEMORY MATCH ======
function MemoryGame({ gs, db, room, playerId, partnerId, me, them, onEnd }) {
  const board = gs.board || [];
  const revealed = gs.revealed || [];
  const matched = gs.matched || [];
  const turn = gs.turn;
  const isMyTurn = turn === playerId;
  const myScore = gs[`score_${playerId}`] || 0;
  const theirScore = gs[`score_${partnerId}`] || 0;

  async function flipCard(idx) {
    if (!isMyTurn || revealed.includes(idx) || matched.includes(idx)) return;

    const newRevealed = [...revealed, idx];

    if (newRevealed.length === 2) {
      const [a, b] = newRevealed;
      if (board[a] === board[b]) {
        const newMatched = [...matched, a, b];
        const scoreKey = `score_${playerId}`;
        const update = { revealed: [], matched: newMatched, [scoreKey]: (gs[scoreKey] || 0) + 1 };
        if (newMatched.length >= board.length) {
          await setDoc(doc(db, "rooms", room, "game", "current"), update, { merge: true });
          setTimeout(() => onEnd(myScore + 1 > theirScore ? playerId : theirScore > myScore + 1 ? partnerId : null), 1000);
          return;
        }
        await setDoc(doc(db, "rooms", room, "game", "current"), update, { merge: true });
      } else {
        await setDoc(doc(db, "rooms", room, "game", "current"), { revealed: newRevealed }, { merge: true });
        setTimeout(async () => {
          await setDoc(doc(db, "rooms", room, "game", "current"), { revealed: [], turn: partnerId }, { merge: true });
        }, 1000);
      }
    } else {
      await setDoc(doc(db, "rooms", room, "game", "current"), { revealed: newRevealed }, { merge: true });
    }
  }

  return (
    <div className="memory-game">
      <div className="memory-scores">
        <span className={isMyTurn ? "active" : ""}>{me?.name}: {myScore}</span>
        <span className={!isMyTurn ? "active" : ""}>{them?.name}: {theirScore}</span>
      </div>
      <p className="os-hint">{isMyTurn ? "Your turn — flip two cards" : `${them?.name}'s turn...`}</p>
      <div className="memory-board">
        {board.map((emoji, i) => {
          const show = revealed.includes(i) || matched.includes(i);
          return (
            <button
              key={i}
              className={`mem-card ${show ? "flipped" : ""} ${matched.includes(i) ? "matched" : ""}`}
              onClick={() => flipCard(i)}
              disabled={!isMyTurn || show}
            >
              {show ? emoji : "?"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ====== TAP BATTLE ======
function TapBattle({ gs, db, room, playerId, partnerId, me, them, timer, onEnd }) {
  const myTaps = gs[`taps_${playerId}`] || 0;
  const theirTaps = gs[`taps_${partnerId}`] || 0;

  async function tap() {
    const key = `taps_${playerId}`;
    await setDoc(doc(db, "rooms", room, "game", "current"), { [key]: (gs[key] || 0) + 1 }, { merge: true });
  }

  useEffect(() => {
    if (timer <= 0 && myTaps + theirTaps > 0) {
      onEnd(myTaps > theirTaps ? playerId : theirTaps > myTaps ? partnerId : null);
    }
  }, [timer]);

  return (
    <div className="tap-game">
      <div className="tap-scores">
        <div className="tap-score mine"><span>{myTaps}</span><span className="tap-name">{me?.name}</span></div>
        <span className="tap-vs">vs</span>
        <div className="tap-score theirs"><span>{theirTaps}</span><span className="tap-name">{them?.name}</span></div>
      </div>
      <button className="tap-btn" onClick={tap}>
        <span>👆</span>
        <span>TAP!</span>
      </button>
      <p className="os-hint">Tap as fast as you can!</p>
    </div>
  );
}

// ====== WORD CHAIN ======
function WordChain({ gs, db, room, playerId, partnerId, me, them, onEnd }) {
  const [word, setWord] = useState("");
  const words = gs.words || [];
  const turn = gs.turn;
  const isMyTurn = turn === playerId;
  const lastWord = words[words.length - 1];
  const lastLetter = lastWord?.word?.slice(-1)?.toLowerCase();

  async function submitWord() {
    if (!word.trim()) return;
    const w = word.trim().toLowerCase();
    if (lastLetter && w[0] !== lastLetter) return;
    if (words.some((x) => x.word.toLowerCase() === w)) return;
    const newWords = [...words, { word: w, by: playerId }];
    await setDoc(doc(db, "rooms", room, "game", "current"), { words: newWords, turn: partnerId }, { merge: true });
    setWord("");
  }

  async function giveUp() {
    await onEnd(partnerId);
  }

  return (
    <div className="chain-game">
      <div className="chain-words">
        {words.slice(-8).map((w, i) => (
          <div key={i} className={`chain-word ${w.by === playerId ? "mine" : "theirs"}`}>
            {w.word}
          </div>
        ))}
      </div>
      {isMyTurn ? (
        <div className="chain-input">
          {lastLetter && <p className="chain-hint">Start with: <strong>{lastLetter.toUpperCase()}</strong></p>}
          <div className="chain-row">
            <input className="input" value={word} onChange={(e) => setWord(e.target.value)} placeholder="Type a word..." maxLength={30} onKeyDown={(e) => e.key === "Enter" && submitWord()} />
            <button className="btn btn-primary" onClick={submitWord} style={{ width: "auto", padding: ".7rem 1rem" }}>→</button>
          </div>
          <button className="btn btn-ghost" onClick={giveUp} style={{ fontSize: ".8rem" }}>Give up 🏳️</button>
        </div>
      ) : (
        <p className="os-hint">Waiting for {them?.name}...</p>
      )}
    </div>
  );
}

// ====== TRIVIA ======
function TriviaGame({ gs, db, room, playerId, partnerId, me, them, onEnd }) {
  const round = gs.round || 0;
  const q = gs.questions?.[round];
  const myPick = gs[`t${round}_${playerId}`];
  const theirPick = gs[`t${round}_${partnerId}`];
  const [revealed, setRevealed] = useState(false);

  useEffect(() => { setRevealed(false); }, [round]);

  useEffect(() => {
    if (myPick && theirPick && !revealed) {
      setRevealed(true);
      setTimeout(async () => {
        if (round + 1 >= (gs.questions?.length || 5)) {
          const ms = gs[`score_${playerId}`] || 0;
          const ts = gs[`score_${partnerId}`] || 0;
          await onEnd(ms > ts ? playerId : ts > ms ? partnerId : null);
        } else {
          await setDoc(doc(db, "rooms", room, "game", "current"), { round: round + 1 }, { merge: true });
        }
      }, 2000);
    }
  }, [myPick, theirPick, revealed]);

  async function answer(opt) {
    const correct = opt === q.a;
    const scoreKey = `score_${playerId}`;
    await setDoc(doc(db, "rooms", room, "game", "current"), {
      [`t${round}_${playerId}`]: opt,
      [scoreKey]: (gs[scoreKey] || 0) + (correct ? 1 : 0),
    }, { merge: true });
  }

  if (!q) return <p>Loading...</p>;

  return (
    <div className="trivia-game">
      <p className="wyr-round">Q{round + 1}/{gs.questions?.length || 5}</p>
      <h3 className="trivia-q">{q.q}</h3>
      {!myPick ? (
        <div className="trivia-opts">
          {q.opts.map((o) => (
            <button key={o} className="trivia-opt" onClick={() => answer(o)}>{o}</button>
          ))}
        </div>
      ) : !theirPick ? (
        <p className="os-hint">Waiting for {them?.name}...</p>
      ) : (
        <div className="trivia-reveal fade-in">
          <p>Correct: <strong>{q.a}</strong></p>
          <p>{me?.name}: {myPick === q.a ? "✅" : "❌"} | {them?.name}: {theirPick === q.a ? "✅" : "❌"}</p>
        </div>
      )}
      <div className="trivia-scores">
        <span>{me?.name}: {gs[`score_${playerId}`] || 0}</span>
        <span>{them?.name}: {gs[`score_${partnerId}`] || 0}</span>
      </div>
    </div>
  );
}
