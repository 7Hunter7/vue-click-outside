declare module "vue-click-outside-next" {
  import { PluginFunction, DirectiveFunction } from "vue"; // Vue 2
  // import type { PluginFunction, DirectiveFunction } from "vue"; // Vue 3

  // ========== ОСНОВНЫЕ ИНТЕРФЕЙСЫ ==========

  /**
   * Конфигурация директивы v-click-outside
   */
  export interface ClickOutsideConfig {
    /** Функция-обработчик (обязательная) */
    handler: (event: Event) => void;
    /** Функция для дополнительной проверки */
    middleware?: (target: EventTarget | null) => boolean;
    /** Использовать capture фазу */
    capture?: boolean;
    /** Использовать passive слушатель */
    passive?: boolean;
  }

  /**
   * Значение, которое можно передать в директиву
   */
  export type ClickOutsideBindingValue =
    | ClickOutsideConfig
    | ((event: Event) => void);

  // ========== ДИРЕКТИВЫ ==========

  /** Базовая директива для отслеживания кликов вне элемента */
  export const vOnClickOutside: DirectiveFunction;

  /** Специализированная директива для модальных окон */
  export const vModalClickOutside: DirectiveFunction;

  // ========== ГЛОБАЛЬНОЕ API ==========

  /**
   * Глобальное API для управления защищенными селекторами
   */
  export interface GlobalClickOutsideAPI {
    /**
     * Добавить защищенный селектор (клик по нему НЕ закрывает модалку)
     * @param selector - CSS селектор
     */
    addKeepOpenSelector(selector: string): void;

    /**
     * Удалить защищенный селектор
     * @param selector - CSS селектор
     */
    removeKeepOpenSelector(selector: string): void;

    /**
     * Получить список всех защищенных селекторов
     * @returns Массив CSS селекторов
     */
    getKeepOpenSelectors(): string[];
  }

  // ========== ОПЦИИ ПЛАГИНА ==========

  /**
   * Опции для установки плагина
   */
  export interface PluginOptions {
    /** Дополнительные защищенные селекторы */
    keepOpenSelectors?: string[];
    /** Использовать capture фазу по умолчанию */
    defaultCapture?: boolean;
    /** Использовать passive слушатель по умолчанию */
    defaultPassive?: boolean;
  }

  // ========== ПЛАГИН ==========

  /**
   * Плагин для Vue
   */
  const plugin: {
    install: PluginFunction<PluginOptions>;
  };

  export default plugin;
}

// ========== РАСШИРЕНИЯ ДЛЯ VUE 2 ==========

/**
 * Расширение глобальных свойств Vue 2
 */
declare module "vue/types/vue" {
  interface Vue {
    /** Глобальное API для управления защищенными селекторами */
    $clickOutside: import("vue-click-outside-next").GlobalClickOutsideAPI;
  }
}

// ========== РАСШИРЕНИЯ ДЛЯ VUE 3 ==========

/**
 * Расширение для Vue 3 (опционально)
 */
declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    /** Глобальное API для управления защищенными селекторами */
    $clickOutside: import("vue-click-outside-next").GlobalClickOutsideAPI;
  }
}

/**
 * Глобальные переменные (для отладки и тестов)
 */
declare global {
  interface Window {
    __VUE_CLICK_OUTSIDE__?: {
      handlers: WeakMap<Element, any>;
    };
  }
}
