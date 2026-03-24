function readStringCandidate(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readObjectCandidate(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function getActiveChatId(context: unknown): string | null {
  const contextObject = readObjectCandidate(context);
  const candidates = [
    contextObject.chatId,
    contextObject.chat_id,
    contextObject.groupId,
    contextObject.group_id,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }

    if (typeof candidate === "number") {
      return String(candidate);
    }
  }

  return null;
}

export function getScenarioText(context: unknown): string {
  const contextObject = readObjectCandidate(context);
  const characterObject = readObjectCandidate(contextObject.character);
  const characterDataObject = readObjectCandidate(contextObject.characterData);

  return (
    readStringCandidate(characterObject.scenario) ||
    readStringCandidate(characterDataObject.scenario) ||
    readStringCandidate(contextObject.scenario)
  );
}

export function getCharacterDescriptionText(context: unknown): string {
  const contextObject = readObjectCandidate(context);
  const characterObject = readObjectCandidate(contextObject.character);
  const characterDataObject = readObjectCandidate(contextObject.characterData);

  return (
    readStringCandidate(characterObject.description) ||
    readStringCandidate(characterDataObject.description) ||
    readStringCandidate(contextObject.description)
  );
}

function getLatestMessageFromContext(context: unknown): unknown {
  const contextObject = readObjectCandidate(context);
  const chat = Array.isArray(contextObject.chat) ? contextObject.chat : [];

  return chat.length > 0 ? chat[chat.length - 1] : null;
}

export function getLatestMessageFromPayload(
  payload: unknown,
  context: unknown,
): unknown {
  if (payload && typeof payload === "object") {
    const payloadObject = payload as Record<string, unknown>;

    if (payloadObject.message && typeof payloadObject.message === "object") {
      return payloadObject.message;
    }

    if (payloadObject.mes && typeof payloadObject.mes === "object") {
      return payloadObject.mes;
    }

    if ("is_user" in payloadObject || "mes" in payloadObject || "name" in payloadObject) {
      return payloadObject;
    }
  }

  return getLatestMessageFromContext(context);
}

export function isCharacterMessage(message: unknown): boolean {
  if (!message || typeof message !== "object") {
    return false;
  }

  const messageObject = message as Record<string, unknown>;

  if (messageObject.is_system === true) {
    return false;
  }

  if (messageObject.is_user === true) {
    return false;
  }

  return true;
}
