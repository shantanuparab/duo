// Adventures content — Chapters mapped to relationship-stage research.
//
// **APPEND-ONLY AFTER DEPLOY.** In-flight rooms reference prompts by index
// (currentPromptIndex). Inserting a prompt mid-chapter or reordering will
// break in-flight rooms because their stored index now points to a different
// prompt. Only append at the end of `prompts`. Reorder requires a migration.
//
// Each chapter unlocks at a specific level that aligns with where the couple
// is in the relationship arc:
//
//   Chapter 1 - L3  - Love Maps          - Knapp: Initiating + Experimenting
//                                          (Modern: "Flirtationship" / talking)
//   Chapter 2 - L5  - Becoming Closer    - Knapp: Intensifying
//                                          (Modern: "Relationship Potential")
//   Chapter 3 - L7  - Becoming Us        - Knapp: Integrating
//                                          (Modern: "In a Relationship")
//   Chapter 4 - L10 - Imagined Futures   - Knapp: Bonding (early)
//                                          (Modern: deep commitment forming)
//   Chapter 5 - L15 - The Long Game      - Knapp: Bonding (mature)
//                                          (Modern: "Commitment or Bust")
//
// Frameworks: Gottman (Love Maps + Sound Relationship House), Aron (deepening
// + vulnerability questions Q13-36), Sternberg (intimacy/passion/commitment),
// Fisher (lust/attraction/attachment brain systems).
//
// Prompt type contract:
//   - 'question'   — single text answer per partner. Hidden until both submit.
//   - 'challenge'  — real-world action, honor-system. Both press "we did it".
//   - 'exchange'   — both write privately, reveal simultaneously.
//   - 'vibe-check' — both rate on a slider, compare hidden values.

