// index.ts
import {
  extension_settings,
  getContext,
  renderExtensionTemplateAsync
} from "../../../extensions.js";
import {
  eventSource,
  event_types,
  saveSettingsDebounced
} from "../../../../script.js";

// src/core/analyzer/stub-analyzer.ts
var StubAnalyzer = class {
  async analyze(_request) {
    return {
      diff: {}
    };
  }
};

// src/shared/models/scene-state.ts
var EMPTY_OUTFIT_STATE = {
  top: null,
  bottom: null,
  bra: null,
  panties: null,
  legwear: null,
  accessory: null
};
function hasSceneStateChanges(diff) {
  return Boolean(
    diff.location !== void 0 || diff.emotion !== void 0 || diff.pose !== void 0 || diff.confidence !== void 0 || diff.outfit && Object.values(diff.outfit).some((value) => value !== void 0)
  );
}

// src/core/initialization/parse-location.ts
function parseLocationFromScenario(scenarioText) {
  const locationMatch = scenarioText.match(/^\[Location\]:\s*(.+)$/im);
  if (!locationMatch) {
    return null;
  }
  const value = locationMatch[1]?.trim();
  return value ? value : null;
}

// src/core/initialization/parse-outfit.ts
var SUPPORTED_OUTFIT_KEYS = [
  "top",
  "bottom",
  "bra",
  "panties",
  "legwear",
  "accessory"
];
function isSupportedOutfitKey(value) {
  return SUPPORTED_OUTFIT_KEYS.includes(value);
}
function normalizeOutfitValue(value) {
  const normalized = value.split(",").map((item) => item.trim()).filter(Boolean).join(", ");
  return normalized.length > 0 ? normalized : null;
}
function parseOutfitFromCharacterDescription(characterDescriptionText) {
  const result = { ...EMPTY_OUTFIT_STATE };
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

// src/core/initialization/create-initial-state.ts
var DefaultInitialStateFactory = class {
  createInitialState(input) {
    return {
      location: parseLocationFromScenario(input.scenarioText),
      emotion: null,
      pose: null,
      outfit: input.characterDescriptionText ? parseOutfitFromCharacterDescription(input.characterDescriptionText) : { ...EMPTY_OUTFIT_STATE },
      metadata: {
        last_updated_at: (/* @__PURE__ */ new Date()).toISOString(),
        source_message_id: "initialization",
        confidence: 1
      }
    };
  }
};

// src/core/prompt/prompt-builder.ts
function normalizeValueToTags(value) {
  return value.split(",").map((item) => item.trim().toLowerCase().replace(/\s+/g, "_")).filter(Boolean);
}
function dedupePreservingOrder(values) {
  const seen = /* @__PURE__ */ new Set();
  const deduped = [];
  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    deduped.push(value);
  }
  return deduped;
}
var DanbooruPromptBuilder = class {
  build(state) {
    const orderedValues = [
      state.location,
      state.emotion,
      state.pose,
      state.outfit.top,
      state.outfit.bottom,
      state.outfit.bra,
      state.outfit.panties,
      state.outfit.legwear,
      state.outfit.accessory
    ].filter((value) => Boolean(value));
    const tags = dedupePreservingOrder(
      orderedValues.flatMap((value) => normalizeValueToTags(value))
    );
    return {
      tags,
      prompt: tags.join(", ")
    };
  }
};

