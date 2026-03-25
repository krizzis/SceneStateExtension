function readStringCandidate(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readObjectCandidate(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readArrayCandidate(value: unknown): ReadonlyArray<unknown> {
  return Array.isArray(value) ? value : [];
}

export function getChatMessages(context: unknown): ReadonlyArray<unknown> {
  const contextObject = readObjectCandidate(context);
  return readArrayCandidate(contextObject.chat);
}

export function getActiveChatId(context: unknown): string | null {
  const contextObject = readObjectCandidate(context);
  const candidates = [
    contextObject.chatId,
    contextObject.chat_id,
    contextObject.chatFile,
    contextObject.chat_file,
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
  const characters = readArrayCandidate(contextObject.characters);
  const firstCharacter = readObjectCandidate(characters[0]);

  return (
    readStringCandidate(characterObject.scenario) ||
    readStringCandidate(firstCharacter.scenario) ||
    readStringCandidate(characterDataObject.scenario) ||
    readStringCandidate(contextObject.scenario)
  );
}

export function getCharacterDescriptionText(context: unknown): string {
  const contextObject = readObjectCandidate(context);
  const characterObject = readObjectCandidate(contextObject.character);
  const characterDataObject = readObjectCandidate(contextObject.characterData);
  const characters = readArrayCandidate(contextObject.characters);
  const firstCharacter = readObjectCandidate(characters[0]);

  return (
    readStringCandidate(characterObject.description) ||
    readStringCandidate(firstCharacter.description) ||
    readStringCandidate(characterDataObject.description) ||
    readStringCandidate(contextObject.description)
  );
}

function getLatestMessageFromContext(context: unknown): unknown {
  const chat = getChatMessages(context);

  return chat.length > 0 ? chat[chat.length - 1] : null;
}

function getMessageByIndex(context: unknown, index: number): unknown {
  const chat = getChatMessages(context);

  if (index < 0 || index >= chat.length) {
    return null;
  }

  return chat[index] ?? null;
}

function getNumericMessageIndex(payloadObject: Record<string, unknown>): number | null {
  const candidates = [
    payloadObject.message_id,
    payloadObject.messageId,
    payloadObject.id,
    payloadObject.index,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isInteger(candidate) && candidate >= 0) {
      return candidate;
    }
  }

  return null;
}

export function getLatestMessageFromPayload(
  payload: unknown,
  context: unknown,
): unknown {
  if (typeof payload === "number" && Number.isInteger(payload) && payload >= 0) {
    return getMessageByIndex(context, payload) ?? getLatestMessageFromContext(context);
  }

  if (payload && typeof payload === "object") {
    const payloadObject = payload as Record<string, unknown>;
    const numericIndex = getNumericMessageIndex(payloadObject);

    if (numericIndex !== null) {
      const indexedMessage = getMessageByIndex(context, numericIndex);
      if (indexedMessage) {
        return indexedMessage;
      }
    }

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
  const role = readStringCandidate(messageObject.role).toLowerCase();
  const isUser = messageObject.is_user === true || role === "user";
  const isSystem = messageObject.is_system === true || role === "system";

  if (isSystem || isUser) {
    return false;
  }

  return true;
}

export function getMessageSourceId(message: unknown, fallbackIndex?: number): string {
  if (!message || typeof message !== "object") {
    return fallbackIndex !== undefined ? String(fallbackIndex) : "unknown";
  }

  const messageObject = message as Record<string, unknown>;
  const candidates = [
    messageObject.message_id,
    messageObject.messageId,
    messageObject.id,
    messageObject.index,
    messageObject.send_date,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }

    if (typeof candidate === "number") {
      return String(candidate);
    }
  }

  return fallbackIndex !== undefined ? String(fallbackIndex) : "unknown";
}

export function getMessageDebugSignature(message: unknown): string {
  if (!message || typeof message !== "object") {
    return "message:unknown";
  }

  const messageObject = message as Record<string, unknown>;
  const parts = [
    getMessageSourceId(message),
    readStringCandidate(messageObject.name),
    readStringCandidate(messageObject.mes),
  ];

  return parts.join("|");
}