// Level milestones — what unlocks at each level

export const MILESTONES = [
  { level: 1, title: "Getting Started",  emoji: "🌱", unlock: "Basic decks + home + games", unlockedDecks: ["wyr", "tot", "daily", "rate", "challenge"], feature: "apartment,notes,miniGames" },
  { level: 2, title: "New Friend",       emoji: "🐾", unlock: "Adopt a pet!",               unlockedDecks: [], feature: "pet" },
  { level: 3, title: "Hot Takes",        emoji: "🔥", unlock: "Hot Takes + basic gifts",    unlockedDecks: ["hottake"], feature: "gifts,songs" },
  { level: 4, title: "Playground",       emoji: "🎾", unlock: "Pet playground",              unlockedDecks: [], feature: "playground" },
  { level: 5, title: "Butterflies",      emoji: "🦋", unlock: "Butterflies + bouquets",     unlockedDecks: ["spicy"], feature: "bouquets" },
  { level: 6, title: "Getting Real",     emoji: "🎭", unlock: "2 Truths 1 Lie",             unlockedDecks: ["2truths"] },
  { level: 7, title: "About Us",         emoji: "💜", unlock: "About Us + love letters",    unlockedDecks: ["aboutus"], feature: "loveLetter" },
  { level: 8, title: "Deep Talks",       emoji: "🌙", unlock: "Deep Talks + second pet",    unlockedDecks: ["deep"], feature: "secondPet" },
  { level: 9, title: "Inseparable",      emoji: "🔗", unlock: "All decks",                  unlockedDecks: [] },
  { level: 10, title: "Soulmates",       emoji: "✨", unlock: "You made it",                unlockedDecks: [] },
];

// Preview items for locked features
export const FEATURE_PREVIEWS = [
  { feature: "pet", emoji: "🐾", label: "Pets", desc: "Adopt a pet together" },
  { feature: "gifts", emoji: "🎁", label: "Gifts", desc: "Send flowers & gifts" },
  { feature: "songs", emoji: "🎵", label: "Songs", desc: "Share music" },
  { feature: "playground", emoji: "🎾", label: "Playground", desc: "Play with your pet" },
  { feature: "bouquets", emoji: "💐", label: "Bouquets", desc: "Send & water bouquets" },
  { feature: "loveLetter", emoji: "💌", label: "Love Letters", desc: "Write love letters" },
  { feature: "secondPet", emoji: "🐾🐾", label: "Second Pet", desc: "Adopt another pet" },
  { feature: "miniGames", emoji: "🎮", label: "Games", desc: "Real-time mini games" },
];

function parseFeatures(ms) {
  const f = new Set();
  for (const m of ms) {
    if (m.feature) m.feature.split(",").forEach((x) => f.add(x.trim()));
  }
  return f;
}

export function getUnlockedDecks(level) {
  const ids = new Set();
  for (const m of MILESTONES) {
    if (m.level <= level) {
      for (const id of m.unlockedDecks) ids.add(id);
    }
  }
  ids.add("custom");
  ids.add("favorites");
  return ids;
}

export function getUnlockedFeatures(level) {
  return parseFeatures(MILESTONES.filter((m) => m.level <= level));
}

export function getNextMilestone(level) {
  return MILESTONES.find((m) => m.level > level) || null;
}

export function getMilestone(level) {
  return MILESTONES.find((m) => m.level === level) || null;
}

// Get locked previews for the hub
export function getLockedPreviews(level) {
  const unlocked = getUnlockedFeatures(level);
  const locked = [];
  for (const p of FEATURE_PREVIEWS) {
    if (!unlocked.has(p.feature)) {
      const ms = MILESTONES.find((m) => m.feature?.includes(p.feature));
      if (ms) locked.push({ ...p, level: ms.level });
    }
  }
  return locked;
}