// src/core/state/in-memory-state-store.ts
function applyOutfitDiff(current, diff) {
  if (!diff) {
    return current;
  }
  return {
    top: diff.top !== void 0 ? diff.top : current.top,
    bottom: diff.bottom !== void 0 ? diff.bottom : current.bottom,
    bra: diff.bra !== void 0 ? diff.bra : current.bra,
    panties: diff.panties !== void 0 ? diff.panties : current.panties,
    legwear: diff.legwear !== void 0 ? diff.legwear : current.legwear,
    accessory: diff.accessory !== void 0 ? diff.accessory : current.accessory
  };
}
function createUpdatedState(current, diff, metadata) {
  return {
    location: diff.location !== void 0 ? diff.location : current.location,
    emotion: diff.emotion !== void 0 ? diff.emotion : current.emotion,
    pose: diff.pose !== void 0 ? diff.pose : current.pose,
    outfit: applyOutfitDiff(current.outfit, diff.outfit),
    metadata: {
      last_updated_at: (/* @__PURE__ */ new Date()).toISOString(),
      source_message_id: metadata.sourceMessageId,
      confidence: diff.confidence !== void 0 ? diff.confidence : metadata.confidence
    }
  };
}
var InMemorySceneStateStore = class {
  constructor() {
    this.states = /* @__PURE__ */ new Map();
  }
  ensureState(chatId, factory) {
    const existingState = this.states.get(chatId);
    if (existingState) {
      return existingState;
    }
    const initialState = factory();
    this.states.set(chatId, initialState);
    return initialState;
  }
  getState(chatId) {
    return this.states.get(chatId) ?? null;
  }
  applyDiff(chatId, diff, metadata) {
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
};

// src/bootstrap/create-services.ts
function createServices() {
  return {
    analyzer: new StubAnalyzer(),
    initialStateFactory: new DefaultInitialStateFactory(),
    promptBuilder: new DanbooruPromptBuilder(),
    stateStore: new InMemorySceneStateStore()
  };
}

// src/integration/context/st-runtime-context.ts
function readStringCandidate(value) {
  return typeof value === "string" ? value : "";
}
function readObjectCandidate(value) {
  return value && typeof value === "object" ? value : {};
}
function readArrayCandidate(value) {
  return Array.isArray(value) ? value : [];
}
function getChatMessages(context) {
  const contextObject = readObjectCandidate(context);
  return readArrayCandidate(contextObject.chat);
}
function getActiveChatId(context) {
  const contextObject = readObjectCandidate(context);
  const candidates = [
    contextObject.chatId,
    contextObject.chat_id,
    contextObject.chatFile,
    contextObject.chat_file,
    contextObject.groupId,
    contextObject.group_id
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
function getScenarioText(context) {
  const contextObject = readObjectCandidate(context);
  const characterObject = readObjectCandidate(contextObject.character);
  const characterDataObject = readObjectCandidate(contextObject.characterData);
  const characters = readArrayCandidate(contextObject.characters);
  const firstCharacter = readObjectCandidate(characters[0]);
  return readStringCandidate(characterObject.scenario) || readStringCandidate(firstCharacter.scenario) || readStringCandidate(characterDataObject.scenario) || readStringCandidate(contextObject.scenario);
}
function getCharacterDescriptionText(context) {
  const contextObject = readObjectCandidate(context);
  const characterObject = readObjectCandidate(contextObject.character);
  const characterDataObject = readObjectCandidate(contextObject.characterData);
  const characters = readArrayCandidate(contextObject.characters);
  const firstCharacter = readObjectCandidate(characters[0]);
  return readStringCandidate(characterObject.description) || readStringCandidate(firstCharacter.description) || readStringCandidate(characterDataObject.description) || readStringCandidate(contextObject.description);
}
function getLatestMessageFromContext(context) {
  const chat = getChatMessages(context);
  return chat.length > 0 ? chat[chat.length - 1] : null;
}
function getMessageByIndex(context, index) {
  const chat = getChatMessages(context);
  if (index < 0 || index >= chat.length) {
    return null;
  }
  return chat[index] ?? null;
}
function getNumericMessageIndex(payloadObject) {
  const candidates = [
    payloadObject.message_id,
    payloadObject.messageId,
    payloadObject.id,
    payloadObject.index
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isInteger(candidate) && candidate >= 0) {
      return candidate;
    }
  }
  return null;
}
function getLatestMessageFromPayload(payload, context) {
  if (typeof payload === "number" && Number.isInteger(payload) && payload >= 0) {
    return getMessageByIndex(context, payload) ?? getLatestMessageFromContext(context);
  }
  if (payload && typeof payload === "object") {
    const payloadObject = payload;
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
function isCharacterMessage(message) {
  if (!message || typeof message !== "object") {
    return false;
  }
  const messageObject = message;
  const role = readStringCandidate(messageObject.role).toLowerCase();
  const isUser = messageObject.is_user === true || role === "user";
  const isSystem = messageObject.is_system === true || role === "system";
  if (isSystem || isUser) {
    return false;
  }
  return true;
}
function getMessageSourceId(message, fallbackIndex) {
  if (!message || typeof message !== "object") {
    return fallbackIndex !== void 0 ? String(fallbackIndex) : "unknown";
  }
  const messageObject = message;
  const candidates = [
    messageObject.message_id,
    messageObject.messageId,
    messageObject.id,
    messageObject.index,
    messageObject.send_date
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
    if (typeof candidate === "number") {
      return String(candidate);
    }
  }
  return fallbackIndex !== void 0 ? String(fallbackIndex) : "unknown";
}
function getMessageDebugSignature(message) {
  if (!message || typeof message !== "object") {
    return "message:unknown";
  }
  const messageObject = message;
  const parts = [
    getMessageSourceId(message),
    readStringCandidate(messageObject.name),
    readStringCandidate(messageObject.mes)
  ];
  return parts.join("|");
}

// src/integration/logging/logger.ts
function createLogger(scope, isDebugEnabled) {
  return {
    debug(message, payload) {
      if (!isDebugEnabled()) {
        return;
      }
      if (payload === void 0) {
        console.log(`[${scope}] ${message}`);
        return;
      }
      console.log(`[${scope}] ${message}`, payload);
    }
  };
}

// src/shared/models/settings.ts
var DEFAULT_EXTENSION_SETTINGS = {
  enabled: true,
  analysis_mode: "last_message",
  window_size: 5,
  debug_mode: false
};

// index.ts
var EXTENSION_NAME = "scene-state-extension";
var SETTINGS_ROOT_SELECTOR = "#extensions_settings2";
var MESSAGE_EVENT_CANDIDATES = [
  "CHARACTER_MESSAGE_RENDERED",
  "MESSAGE_RECEIVED",
  "MESSAGE_UPDATED"
];
var CHAT_EVENT_CANDIDATES = ["CHAT_CHANGED", "CHAT_LOADED"];
var settings = { ...DEFAULT_EXTENSION_SETTINGS };
var logger = createLogger(EXTENSION_NAME, () => settings.debug_mode);
var services = createServices();
var subscribedRuntimeEvents = /* @__PURE__ */ new Set();
var lastProcessedMessageByChat = /* @__PURE__ */ new Map();
function getExtensionRuntimePath() {
  const currentScriptUrl = new URL(import.meta.url);
  const match = currentScriptUrl.pathname.match(/\/scripts\/extensions\/(.+)\/index\.js$/);
  if (!match?.[1]) {
    return "third-party/scene-state-extension";
  }
  return decodeURIComponent(match[1]);
}
var EXTENSION_PATH = getExtensionRuntimePath();
function readBooleanSetting(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}
function readAnalysisModeSetting(value) {
  return value === "recent_window" ? "recent_window" : "last_message";
}
function readWindowSizeSetting(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? Math.floor(numericValue) : fallback;
}
function readStoredSettings() {
  const storedSettings = extension_settings[EXTENSION_NAME] ?? {};
  return {
    enabled: readBooleanSetting(
      storedSettings.enabled,
      DEFAULT_EXTENSION_SETTINGS.enabled
    ),
    analysis_mode: readAnalysisModeSetting(storedSettings.analysis_mode),
    window_size: readWindowSizeSetting(
      storedSettings.window_size,
      DEFAULT_EXTENSION_SETTINGS.window_size
    ),
    debug_mode: readBooleanSetting(
      storedSettings.debug_mode,
      DEFAULT_EXTENSION_SETTINGS.debug_mode
    )
  };
}
function persistSettings(nextSettings) {
  extension_settings[EXTENSION_NAME] = { ...nextSettings };
  saveSettingsDebounced();
}
function updateSettings(patch) {
  settings = { ...settings, ...patch };
  persistSettings(settings);
}
function bindSettingsUi() {
  const enabledInput = $("#scene-state-extension_enabled");
  const analysisModeSelect = $("#scene-state-extension_analysis_mode");
  const windowSizeInput = $("#scene-state-extension_window_size");
  const debugModeInput = $("#scene-state-extension_debug_mode");
  enabledInput.prop("checked", settings.enabled);
  analysisModeSelect.val(settings.analysis_mode);
  windowSizeInput.val(String(settings.window_size));
  debugModeInput.prop("checked", settings.debug_mode);
  enabledInput.on("change", () => {
    updateSettings({
      enabled: Boolean(enabledInput.prop("checked"))
    });
  });
  analysisModeSelect.on("change", () => {
    updateSettings({
      analysis_mode: String(analysisModeSelect.val())
    });
  });
  windowSizeInput.on("change", () => {
    const nextValue = Number(windowSizeInput.val());
    updateSettings({
      window_size: Number.isFinite(nextValue) && nextValue > 0 ? Math.floor(nextValue) : DEFAULT_EXTENSION_SETTINGS.window_size
    });
  });
  debugModeInput.on("change", () => {
    updateSettings({
      debug_mode: Boolean(debugModeInput.prop("checked"))
    });
  });
}
async function renderSettings() {
  if ($("#scene-state-extension_settings").length > 0) {
    bindSettingsUi();
    return;
  }
  let html = "";
  try {
    html = await renderExtensionTemplateAsync(EXTENSION_PATH, "settings");
  } catch (error) {
    console.error(`[${EXTENSION_NAME}] Failed to render settings template.`, error);
    return;
  }
  const settingsRoot = $(SETTINGS_ROOT_SELECTOR).length > 0 ? $(SETTINGS_ROOT_SELECTOR) : $("#extensions_settings");
  if (settingsRoot.length === 0) {
    console.error(`[${EXTENSION_NAME}] Settings root container was not found.`, {
      primarySelector: SETTINGS_ROOT_SELECTOR,
      fallbackSelector: "#extensions_settings"
    });
    return;
  }
  settingsRoot.append(html);
  console.log(`[${EXTENSION_NAME}] Settings template mounted.`, {
    rootId: settingsRoot.attr("id")
  });
  bindSettingsUi();
}
function initializeChatStateFromContext(context) {
  const chatId = getActiveChatId(context);
  if (!chatId) {
    logger.debug("Skipped state initialization because no active chat id was found.");
    return;
  }
  const state = services.stateStore.ensureState(
    chatId,
    () => services.initialStateFactory.createInitialState({
      chatId,
      scenarioText: getScenarioText(context),
      characterDescriptionText: getCharacterDescriptionText(context)
    })
  );
  logger.debug("Chat state is ready.", { chatId, state });
}
async function handleMessageEvent(payload) {
  if (!settings.enabled) {
    return;
  }
  const context = getContext();
  const chatId = getActiveChatId(context);
  if (!chatId) {
    logger.debug("Skipped message event because no active chat id was found.");
    return;
  }
  const message = getLatestMessageFromPayload(payload, context);
  if (!isCharacterMessage(message)) {
    logger.debug("Skipped non-character message.", { chatId, payload });
    return;
  }
  const messageSignature = getMessageDebugSignature(message);
  if (lastProcessedMessageByChat.get(chatId) === messageSignature) {
    logger.debug("Skipped duplicate character message event.", {
      chatId,
      messageSignature
    });
    return;
  }
  lastProcessedMessageByChat.set(chatId, messageSignature);
  initializeChatStateFromContext(context);
  const analysisResult = await services.analyzer.analyze({
    chatId,
    message,
    analysisMode: settings.analysis_mode,
    windowSize: settings.window_size
  });
  logger.debug("Analyzer result received.", { chatId, analysisResult });
  services.stateStore.applyDiff(chatId, analysisResult.diff, {
    sourceMessageId: getMessageSourceId(message),
    confidence: 0
  });
  const currentState = services.stateStore.getState(chatId);
  if (!currentState) {
    logger.debug("Prompt build skipped because current state is unavailable.", {
      chatId
    });
    return;
  }
  const promptResult = services.promptBuilder.build(currentState);
  logger.debug("Prompt build completed.", {
    chatId,
    state: currentState,
    tags: promptResult.tags,
    prompt: promptResult.prompt
  });
}
function subscribeIfAvailable(eventName, handler) {
  const runtimeEvent = event_types?.[eventName];
  if (!runtimeEvent) {
    logger.debug("Runtime event is not available in this SillyTavern version.", {
      eventName
    });
    return;
  }
  if (subscribedRuntimeEvents.has(runtimeEvent)) {
    logger.debug("Skipped duplicate runtime event subscription.", {
      eventName,
      runtimeEvent
    });
    return;
  }
  eventSource.on(runtimeEvent, handler);
  subscribedRuntimeEvents.add(runtimeEvent);
  logger.debug("Subscribed to runtime event.", { eventName });
}
function registerEventHandlers() {
  subscribeIfAvailable("APP_READY", () => {
    logger.debug("Application ready.");
    initializeChatStateFromContext(getContext());
  });
  for (const eventName of MESSAGE_EVENT_CANDIDATES) {
    subscribeIfAvailable(eventName, (payload) => {
      void handleMessageEvent(payload);
    });
  }
  for (const eventName of CHAT_EVENT_CANDIDATES) {
    subscribeIfAvailable(eventName, () => {
      logger.debug("Chat lifecycle event received.");
      initializeChatStateFromContext(getContext());
    });
  }
}
jQuery(async () => {
  extension_settings[EXTENSION_NAME] = extension_settings[EXTENSION_NAME] ?? {};
  settings = readStoredSettings();
  persistSettings(settings);
  await renderSettings();
  registerEventHandlers();
  logger.debug("Extension initialized.", { settings });
});
//# sourceMappingURL=index.js.map