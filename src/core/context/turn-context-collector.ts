import type { AnalysisMode } from "../../shared/models/settings";
import type {
  AnalysisMessage,
  AnalysisTurn,
  ContextCollector,
} from "../../shared/contracts/services";

function clampWindowSize(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
}

export class TurnContextCollector implements ContextCollector {
  collect(
    messages: ReadonlyArray<AnalysisMessage>,
    triggerRawIndex: number,
    analysisMode: AnalysisMode,
    windowSize: number,
  ): ReadonlyArray<AnalysisTurn> {
    const turns: AnalysisTurn[] = [];
    let pendingUserMessage: AnalysisMessage | null = null;

    for (const message of messages) {
      if (message.rawIndex > triggerRawIndex) {
        break;
      }

      if (message.role === "user") {
        pendingUserMessage = message;
        continue;
      }

      turns.push({
        userMessage: pendingUserMessage,
        characterMessage: message,
      });
      pendingUserMessage = null;
    }

    let triggerTurnIndex = -1;
    for (let index = turns.length - 1; index >= 0; index -= 1) {
      if (turns[index]?.characterMessage.rawIndex === triggerRawIndex) {
        triggerTurnIndex = index;
        break;
      }
    }

    if (triggerTurnIndex === -1) {
      return [];
    }

    if (analysisMode !== "recent_turns") {
      return [turns[triggerTurnIndex]];
    }

    const safeWindowSize = clampWindowSize(windowSize);
    const startIndex = Math.max(0, triggerTurnIndex - safeWindowSize + 1);
    return turns.slice(startIndex, triggerTurnIndex + 1);
  }
}
