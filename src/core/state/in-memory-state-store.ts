import type { SceneStateStore } from "../../shared/contracts/services";
import {
  hasSceneStateChanges,
  type OutfitState,
  type OutfitStateDiff,
  type SceneState,
  type SceneStateDiff,
} from "../../shared/models/scene-state";

function applyOutfitDiff(current: OutfitState, diff?: OutfitStateDiff): OutfitState {
  if (!diff) {
    return current;
  }

  return {
    top: diff.top !== undefined ? diff.top : current.top,
    bottom: diff.bottom !== undefined ? diff.bottom : current.bottom,
    bra: diff.bra !== undefined ? diff.bra : current.bra,
    panties: diff.panties !== undefined ? diff.panties : current.panties,
    legwear: diff.legwear !== undefined ? diff.legwear : current.legwear,
    accessory: diff.accessory !== undefined ? diff.accessory : current.accessory,
  };
}

function createUpdatedState(
  current: SceneState,
  diff: SceneStateDiff,
  metadata: {
    sourceMessageId: string;
    confidence: number;
  },
): SceneState {
  return {
    location: diff.location !== undefined ? diff.location : current.location,
    emotion: diff.emotion !== undefined ? diff.emotion : current.emotion,
    pose: diff.pose !== undefined ? diff.pose : current.pose,
    outfit: applyOutfitDiff(current.outfit, diff.outfit),
    metadata: {
      last_updated_at: new Date().toISOString(),
      source_message_id: metadata.sourceMessageId,
      confidence:
        diff.confidence !== undefined ? diff.confidence : metadata.confidence,
    },
  };
}

export class InMemorySceneStateStore implements SceneStateStore {
  private readonly states = new Map<string, SceneState>();

  ensureState(chatId: string, factory: () => SceneState): SceneState {
    const existingState = this.states.get(chatId);
    if (existingState) {
      return existingState;
    }

    const initialState = factory();
    this.states.set(chatId, initialState);
    return initialState;
  }

  getState(chatId: string): SceneState | null {
    return this.states.get(chatId) ?? null;
  }

  applyDiff(
    chatId: string,
    diff: SceneStateDiff,
    metadata: {
      sourceMessageId: string;
      confidence: number;
    },
  ): SceneState | null {
    const currentState = this.states.get(chatId);
    if (!currentState) {
      return null;
    }

    if (!hasSceneStateChanges(diff)) {
      return currentState;
    }

    const nextState = createUpdatedState(currentState, diff, metadata);
    this.states.set(chatId, nextState);
    return nextState;
  }
}