export const ADVENTURE_CHAPTERS = [
  // -----------------------------------------------------------------------
  // CHAPTER 1 - Love Maps (L3) - Initiating + Experimenting
  // -----------------------------------------------------------------------
  {
    id: "love-maps",
    title: "Chapter 1: Love Maps",
    subtitle: "Getting to know your weather",
    framework: "Based on Dr. John Gottman's Sound Relationship House",
    sourceUrl: "https://www.gottman.com/blog/love-maps/",
    unlockLevel: 3,
    description:
      "Knowing each other doesn't start with the big stuff. It starts with the small weather: pet peeves, comfort food, the dumb things you loved as a kid, the perfect Sunday. Walk this chapter slowly. One prompt a day, both of you.",
    schemaVersion: 1,
    prompts: [
      {
        id: "lm-1",
        type: "question",
        baseText:
          "What's one small thing that always makes you smile, no matter how rough the day's been?",
      },
      {
        id: "lm-2",
        type: "vibe-check",
        baseText: "How are you feeling about us today?",
        scale: { min: 1, max: 10, lowLabel: "off", highLabel: "really good" },
      },
      {
        id: "lm-3",
        type: "question",
        baseText:
          "What did you have for breakfast this morning? Was it actually good or just functional?",
      },
      {
        id: "lm-4",
        type: "challenge",
        baseText:
          "Send a photo of the most boring thing within reach right now, and tell them why it actually makes you happy.",
        confirmation: "both-press-done",
      },
      {
        id: "lm-5",
        type: "question",
        baseText:
          "What's one of your weirdest pet peeves? The kind you can't even justify out loud.",
      },
      {
        id: "lm-6",
        type: "exchange",
        baseText:
          "Both write three things you'd want a perfect lazy Sunday to include. Reveal at the same time.",
        revealMode: "simultaneous",
      },
      {
        id: "lm-7",
        type: "question",
        baseText:
          "What's something dumb you absolutely loved as a kid? Cartoon, food, hobby, anything.",
      },
      {
        id: "lm-8",
        type: "challenge",
        baseText:
          "Call them tonight before bed (audio or video, your call). Tell them one thing they did this week that surprised you in a good way.",
        confirmation: "both-press-done",
      },
      {
        id: "lm-9",
        type: "question",
        baseText:
          "Where in the world do you feel most like yourself? It can be a place, a time of day, a kind of room — anywhere.",
      },
      {
        id: "lm-10",
        type: "exchange",
        baseText:
          "Both write what you'd most want this thing-between-us to feel like over the next few months. Three short phrases or a sentence. Reveal at the same time.",
        revealMode: "simultaneous",
      },
    ],
  },

  // -----------------------------------------------------------------------
  // CHAPTER 2 - Becoming Closer (L5) - Intensifying
  // -----------------------------------------------------------------------
  // The "can't-stop-thinking-about-you" phase, neurochemistry-wise. Mutual
  // affection signals start showing up. The Aron deepening set fits here,
  // softened to match early intensifying. Fisher's romantic-attraction stage.
  {
    id: "becoming-closer",
    title: "Chapter 2: Becoming Closer",
    subtitle: "When the weather starts mattering",
    framework: "Based on Arthur Aron's deepening questions + Fisher's attraction-stage research",
    sourceUrl: "https://en.wikipedia.org/wiki/36_Questions_That_Lead_to_Love",
    unlockLevel: 5,
    description:
      "Somewhere between 'getting to know you' and 'I keep thinking about you' is the part where small things start mattering. The way you laugh. The thing you said on Tuesday. Whose voice you want at the end of a hard day. This chapter sits there.",
    schemaVersion: 1,
    prompts: [
      {
        id: "bc-1",
        type: "question",
        baseText:
          "What's a small thing I do that you find yourself smiling about when I'm not around?",
      },
      {
        id: "bc-2",
        type: "vibe-check",
        baseText: "Honestly — how much have you been thinking about me this week?",
        scale: { min: 1, max: 10, lowLabel: "barely", highLabel: "constantly" },
      },
      {
        id: "bc-3",
        type: "question",
        baseText:
          "What's something you wish more people knew about you, that you'd be glad if I knew?",
      },
      {
        id: "bc-4",
        type: "exchange",
        baseText:
          "Both write three songs that remind you of someone you've cared about. Reveal at the same time. Then talk about why.",
        revealMode: "simultaneous",
      },
      {
        id: "bc-5",
        type: "question",
        baseText:
          "Is there something you've wanted to do for a long time and haven't? What's the actual reason — not the polite one?",
      },
      {
        id: "bc-6",
        type: "challenge",
        baseText:
          "Send a voice note today about the most boring meeting, class, or moment of your week. Your voice matters more than the words.",
        confirmation: "both-press-done",
      },
      {
        id: "bc-7",
        type: "question",
        baseText:
          "What's the kindest thing someone's done for you recently? Have you told them?",
      },
      {
        id: "bc-8",
        type: "exchange",
        baseText:
          "Both write five small things that have quietly become 'yours' — a coffee order, a chair, a song, a route home, anything. Reveal at the same time.",
        revealMode: "simultaneous",
      },
      {
        id: "bc-9",
        type: "question",
        baseText:
          "What kind of moment in your week do you want to share with me, but you don't always remember to?",
      },
      {
        id: "bc-10",
        type: "vibe-check",
        baseText: "How close do you feel to me compared to a month ago?",
        scale: { min: 1, max: 10, lowLabel: "about the same", highLabel: "way closer" },
      },
    ],
  },

  // -----------------------------------------------------------------------
  // CHAPTER 3 - Becoming Us (L7) - Integrating
  // -----------------------------------------------------------------------
  // "Coupled" identity forms. Friend groups overlap, conflict patterns
  // surface, complementarity becomes legible. Sternberg intimacy + Gottman
  // Sound Relationship House's "turning toward" pillar.
  {
    id: "becoming-us",
    title: "Chapter 3: Becoming Us",
    subtitle: "How we fit, how we fight, how we hold",
    framework: "Based on Sternberg's intimacy theory + Gottman's Sound Relationship House",
    sourceUrl: "https://www.gottman.com/blog/the-sound-relationship-house/",
    unlockLevel: 7,
    description:
      "At some point you stop being two people who like each other and start being a we. Friends notice. Conflict patterns show up. You start doing each other's mannerisms without meaning to. This chapter is for that.",
    schemaVersion: 1,
    prompts: [
      {
        id: "bu-1",
        type: "exchange",
        baseText:
          "Both finish the sentence: 'When we're at our best together, what we look like is ___'. Reveal at the same time.",
        revealMode: "simultaneous",
      },
      {
        id: "bu-2",
        type: "question",
        baseText:
          "What's the thing about us you'd defend to a friend or family member who didn't get it?",
      },
      {
        id: "bu-3",
        type: "question",
        baseText:
          "When we disagree, what's a pattern you've noticed in how we handle it? Be honest — even the part that isn't flattering.",
      },
      {
        id: "bu-4",
        type: "vibe-check",
        baseText: "How safe do you feel disagreeing with me?",
        scale: { min: 1, max: 10, lowLabel: "not safe", highLabel: "fully safe" },
      },
      {
        id: "bu-5",
        type: "challenge",
        baseText:
          "Tell me, in person or by voice note, one thing I do — a habit, a phrase, a mannerism — that you've started doing too.",
        confirmation: "both-press-done",
      },
      {
        id: "bu-6",
        type: "question",
        baseText:
          "What's something I've done recently that made you trust me more, even if I don't realize I did it?",
      },
      {
        id: "bu-7",
        type: "exchange",
        baseText:
          "Both write three things you do as a pair that no one else gets to do with you. Reveal at the same time.",
        revealMode: "simultaneous",
      },
      {
        id: "bu-8",
        type: "question",
        baseText:
          "What's a way I've changed since we became 'us', that you didn't expect?",
      },
      {
        id: "bu-9",
        type: "question",
        baseText:
          "What's a fear you have about us specifically? Not relationships in general — about this one.",
      },
      {
        id: "bu-10",
        type: "exchange",
        baseText:
          "Both write a sentence you'd want a future version of us to know about THIS exact moment in our story. Reveal at the same time.",
        revealMode: "simultaneous",
      },
    ],
  },

  // -----------------------------------------------------------------------
  // CHAPTER 4 - Imagined Futures (L10) - Bonding (early)
  // -----------------------------------------------------------------------
  // Future-orientation. Vulnerability deepens. Aron Q25-36 vulnerability
  // territory + Fisher's attachment-stage neurochemistry (oxytocin, calm,
  // security, "the long view").
  {
    id: "imagined-futures",
    title: "Chapter 4: Imagined Futures",
    subtitle: "What might we be?",
    framework: "Based on Aron Q25-36 (vulnerability set) + Fisher's attachment stage",
    sourceUrl: "https://en.wikipedia.org/wiki/36_Questions_That_Lead_to_Love",
    unlockLevel: 10,
    description:
      "There's a version of you that thinks about a future with the other person and a version that doesn't. This chapter is for when both of you have started thinking about it. The questions are heavier here. Take your time.",
    schemaVersion: 1,
    prompts: [
      {
        id: "if-1",
        type: "question",
        baseText:
          "If you knew that next year would be a hard year — money, health, family — would you want to spend it with me? Why?",
      },
      {
        id: "if-2",
        type: "exchange",
        baseText:
          "Both write three 'we' statements about the version of us you most want. ('We are people who ___.' / 'We choose ___.' / 'We will ___.') Reveal at the same time.",
        revealMode: "simultaneous",
      },
      {
        id: "if-3",
        type: "question",
        baseText:
          "What's something you've never said out loud about what you actually want from a long partnership?",
      },
      {
        id: "if-4",
        type: "question",
        baseText:
          "If we both had unlimited choice, what's the version of life in 5 years you'd genuinely want for us?",
      },
      {
        id: "if-5",
        type: "challenge",
        baseText:
          "Write one paragraph as a letter from future-us (5 years from now) to current-us. Send it to me. I'll do the same.",
        confirmation: "both-press-done",
      },
      {
        id: "if-6",
        type: "question",
        baseText:
          "What's something about your past you'd want a long-term partner to fully know? You don't have to share it in detail here — just name what it is.",
      },
      {
        id: "if-7",
        type: "vibe-check",
        baseText: "How ready do you feel, right now, to bet on this?",
        scale: { min: 1, max: 10, lowLabel: "still unsure", highLabel: "all in" },
      },
      {
        id: "if-8",
        type: "exchange",
        baseText:
          "Both write five things you'd want our home to feel like in 5 years. (Light, smells, mornings, who's there, what's on the walls.) Reveal at the same time.",
        revealMode: "simultaneous",
      },
      {
        id: "if-9",
        type: "question",
        baseText:
          "What would you want me to do, specifically, if something terrible happened to you tomorrow?",
      },
      {
        id: "if-10",
        type: "question",
        baseText:
          "If we were going to be together for the long run, what's one thing we'd need to figure out that we haven't yet?",
      },
    ],
  },

  // -----------------------------------------------------------------------
  // CHAPTER 5 - The Long Game (L15) - Bonding (mature)
  // -----------------------------------------------------------------------
  // Sternberg consummate love (intimacy + passion + commitment). The
  // hardest topics: family, mortality, regrets, deep honesty. Reserved for
  // couples who've earned every prior chapter.
  {
    id: "long-game",
    title: "Chapter 5: The Long Game",
    subtitle: "What we're really signing up for",
    framework: "Based on Sternberg's consummate love + research on long-term partnership",
    sourceUrl: "https://en.wikipedia.org/wiki/Triangular_theory_of_love",
    unlockLevel: 15,
    description:
      "By the time you reach this chapter, you've walked four others together. The questions here are the ones long-term partners eventually have to answer. Hard topics, hard honesty, the things you'd want to be sure of before saying yes for life.",
    schemaVersion: 1,
    prompts: [
      {
        id: "lg-1",
        type: "question",
        baseText:
          "What's a topic you've been quietly avoiding bringing up with me — and what's been holding you back?",
      },
      {
        id: "lg-2",
        type: "exchange",
        baseText:
          "Both write what 'family' will mean to us, in your own words. Reveal at the same time. Notice where you overlap and where you don't.",
        revealMode: "simultaneous",
      },
      {
        id: "lg-3",
        type: "question",
        baseText:
          "What does success in a long partnership look like to you? Twenty years in, what do you most hope is true about us?",
      },
      {
        id: "lg-4",
        type: "question",
        baseText:
          "What's something about your family or upbringing you never want to repeat with us?",
      },
      {
        id: "lg-5",
        type: "vibe-check",
        baseText: "How honest do you feel you've been with me about your hopes for our future?",
        scale: { min: 1, max: 10, lowLabel: "holding back", highLabel: "fully open" },
      },
      {
        id: "lg-6",
        type: "challenge",
        baseText:
          "Write one thing you've been afraid to ask me, and ask it. Out loud or by voice note, your choice. I'll do the same.",
        confirmation: "both-press-done",
      },
      {
        id: "lg-7",
        type: "question",
        baseText:
          "If we had to choose between a stable life and an interesting one, where do you want us to land? Why?",
      },
      {
        id: "lg-8",
        type: "exchange",
        baseText:
          "Both write the three biggest regrets you'd want to have avoided by the time you're old. Reveal at the same time.",
        revealMode: "simultaneous",
      },
      {
        id: "lg-9",
        type: "question",
        baseText:
          "What's something you'd want me to tell you about yourself when you can't see it clearly anymore?",
      },
      {
        id: "lg-10",
        type: "question",
        baseText:
          "If this version of us is the one we keep, what's the first hard thing we'll need to face together? Are we ready?",
      },
    ],
  },
];

