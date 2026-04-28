// Adventures content — Chapters and Side Quests.
//
// **APPEND-ONLY AFTER DEPLOY.** In-flight rooms reference prompts by index
// (currentPromptIndex). Inserting a prompt mid-chapter or reordering will
// break in-flight rooms because their stored index now points to a different
// prompt. Only append at the end of `prompts`. If you must reorder, write a
// migration that re-maps stored indices.
//
// Prompt type contract:
//   - 'question'   — single text answer per partner. Hidden until both submit.
//   - 'challenge'  — real-world action, honor-system. Both press "we did it".
//                    Optional follow-up appears if confirmations diverge.
//   - 'exchange'   — both write privately, reveal simultaneously when both submit.
//   - 'vibe-check' — both rate on a slider, compare hidden values.

export const ADVENTURE_CHAPTERS = [
  {
    id: "love-maps",
    title: "Chapter 1: Love Maps",
    subtitle: "Getting to know your weather",
    framework: "Based on Dr. John Gottman's Sound Relationship House",
    sourceUrl: "https://www.gottman.com/blog/love-maps/",
    description:
      "Knowing each other doesn't start with the big stuff. It starts with the small weather: pet peeves, comfort food, the dumb things you loved as a kid, the perfect Sunday. Walk this chapter slowly. One prompt a day, both of you.",
    schemaVersion: 1,
    // Gentle ramp: light/playful prompts first, then a small step into reflection,
    // ending with a low-stakes future-vision exchange. The heavier Love Maps
    // territory (family-of-origin rules, hidden fears, mortality, anxiety
    // triggers) is deferred to a future Chapter 1.5 / Chapter 3+ once trust
    // is built. The curriculum bounces here if Day 1 asks for too much.
    prompts: [
      {
        id: "lm-1",
        type: "question",
        baseText:
          "What's one small thing that always makes you smile, no matter how rough the day's been?",
        tags: ["light", "joy"],
      },
      {
        id: "lm-2",
        type: "vibe-check",
        baseText: "How are you feeling about us today?",
        scale: { min: 1, max: 10, lowLabel: "off", highLabel: "really good" },
        tags: ["state", "light"],
      },
      {
        id: "lm-3",
        type: "question",
        baseText:
          "What did you have for breakfast this morning? Was it actually good or just functional?",
        tags: ["everyday", "light"],
      },
      {
        id: "lm-4",
        type: "challenge",
        baseText:
          "Send a photo of the most boring thing within reach right now, and tell them why it actually makes you happy.",
        confirmation: "both-press-done",
        tags: ["challenge", "playful"],
      },
      {
        id: "lm-5",
        type: "question",
        baseText:
          "What's one of your weirdest pet peeves? The kind you can't even justify out loud.",
        tags: ["personality", "playful"],
      },
      {
        id: "lm-6",
        type: "exchange",
        baseText:
          "Both write three things you'd want a perfect lazy Sunday to include. Reveal at the same time.",
        revealMode: "simultaneous",
        tags: ["preferences", "exchange"],
      },
      {
        id: "lm-7",
        type: "question",
        baseText:
          "What's something dumb you absolutely loved as a kid? Cartoon, food, hobby, anything.",
        tags: ["nostalgia", "playful"],
      },
      {
        id: "lm-8",
        type: "challenge",
        baseText:
          "Call them tonight before bed (audio or video, your call). Tell them one thing they did this week that surprised you in a good way.",
        confirmation: "both-press-done",
        tags: ["challenge", "warmth"],
      },
      {
        id: "lm-9",
        type: "question",
        baseText:
          "Where in the world do you feel most like yourself? It can be a place, a time of day, a kind of room — anywhere.",
        tags: ["self", "comfort"],
      },
      {
        id: "lm-10",
        type: "exchange",
        baseText:
          "Both write what you'd most want this thing-between-us to feel like over the next few months. Three short phrases or a sentence. Reveal at the same time.",
        revealMode: "simultaneous",
        tags: ["future", "exchange"],
      },
    ],
  },
];

// Side Quest: Repair Toolkit. Surfaces only when partner mood is in the trigger set.
// Day 9 wires the mood-triggered CTA. For now content lives here for completeness.
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

