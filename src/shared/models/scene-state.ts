export interface OutfitState {
  top: string | null;
  bottom: string | null;
  bra: string | null;
  panties: string | null;
  legwear: string | null;
  accessory: string | null;
}

export interface StateMetadata {
  last_updated_at: string;
  source_message_id: string;
  confidence: number;
}

export interface SceneState {
  location: string | null;
  emotion: string | null;
  pose: string | null;
  outfit: OutfitState;
  metadata: StateMetadata;
}

export interface OutfitStateDiff {
  top?: string | null;
  bottom?: string | null;
  bra?: string | null;
  panties?: string | null;
  legwear?: string | null;
  accessory?: string | null;
}

export interface SceneStateDiff {
  location?: string | null;
  emotion?: string | null;
  pose?: string | null;
  outfit?: OutfitStateDiff;
  confidence?: number;
}

export interface PromptBuildResult {
  tags: ReadonlyArray<string>;
  prompt: string;
}

export const EMPTY_OUTFIT_STATE: OutfitState = {
  top: null,
  bottom: null,
  bra: null,
  panties: null,
  legwear: null,
  accessory: null,
};

export function hasSceneStateChanges(diff: SceneStateDiff): boolean {
  return Boolean(
    diff.location !== undefined ||
      diff.emotion !== undefined ||
      diff.pose !== undefined ||
      diff.confidence !== undefined ||
      (diff.outfit &&
        Object.values(diff.outfit).some((value) => value !== undefined)),
  );
}
