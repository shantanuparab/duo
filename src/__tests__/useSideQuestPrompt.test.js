import { describe, it, expect } from "vitest";
import { evaluateSideQuestTrigger } from "../hooks/useSideQuestPrompt";

// Tests target the pure decision function (extracted from the hook so we don't
// need React Testing Library just for this).

describe("evaluateSideQuestTrigger", () => {
  const baseRoom = {
    player1: { id: "p1", name: "Alex" },
    player2: { id: "p2", name: "Sam" },
  };

  it("returns shouldShow=false when roomData missing", () => {
    expect(evaluateSideQuestTrigger(null, "p1").shouldShow).toBe(false);
  });

  it("returns shouldShow=false when no partner mood is set", () => {
    expect(evaluateSideQuestTrigger(baseRoom, "p1").shouldShow).toBe(false);
  });

  it("returns shouldShow=true when partner mood is in trigger set", () => {
    const room = { ...baseRoom, mood_p2: "sad" };
    const result = evaluateSideQuestTrigger(room, "p1");
    expect(result.shouldShow).toBe(true);
    expect(result.partnerName).toBe("Sam");
    expect(result.partnerMoodId).toBe("sad");
  });

  it("returns shouldShow=false when partner mood is positive/neutral", () => {
    for (const m of ["happy", "loving", "excited", "energized", "chill", "grateful"]) {
      const room = { ...baseRoom, mood_p2: m };
      expect(evaluateSideQuestTrigger(room, "p1").shouldShow, `mood ${m} shouldn't trigger`).toBe(false);
    }
  });

  it("triggers on each of the negative moods", () => {
    for (const m of ["sad", "angry", "anxious", "moody", "low"]) {
      const room = { ...baseRoom, mood_p2: m };
      expect(evaluateSideQuestTrigger(room, "p1").shouldShow, `mood ${m} should trigger`).toBe(true);
    }
  });

  it("checks partner mood (not own mood) — symmetric for player2 perspective", () => {
    const room = { ...baseRoom, mood_p1: "sad" };
    // I am player2; my partner is player1; their mood is "sad" → trigger
    expect(evaluateSideQuestTrigger(room, "p2").shouldShow).toBe(true);
    // I am player1; my own mood is "sad", partner has no mood → no trigger
    expect(evaluateSideQuestTrigger(room, "p1").shouldShow).toBe(false);
  });
});