// Side Quest: Repair Toolkit. Surfaces only when partner mood is in the trigger set.
// Available across all chapters — repair work isn't gated by relationship stage.
export const SIDE_QUEST_REPAIR = {
  id: "repair",
  title: "Side Quest: Repair",
  framework: "Based on Dr. John Gottman's repair attempts research",
  sourceUrl: "https://www.gottman.com/blog/r-is-for-repair/",
  description:
    "When something feels off between you, this is a structured way back. Five prompts. Don't argue inside it — just write what's true.",
  schemaVersion: 1,
  prompts: [
    {
      id: "rep-1",
      type: "question",
      baseText:
        "In one sentence, what hurt? Don't explain why it was unreasonable. Just what hurt.",
    },
    {
      id: "rep-2",
      type: "question",
      baseText:
        "What did you make it mean about us? (\"You don't care about me\", \"I'm not a priority\", etc.) Write the meaning, even if you know it isn't fair.",
    },
    {
      id: "rep-3",
      type: "exchange",
      baseText:
        "Both write one thing the other person did right in the difficult moment. Even if it was small. Reveal together.",
      revealMode: "simultaneous",
    },
    {
      id: "rep-4",
      type: "question",
      baseText:
        "What's one specific thing the other person could do (or stop doing) that would make this kind of moment easier next time?",
    },
    {
      id: "rep-5",
      type: "vibe-check",
      baseText:
        "After writing this, how repaired do you feel right now?",
      scale: { min: 1, max: 10, lowLabel: "still raw", highLabel: "we're okay" },
    },
  ],
};

