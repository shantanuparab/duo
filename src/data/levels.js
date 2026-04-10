export const LEVELS = [0, 50, 150, 300, 500, 800, 1200, 1700, 2400, 3200, 99999];

export function getLevel(xp) {
  for (let i = 0; i < LEVELS.length - 1; i++) {
    if (xp < LEVELS[i + 1]) return { level: i + 1, current: xp - LEVELS[i], needed: LEVELS[i + 1] - LEVELS[i] };
  }
  return { level: LEVELS.length, current: 0, needed: 1 };
}

export function getLevelNumber(xp) {
  for (let i = 0; i < LEVELS.length - 1; i++) {
    if (xp < LEVELS[i + 1]) return i + 1;
  }
  return LEVELS.length;
}
