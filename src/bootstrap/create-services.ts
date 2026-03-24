import { StubAnalyzer } from "../core/analyzer/stub-analyzer";
import { DefaultInitialStateFactory } from "../core/initialization/create-initial-state";
import { DanbooruPromptBuilder } from "../core/prompt/prompt-builder";
import { InMemorySceneStateStore } from "../core/state/in-memory-state-store";

export function createServices() {
  return {
    analyzer: new StubAnalyzer(),
    initialStateFactory: new DefaultInitialStateFactory(),
    promptBuilder: new DanbooruPromptBuilder(),
    stateStore: new InMemorySceneStateStore(),
  };
}
