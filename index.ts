// @ts-ignore Runtime-provided SillyTavern module.
import {
  extension_settings,
  getContext,
  loadExtensionSettings,
  renderExtensionTemplateAsync,
} from "../../../extensions.js";
// @ts-ignore Runtime-provided SillyTavern module.
import {
  eventSource,
  event_types,
  saveSettingsDebounced,
} from "../../../../script.js";
import { createServices } from "./src/bootstrap/create-services";
import {
  getActiveChatId,
  getCharacterDescriptionText,
  getLatestMessageFromPayload,
  getScenarioText,
  isCharacterMessage,
} from "./src/integration/context/st-context";
import { createLogger } from "./src/integration/logging/logger";
import {
  DEFAULT_EXTENSION_SETTINGS,
  type AnalysisMode,
  type ExtensionSettings,
} from "./src/shared/models/settings";

const EXTENSION_NAME = "scene-state-extension";
const SETTINGS_ROOT_SELECTOR = "#extensions_settings2";
const MESSAGE_EVENT_CANDIDATES = ["MESSAGE_RECEIVED", "CHARACTER_MESSAGE_RENDERED"];
const CHAT_EVENT_CANDIDATES = ["CHAT_CHANGED", "CHAT_LOADED"];

let settings: ExtensionSettings = { ...DEFAULT_EXTENSION_SETTINGS };

const logger = createLogger(EXTENSION_NAME, () => settings.debug_mode);
const services = createServices();

function readBooleanSetting(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readAnalysisModeSetting(value: unknown): AnalysisMode {
  return value === "recent_window" ? "recent_window" : "last_message";
}

function readWindowSizeSetting(value: unknown, fallback: number): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0
    ? Math.floor(numericValue)
    : fallback;
}

function readStoredSettings(): ExtensionSettings {
  const storedSettings = extension_settings[EXTENSION_NAME] ?? {};

  return {
    enabled: readBooleanSetting(
      storedSettings.enabled,
      DEFAULT_EXTENSION_SETTINGS.enabled,
    ),
    analysis_mode: readAnalysisModeSetting(storedSettings.analysis_mode),
    window_size: readWindowSizeSetting(
      storedSettings.window_size,
      DEFAULT_EXTENSION_SETTINGS.window_size,
    ),
    debug_mode: readBooleanSetting(
      storedSettings.debug_mode,
      DEFAULT_EXTENSION_SETTINGS.debug_mode,
    ),
  };
}

function persistSettings(nextSettings: ExtensionSettings): void {
  extension_settings[EXTENSION_NAME] = { ...nextSettings };
  saveSettingsDebounced();
}

function updateSettings(patch: Partial<ExtensionSettings>): void {
  settings = { ...settings, ...patch };
  persistSettings(settings);
}

function bindSettingsUi(): void {
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
      enabled: Boolean(enabledInput.prop("checked")),
    });
  });

  analysisModeSelect.on("change", () => {
    updateSettings({
      analysis_mode: String(analysisModeSelect.val()) as AnalysisMode,
    });
  });

  windowSizeInput.on("change", () => {
    const nextValue = Number(windowSizeInput.val());

    updateSettings({
      window_size:
        Number.isFinite(nextValue) && nextValue > 0
          ? Math.floor(nextValue)
          : DEFAULT_EXTENSION_SETTINGS.window_size,
    });
  });

  debugModeInput.on("change", () => {
    updateSettings({
      debug_mode: Boolean(debugModeInput.prop("checked")),
    });
  });
}

async function renderSettings(): Promise<void> {
  const html = await renderExtensionTemplateAsync(EXTENSION_NAME, "settings");
  $(SETTINGS_ROOT_SELECTOR).append(html);
  bindSettingsUi();
}

function initializeChatStateFromContext(context: unknown): void {
  const chatId = getActiveChatId(context);
  if (!chatId) {
    logger.debug("Skipped state initialization because no active chat id was found.");
    return;
  }

  const state = services.stateStore.ensureState(chatId, () =>
    services.initialStateFactory.createInitialState({
      chatId,
      scenarioText: getScenarioText(context),
      characterDescriptionText: getCharacterDescriptionText(context),
    }),
  );

  logger.debug("Chat state is ready.", { chatId, state });
}

async function handleMessageEvent(payload: unknown): Promise<void> {
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

  initializeChatStateFromContext(context);

  const analysisResult = await services.analyzer.analyze({
    chatId,
    message,
    analysisMode: settings.analysis_mode,
    windowSize: settings.window_size,
  });

  logger.debug("Analyzer result received.", { chatId, analysisResult });

  const currentState = services.stateStore.getState(chatId);
  if (!currentState) {
    logger.debug("Prompt build skipped because current state is unavailable.", {
      chatId,
    });
    return;
  }

  const promptResult = services.promptBuilder.build(currentState);
  logger.debug("Prompt build completed.", {
    chatId,
    state: currentState,
    tags: promptResult.tags,
    prompt: promptResult.prompt,
  });
}

function subscribeIfAvailable(
  eventName: string,
  handler: (...args: unknown[]) => void | Promise<void>,
): void {
  const runtimeEvent = event_types?.[eventName];
  if (!runtimeEvent) {
    logger.debug("Runtime event is not available in this SillyTavern version.", {
      eventName,
    });
    return;
  }

  eventSource.on(runtimeEvent, handler);
  logger.debug("Subscribed to runtime event.", { eventName });
}

function registerEventHandlers(): void {
  subscribeIfAvailable("APP_READY", () => {
    logger.debug("Application ready.");
    initializeChatStateFromContext(getContext());
  });

  for (const eventName of MESSAGE_EVENT_CANDIDATES) {
    subscribeIfAvailable(eventName, (payload: unknown) => {
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
  await loadExtensionSettings(EXTENSION_NAME);

  settings = readStoredSettings();
  persistSettings(settings);

  await renderSettings();
  registerEventHandlers();

  logger.debug("Extension initialized.", { settings });
});
