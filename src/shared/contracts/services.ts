import type { AnalysisMode } from "../models/settings";
import type {
  PromptBuildResult,
  SceneState,
  SceneStateDiff,
} from "../models/scene-state";

export interface InitialStateInput {
  chatId: string;
  scenarioText: string;
  characterDescriptionText: string;
}

export interface InitialStateFactory {
  createInitialState(input: InitialStateInput): SceneState;
}

export interface SceneStateStore {
  ensureState(chatId: string, factory: () => SceneState): SceneState;
  getState(chatId: string): SceneState | null;
  applyDiff(
    chatId: string,
    diff: SceneStateDiff,
    metadata: {
      sourceMessageId: string;
      confidence: number;
    },
  ): SceneState | null;
}

export interface AnalysisMessage {
  sourceId: string;
  role: "user" | "character";
  text: string;
  name: string | null;
  rawIndex: number;
}

export interface AnalysisTurn {
  userMessage: AnalysisMessage | null;
  characterMessage: AnalysisMessage;
}

export interface ContextCollector {
  collect(
    messages: ReadonlyArray<AnalysisMessage>,
    triggerRawIndex: number,
    analysisMode: AnalysisMode,
    windowSize: number,
  ): ReadonlyArray<AnalysisTurn>;
}

export interface AnalysisRequest {
  chatId: string;
  turns: ReadonlyArray<AnalysisTurn>;
  analysisMode: AnalysisMode;
  windowSize: number;
}

export interface AnalysisResult {
  diff: SceneStateDiff;
}

export interface Analyzer {
  analyze(request: AnalysisRequest): Promise<AnalysisResult>;
}

export interface PromptBuilder {
  build(state: SceneState): PromptBuildResult;
}
