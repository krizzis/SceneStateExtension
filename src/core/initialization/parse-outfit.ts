import {
  EMPTY_OUTFIT_STATE,
  type OutfitState,
} from "../../shared/models/scene-state";

const SUPPORTED_OUTFIT_KEYS = [
  "top",
  "bottom",
  "bra",
  "panties",
  "legwear",
  "accessory",
] as const;

type SupportedOutfitKey = (typeof SUPPORTED_OUTFIT_KEYS)[number];

function isSupportedOutfitKey(value: string): value is SupportedOutfitKey {
  return SUPPORTED_OUTFIT_KEYS.includes(value as SupportedOutfitKey);
}

function normalizeOutfitValue(value: string): string | null {
  const normalized = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");

  return normalized.length > 0 ? normalized : null;
}

export function parseOutfitFromCharacterDescription(
  characterDescriptionText: string,
): OutfitState {
  const result: OutfitState = { ...EMPTY_OUTFIT_STATE };
  const lines = characterDescriptionText.split(/\r?\n/);

  let inOutfitSection = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (/^\[Outfit\]$/i.test(line)) {
      inOutfitSection = true;
      continue;
    }

    if (inOutfitSection && /^\[[^\]]+\]$/.test(line)) {
      break;
    }

    if (!inOutfitSection) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const rawKey = line.slice(0, separatorIndex).trim().toLowerCase();
    const rawValue = line.slice(separatorIndex + 1).trim();

    if (!isSupportedOutfitKey(rawKey)) {
      continue;
    }

    result[rawKey] = normalizeOutfitValue(rawValue);
  }

  return result;
}
