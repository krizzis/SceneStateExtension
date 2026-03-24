import type { PromptBuilder } from "../../shared/contracts/services";
import type {
  PromptBuildResult,
  SceneState,
} from "../../shared/models/scene-state";

function normalizeValueToTags(value: string): ReadonlyArray<string> {
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase().replace(/\s+/g, "_"))
    .filter(Boolean);
}

function dedupePreservingOrder(values: ReadonlyArray<string>): ReadonlyArray<string> {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }

    seen.add(value);
    deduped.push(value);
  }

  return deduped;
}

export class DanbooruPromptBuilder implements PromptBuilder {
  build(state: SceneState): PromptBuildResult {
    const orderedValues = [
      state.location,
      state.emotion,
      state.pose,
      state.outfit.top,
      state.outfit.bottom,
      state.outfit.bra,
      state.outfit.panties,
      state.outfit.legwear,
      state.outfit.accessory,
    ].filter((value): value is string => Boolean(value));

    const tags = dedupePreservingOrder(
      orderedValues.flatMap((value) => normalizeValueToTags(value)),
    );

    return {
      tags,
      prompt: tags.join(", "),
    };
  }
}
