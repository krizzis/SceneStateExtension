import type {
  InitialStateFactory,
  InitialStateInput,
} from "../../shared/contracts/services";
import {
  EMPTY_OUTFIT_STATE,
  type SceneState,
} from "../../shared/models/scene-state";
import { parseLocationFromScenario } from "./parse-location";
import { parseOutfitFromCharacterDescription } from "./parse-outfit";

export class DefaultInitialStateFactory implements InitialStateFactory {
  createInitialState(input: InitialStateInput): SceneState {
    return {
      location: parseLocationFromScenario(input.scenarioText),
      emotion: null,
      pose: null,
      outfit: input.characterDescriptionText
        ? parseOutfitFromCharacterDescription(input.characterDescriptionText)
        : { ...EMPTY_OUTFIT_STATE },
      metadata: {
        last_updated_at: new Date().toISOString(),
        source_message_id: "initialization",
        confidence: 1,
      },
    };
  }
}
