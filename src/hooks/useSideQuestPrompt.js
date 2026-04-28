import { useMemo } from "react";

// Side Quest trigger hook (placeholder for Day 5).
// Day 9 wires the mood-triggered CTA properly. For now, the hook just returns
// the trigger state based on partner mood so other components can preview the
// behavior.
//
// A Side Quest is offered when the partner's mood is in the "off" set:
// sad, angry, anxious, moody, low. The point is to surface a structured
// repair conversation when something feels off, without forcing it.

const TRIGGER_MOODS = new Set(["sad", "angry", "anxious", "moody", "low"]);

// Pure decision function — extracted so it's directly testable without React.
export function evaluateSideQuestTrigger(roomData, playerId) {
  if (!roomData) return { shouldShow: false };

  const isP1 = playerId === roomData.player1?.id;
  const partner = isP1 ? roomData.player2 : roomData.player1;
  const partnerName = partner?.name || roomData.partnerName || "your partner";
  const partnerMoodId = partner?.id ? roomData[`mood_${partner.id}`] : null;

  if (!partnerMoodId) return { shouldShow: false };
  if (!TRIGGER_MOODS.has(partnerMoodId)) return { shouldShow: false };

  return {
    shouldShow: true,
    partnerName,
    partnerMoodId,
  };
}

export default function useSideQuestPrompt(roomData, playerId) {
  return useMemo(() => evaluateSideQuestTrigger(roomData, playerId), [roomData, playerId]);
}
