import QuestionPrompt from "./QuestionPrompt";
import ChallengePrompt from "./ChallengePrompt";
import ExchangePrompt from "./ExchangePrompt";
import VibeCheckPrompt from "./VibeCheckPrompt";

// Single source of truth for the type → component mapping (eng review 2B).
// Every consumer renders a prompt by passing it through this wrapper.

const REGISTRY = {
  question: QuestionPrompt,
  challenge: ChallengePrompt,
  exchange: ExchangePrompt,
  "vibe-check": VibeCheckPrompt,
};

export default function PromptRenderer({ prompt, ...rest }) {
  if (!prompt) return null;
  const Component = REGISTRY[prompt.type];
  if (!Component) {
    return (
      <div style={{ padding: "1rem", color: "rgba(255,150,150,0.85)" }}>
        Unknown prompt type: {prompt.type}
      </div>
    );
  }
  return <Component prompt={prompt} {...rest} />;
}
