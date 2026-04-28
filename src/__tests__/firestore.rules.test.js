import { describe, it } from "vitest";

// PLACEHOLDER for Day 8 work — Firestore rules tests.
//
// This file's current state covers what to test, not how to run it. Wiring
// up the Firestore emulator + @firebase/rules-unit-testing takes ~1-2 hours
// CC and a working Java install on the dev machine (the emulator is JVM-based).
//
// To complete this:
//   1. Install: `npm install -D @firebase/rules-unit-testing`
//   2. Start emulator: `firebase emulators:start --only firestore`
//   3. Implement the it() bodies below using initializeTestEnvironment().
//
// The 13 cases below mirror the test plan artifact at
// ~/.gstack/projects/shantanuparab-duo/shantanu-main-eng-review-test-plan-*.md

describe.skip("firestore.rules — Adventures chapter", () => {
  it("member of room can read rooms/{roomId}/adventures/{chapterId}", () => {});
  it("non-member cannot read", () => {});
  it("member can create chapter doc with currentPromptIndex=0 and schemaVersion=1", () => {});
  it("rejects create with currentPromptIndex != 0 (mid-progress create blocked)", () => {});
  it("rejects create with wrong schemaVersion", () => {});
  it("member can write own answer field on current prompt (no advance)", () => {});
  it("member can advance from N to N+1", () => {});
  it("rejects advance by more than +1", () => {});
  it("rejects delete (chapter docs are immutable history)", () => {});
});

describe.skip("firestore.rules — Side Quest", () => {
  it("member can create rooms/{roomId}/adventures/sidequest-{id}", () => {});
  it("member can read and update existing side quest", () => {});
  it("multiple side quest sessions can coexist (no overwrite)", () => {});
  it("rejects delete (history preserved)", () => {});
});
