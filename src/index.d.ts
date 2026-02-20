declare module "vue-click-outside" {
  import { PluginFunction, DirectiveFunction } from "vue";

  export interface ClickOutsideConfig {
    handler: (event: Event) => void;
    middleware?: (target: EventTarget | null) => boolean;
    capture?: boolean;
    passive?: boolean;
  }

  export type ClickOutsideBindingValue =
    | ClickOutsideConfig
    | ((event: Event) => void);

  export const vOnClickOutside: DirectiveFunction;
  export const vModalClickOutside: DirectiveFunction;

  export interface GlobalClickOutsideAPI {
    addIgnoredSelector(selector: string): void;
    removeIgnoredSelector(selector: string): void;
  }

  const plugin: {
    install: PluginFunction<{
      ignoredSelectors?: string[];
      defaultCapture?: boolean;
      defaultPassive?: boolean;
    }>;
  };

  export default plugin;
}
