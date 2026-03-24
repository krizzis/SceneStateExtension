export type AnalysisMode = "last_message" | "recent_window";

export interface ExtensionSettings {
  enabled: boolean;
  analysis_mode: AnalysisMode;
  window_size: number;
  debug_mode: boolean;
}

export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettings = {
  enabled: true,
  analysis_mode: "last_message",
  window_size: 5,
  debug_mode: false,
};
