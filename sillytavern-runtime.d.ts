declare module "*extensions.js" {
  export const extension_settings: Record<string, Record<string, unknown>>;
  export function loadExtensionSettings(name: string): Promise<void>;
  export function renderExtensionTemplateAsync(
    extensionName: string,
    templateName: string,
  ): Promise<string>;
  export function getContext(): unknown;
}

declare module "*script.js" {
  export const eventSource: {
    on(eventName: unknown, handler: (...args: unknown[]) => void | Promise<void>): void;
  };
  export const event_types: Record<string, unknown>;
  export function saveSettingsDebounced(): void;
}

declare const $: any;
declare const jQuery: (callback: () => Promise<void> | void) => void;
