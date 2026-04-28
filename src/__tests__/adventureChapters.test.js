import { describe, it, expect } from "vitest";
import {
  ADVENTURE_CHAPTERS,
  SIDE_QUEST_REPAIR,
  getChapterById,
  getCurrentChapter,
  validateAnswerShape,
} from "../data/adventureChapters";

// These tests guard the content schema and the answer-shape validator that
// firebase.js calls before every Adventures write. Both are pure JS — fast,
// no mocks needed.

describe("adventureChapters schema integrity", () => {
  it("exposes at least one chapter", () => {
    expect(ADVENTURE_CHAPTERS.length).toBeGreaterThan(0);
  });

  it("Chapter 1 (Love Maps) has the expected shape", () => {
    const c = getChapterById("love-maps");
    expect(c).toBeTruthy();
    expect(c.schemaVersion).toBe(1);
    expect(c.framework).toMatch(/Gottman/i);
    expect(c.prompts.length).toBeGreaterThanOrEqual(10);
  });

  it("getCurrentChapter returns Chapter 1", () => {
    expect(getCurrentChapter().id).toBe("love-maps");
  });

  it("every prompt across every chapter has a valid shape", () => {
    const validTypes = new Set(["question", "challenge", "exchange", "vibe-check"]);
    for (const chapter of ADVENTURE_CHAPTERS) {
      for (const p of chapter.prompts) {
        expect(p.id, "prompt missing id").toBeTruthy();
        expect(p.baseText, "prompt missing baseText").toBeTruthy();
        expect(validTypes.has(p.type), `unknown prompt type: ${p.type}`).toBe(true);
        if (p.type === "vibe-check") {
          expect(p.scale).toBeTruthy();
          expect(typeof p.scale.min).toBe("number");
          expect(typeof p.scale.max).toBe("number");
          expect(p.scale.max).toBeGreaterThan(p.scale.min);
        }
      }
    }
  });

  it("prompt ids are unique within a chapter (eng review 1B append-only constraint)", () => {
    for (const chapter of ADVENTURE_CHAPTERS) {
      const ids = chapter.prompts.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("Side Quest (Repair Toolkit) has 5 prompts (eng review premise 2)", () => {
    expect(SIDE_QUEST_REPAIR.prompts.length).toBe(5);
  });
});

describe("validateAnswerShape", () => {
  const question = { id: "q1", type: "question", baseText: "?" };
  const exchange = { id: "ex1", type: "exchange", baseText: "?" };
  const challenge = { id: "ch1", type: "challenge", baseText: "?" };
  const vibe = { id: "vc1", type: "vibe-check", baseText: "?", scale: { min: 1, max: 10 } };

  it("question accepts non-empty string", () => {
    expect(validateAnswerShape(question, "hello")).toBe(true);
  });

  it("question rejects empty / whitespace string", () => {
    expect(() => validateAnswerShape(question, "")).toThrow();
    expect(() => validateAnswerShape(question, "   ")).toThrow();
  });

  it("question rejects non-string", () => {
    expect(() => validateAnswerShape(question, 5)).toThrow();
    expect(() => validateAnswerShape(question, null)).toThrow();
    expect(() => validateAnswerShape(question, true)).toThrow();
  });

  it("exchange accepts non-empty string (same shape as question)", () => {
    expect(validateAnswerShape(exchange, "hello")).toBe(true);
    expect(() => validateAnswerShape(exchange, "")).toThrow();
  });

  it("challenge accepts boolean", () => {
    expect(validateAnswerShape(challenge, true)).toBe(true);
    expect(validateAnswerShape(challenge, false)).toBe(true);
  });

  it("challenge rejects non-boolean", () => {
    expect(() => validateAnswerShape(challenge, "yes")).toThrow();
    expect(() => validateAnswerShape(challenge, 1)).toThrow();
    expect(() => validateAnswerShape(challenge, null)).toThrow();
  });

  it("vibe-check accepts number in [min, max]", () => {
    expect(validateAnswerShape(vibe, 1)).toBe(true);
    expect(validateAnswerShape(vibe, 5)).toBe(true);
    expect(validateAnswerShape(vibe, 10)).toBe(true);
  });

  it("vibe-check rejects out-of-range or non-number", () => {
    expect(() => validateAnswerShape(vibe, 0)).toThrow();
    expect(() => validateAnswerShape(vibe, 11)).toThrow();
    expect(() => validateAnswerShape(vibe, "5")).toThrow();
    expect(() => validateAnswerShape(vibe, null)).toThrow();
  });

  it("throws on missing prompt", () => {
    expect(() => validateAnswerShape(null, "x")).toThrow();
    expect(() => validateAnswerShape(undefined, "x")).toThrow();
  });

  it("throws on unknown prompt type", () => {
    expect(() => validateAnswerShape({ id: "x", type: "bogus", baseText: "?" }, "x")).toThrow();
  });
});
