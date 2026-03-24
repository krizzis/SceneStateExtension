import type {
  PromptBuildResult,
  SceneState,
  SceneStateDiff,
} from "../models/scene-state";
import type { AnalysisMode } from "../models/settings";

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

export interface AnalysisRequest {
  chatId: string;
  message: unknown;
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
