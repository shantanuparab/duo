export const LEVELS = [
  0,       // Lv 1
  50,      // Lv 2
  150,     // Lv 3
  300,     // Lv 4
  500,     // Lv 5
  800,     // Lv 6
  1200,    // Lv 7
  1700,    // Lv 8
  2400,    // Lv 9
  3200,    // Lv 10
  4200,    // Lv 11
  5400,    // Lv 12
  6800,    // Lv 13
  8500,    // Lv 14
  10500,   // Lv 15
  13000,   // Lv 16
  16000,   // Lv 17
  19500,   // Lv 18
  24000,   // Lv 19
  30000,   // Lv 20
  99999,   // cap
];

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
