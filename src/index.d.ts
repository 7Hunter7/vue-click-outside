declare module "vue-click-outside" {
  import { PluginFunction, DirectiveFunction } from "vue"; // Vue 2 
  // import type { PluginFunction, DirectiveFunction } from "vue"; // Vue 3
  // Интерфейсы
  export interface ClickOutsideConfig {
    handler: (event: Event) => void;
    middleware?: (target: EventTarget | null) => boolean;
    capture?: boolean;
    passive?: boolean;
  }
  // Union тип
  export type ClickOutsideBindingValue =
    | ClickOutsideConfig
    | ((event: Event) => void);

  export const vOnClickOutside: DirectiveFunction;
  export const vModalClickOutside: DirectiveFunction;

  export interface GlobalClickOutsideAPI {
    addIgnoredSelector(selector: string): void;
    removeIgnoredSelector(selector: string): void;
  }
  // Структура плагина
  const plugin: {
    install: PluginFunction<{
      ignoredSelectors?: string[];
      defaultCapture?: boolean;
      defaultPassive?: boolean;
    }>;
  };

  export default plugin;
}
// Экспорт глобальных переменных
declare global {
  interface Window {
    __VUE_CLICK_OUTSIDE__?: {
      handlers: WeakMap<Element, any>;
    };
  }
}