// Chapter 2 — Aron's deepening questions (Q13-36 of the original 1997 study).
// Q1-12 are designed for strangers and are skipped: couples who already know
// each other will find them beneath the moment. Q13-36 are split into four
// sub-chapter groupings for a sense of arc.
//
// Mostly question-type. Where a prompt benefits from the simultaneous-reveal
// beat, it's promoted to an exchange.
ADVENTURE_CHAPTERS.push({
  id: "deepening",
  title: "Chapter 2: Deeper Waters",
  subtitle: "Adapted from Arthur Aron's deepening questions (1997)",
  framework: "Based on Arthur Aron's 36 Questions That Lead to Love (Q13-36)",
  sourceUrl: "https://en.wikipedia.org/wiki/36_Questions_That_Lead_to_Love",
  description:
    "The Aron questions were designed to manufacture closeness in 45 minutes between strangers. We're not strangers — but the questions still work, slowly, as a way to keep going past the easy answers. Four sub-arcs, six prompts each.",
  schemaVersion: 1,
  prompts: [
    // -- Sub-chapter 1: Becoming Closer (Q13-18) --
    {
      id: "dw-1",
      type: "question",
      baseText:
        "If a crystal ball could tell you the truth about yourself, your life, the future, or anything else — what would you want to know?",
      tags: ["self", "future"],
    },
    {
      id: "dw-2",
      type: "question",
      baseText:
        "Is there something you've dreamed of doing for a long time and haven't done? What's the actual reason you haven't?",
      tags: ["dreams", "honesty"],
    },
    {
      id: "dw-3",
      type: "question",
      baseText: "What's the greatest thing you've done so far in your life?",
      tags: ["pride", "story"],
    },
    {
      id: "dw-4",
      type: "question",
      baseText: "What do you value most in a friendship?",
      tags: ["values", "relationships"],
    },
    {
      id: "dw-5",
      type: "question",
      baseText: "What is your most treasured memory?",
      tags: ["memory", "joy"],
    },
    {
      id: "dw-6",
      type: "question",
      baseText:
        "What's a memory you'd rather not have, but you keep anyway? You don't have to share it in detail — just name what it means to you.",
      tags: ["memory", "vulnerability"],
    },

    // -- Sub-chapter 2: What We've Built (Q19-24) --
    {
      id: "dw-7",
      type: "question",
      baseText:
        "If you knew that in one year you would die suddenly, would you change anything about the way you're living right now? What?",
      tags: ["mortality", "alignment"],
    },
    {
      id: "dw-8",
      type: "question",
      baseText:
        "What does friendship really mean to you? Not the textbook answer — yours.",
      tags: ["values", "relationships"],
    },
    {
      id: "dw-9",
      type: "question",
      baseText: "What roles do love and affection play in your life right now?",
      tags: ["love", "self"],
    },
    {
      id: "dw-10",
      type: "exchange",
      baseText:
        "Both write five things you genuinely admire about each other. Reveal at the same time.",
      revealMode: "simultaneous",
      tags: ["affirmation", "exchange"],
    },
    {
      id: "dw-11",
      type: "question",
      baseText:
        "How close and warm was your family growing up? Do you think your childhood was happier than most other people's?",
      tags: ["family", "origin"],
    },
    {
      id: "dw-12",
      type: "question",
      baseText: "How do you feel about your relationship with your mother?",
      tags: ["family", "vulnerability"],
    },

    // -- Sub-chapter 3: Imagined Lives (Q25-30) --
    {
      id: "dw-13",
      type: "exchange",
      baseText:
        "Both write three true \"we\" statements. (\"We are both...\", \"We both want...\", \"We both wish...\") Reveal together.",
      revealMode: "simultaneous",
      tags: ["us", "exchange"],
    },
    {
      id: "dw-14",
      type: "question",
      baseText:
        "Complete this sentence honestly: \"I wish I had someone with whom I could share ___\".",
      tags: ["longing", "vulnerability"],
    },
    {
      id: "dw-15",
      type: "question",
      baseText:
        "If we were going to become very close, what's the one thing it'd be most important for me to know about you?",
      tags: ["self", "vulnerability"],
    },
    {
      id: "dw-16",
      type: "exchange",
      baseText:
        "Both write what you genuinely like about the other person. Be very honest — say things you wouldn't say to someone you'd just met. Reveal together.",
      revealMode: "simultaneous",
      tags: ["affirmation", "exchange"],
    },
    {
      id: "dw-17",
      type: "question",
      baseText:
        "Share an embarrassing moment from your life. The kind you remember when you can't sleep.",
      tags: ["vulnerability", "story"],
    },
    {
      id: "dw-18",
      type: "question",
      baseText:
        "When did you last cry in front of another person? When did you last cry by yourself?",
      tags: ["vulnerability", "self"],
    },

    // -- Sub-chapter 4: The Hard Stuff (Q31-36) --
    {
      id: "dw-19",
      type: "question",
      baseText:
        "Tell me one thing you already like about me — the kind of thing that's too small to mention casually but matters anyway.",
      tags: ["affirmation", "specificity"],
    },
    {
      id: "dw-20",
      type: "question",
      baseText: "What, if anything, is too serious to be joked about?",
      tags: ["values", "boundaries"],
    },
    {
      id: "dw-21",
      type: "question",
      baseText:
        "If you were to die this evening with no chance to communicate with anyone, what would you most regret not having told someone? Why haven't you told them yet?",
      tags: ["mortality", "regret"],
    },
    {
      id: "dw-22",
      type: "question",
      baseText:
        "Your house, with everything you own, catches fire. After your loved ones and pets are safe, you have time to grab one last item. What would it be, and why?",
      tags: ["values", "story"],
    },
    {
      id: "dw-23",
      type: "question",
      baseText:
        "Of all the people in your family, whose death would you find most disturbing? Why?",
      tags: ["family", "mortality"],
    },
    {
      id: "dw-24",
      type: "question",
      baseText:
        "Share a personal problem you're sitting with right now. Not for solutions — just so it's said out loud, and so I can reflect back what I think you're feeling.",
      tags: ["vulnerability", "presence"],
    },
  ],
});

// Helpers
export function getChapterById(id) {
  return ADVENTURE_CHAPTERS.find((c) => c.id === id) || null;
}

// TODO (Day 13+): multi-chapter navigation. Today getCurrentChapter() always
// returns Chapter 1. When Chapter 1 is completed, the Adventures completion
// screen needs a "Walk Chapter 2 →" CTA that advances activeChapterIndex
// (managed in Hub state). Until that ships, Chapter 2 content is in the repo
// but not yet reachable from the UI. Use a dev panel button to jump in for testing.
export function getCurrentChapter() {
  return ADVENTURE_CHAPTERS[0];
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
      // challenge confirmation is a boolean "we did it"
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
