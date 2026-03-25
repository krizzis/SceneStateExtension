export type AnalysisMode = "last_turn" | "recent_turns";

export interface ExtensionSettings {
  enabled: boolean;
  analysis_mode: AnalysisMode;
  window_size: number;
  debug_mode: boolean;
}

export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettings = {
  enabled: true,
  analysis_mode: "last_turn",
  window_size: 5,
  debug_mode: false,
};
