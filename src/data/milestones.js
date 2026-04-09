// Level milestones — what unlocks at each level

export const MILESTONES = [
  { level: 1, title: "Getting Started",  emoji: "🌱", unlock: "Basic decks",              unlockedDecks: ["wyr", "tot", "daily", "rate", "challenge"] },
  { level: 2, title: "New Friend",       emoji: "🐾", unlock: "Adopt a pet!",              unlockedDecks: [], feature: "pet,notes" },
  { level: 3, title: "Hot Takes",        emoji: "🔥", unlock: "Hot Takes + basic gifts",   unlockedDecks: ["hottake"], feature: "gifts,songs" },
  { level: 4, title: "Home Sweet Home",  emoji: "🏠", unlock: "Your apartment",            unlockedDecks: [], feature: "apartment" },
  { level: 5, title: "Butterflies",      emoji: "🦋", unlock: "Butterflies + bouquets",    unlockedDecks: ["spicy"], feature: "bouquets" },
  { level: 6, title: "Getting Real",     emoji: "🎭", unlock: "2 Truths + playground",     unlockedDecks: ["2truths"], feature: "playground" },
  { level: 7, title: "About Us",         emoji: "💜", unlock: "About Us + love letters",   unlockedDecks: ["aboutus"], feature: "loveLetter" },
  { level: 8, title: "Deep Talks",       emoji: "🌙", unlock: "Deep Talks + second pet",   unlockedDecks: ["deep"], feature: "secondPet" },
  { level: 9, title: "Game Night",       emoji: "🎮", unlock: "Mini games unlocked",       unlockedDecks: [], feature: "miniGames" },
  { level: 10, title: "Soulmates",       emoji: "✨", unlock: "You made it — all unlocked", unlockedDecks: [] },
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
