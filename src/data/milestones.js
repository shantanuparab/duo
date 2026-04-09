// Level milestones — what unlocks at each level

export const MILESTONES = [
  { level: 1, title: "Getting Started",  emoji: "🌱", unlock: "Basic decks",           unlockedDecks: ["wyr", "tot", "daily", "rate", "challenge"] },
  { level: 2, title: "New Friend",       emoji: "🐾", unlock: "Adopt a pet together!",  unlockedDecks: [], feature: "pet" },
  { level: 3, title: "Hot Takes",        emoji: "🔥", unlock: "Hot Takes deck",         unlockedDecks: ["hottake"] },
  { level: 4, title: "Warming Up",       emoji: "🎁", unlock: "Gifts & songs",          unlockedDecks: [], feature: "gifts,songs" },
  { level: 5, title: "Butterflies",      emoji: "🦋", unlock: "Butterflies deck",       unlockedDecks: ["spicy"] },
  { level: 6, title: "Getting Real",     emoji: "🎭", unlock: "2 Truths 1 Lie deck",    unlockedDecks: ["2truths"] },
  { level: 7, title: "About Us",         emoji: "💜", unlock: "About Us deck",          unlockedDecks: ["aboutus"] },
  { level: 8, title: "Deep Talks",       emoji: "🌙", unlock: "Deep Talks + second pet", unlockedDecks: ["deep"], feature: "secondPet" },
  { level: 9, title: "Inseparable",      emoji: "🔗", unlock: "All decks unlocked",     unlockedDecks: [] },
  { level: 10, title: "Soulmates",       emoji: "✨", unlock: "You made it",            unlockedDecks: [] },
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