// Helpers
export function getChapterById(id) {
  return ADVENTURE_CHAPTERS.find((c) => c.id === id) || null;
}

// Returns the highest-unlocked chapter the couple hasn't yet completed,
// or the highest unlocked chapter if all are complete. Falls back to Chapter 1.
// `level` is the room's current level. Pass it from the caller.
export function getCurrentChapter(level = 1) {
  const unlocked = ADVENTURE_CHAPTERS.filter((c) => c.unlockLevel <= level);
  if (unlocked.length === 0) return ADVENTURE_CHAPTERS[0];
  return unlocked[unlocked.length - 1];
}

// Returns the chapter that follows the given one IN THE LIST, regardless of
// unlock state. The UI is responsible for checking unlockLevel before offering
// a transition CTA.
export function getNextChapter(currentId) {
  const idx = ADVENTURE_CHAPTERS.findIndex((c) => c.id === currentId);
  if (idx < 0 || idx >= ADVENTURE_CHAPTERS.length - 1) return null;
  return ADVENTURE_CHAPTERS[idx + 1];
}

// Validates an answer against a prompt's type. Throws on shape mismatch so we
// catch silent bad-writes at submit time. (eng review 2C)
export function validateAnswerShape(prompt, answer) {
  if (!prompt) throw new Error("validateAnswerShape: missing prompt");
  switch (prompt.type) {
    case "question":
    case "exchange":
      if (typeof answer !== "string" || answer.trim().length === 0) {
        throw new Error(`validateAnswerShape: ${prompt.type} requires non-empty string`);
      }
      return true;
    case "challenge":
      if (answer !== true && answer !== false) {
        throw new Error("validateAnswerShape: challenge requires boolean");
      }
      return true;
    case "vibe-check":
      if (typeof answer !== "number" || answer < prompt.scale.min || answer > prompt.scale.max) {
        throw new Error(
          `validateAnswerShape: vibe-check requires number in [${prompt.scale.min}, ${prompt.scale.max}]`
        );
      }
      return true;
    default:
      throw new Error(`validateAnswerShape: unknown prompt type: ${prompt.type}`);
  }
}
