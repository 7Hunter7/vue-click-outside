/**
 * v-click-outside - Современная директива для отслеживания кликов вне элемента
 * @version 2.0.0
 * @license MIT
 *
 * @example
 * // Базовое использование
 * <div v-click-outside="handleClickOutside">...</div>
 *
 * @example
 * // С middleware функцией
 * <div v-click-outside="{
 *   handler: handleClickOutside,
 *   middleware: (target) => !target.closest('.ignore-area')
 * }">...</div>
 *
 * @example
 * // С модификаторами
 * <div v-click-outside.capture.passive="handleClickOutside">...</div>
 */

// Типы для TypeScript
/**
 * @typedef {Object} ClickOutsideConfig
 * @property {Function} handler - Функция-обработчик
 * @property {Function} [middleware] - Функция для дополнительной проверки
 * @property {boolean} [capture=false] - Использовать capture фазу
 * @property {boolean} [passive=true] - Использовать passive слушатель
 */

/**
 * @typedef {Function|ClickOutsideConfig} ClickOutsideBindingValue
 */

// Для тестов
export const _test =
  typeof process !== "undefined" && process.env.NODE_ENV === "test"
    ? {
        handlers: new WeakMap(),
        isListening: false,
        getKeepOpenSelectors: () => Array.from(KEEP_OPEN_SELECTORS),
      }
    : {};

// Кешированные селекторы для оптимизации
const KEEP_OPEN_SELECTORS = new Set([
  // Модальные окна
  ".modal-content",
  ".modal-container",
  ".modal-body",
  ".modal-dialog",
  ".v-modal", // Vuetify
  ".el-dialog", // Element UI
  ".ant-modal", // Ant Design
  ".q-modal", // Quasar

  // Контекстные меню
  ".context-menu",
  ".table-context-menu",
  ".row-context-menu",
  ".col-context-menu",
  ".cell-context-menu",
  ".context-menu-list",

  ".v-contextmenu",
  ".v-menu", // Vuetify
  ".el-dropdown-menu", // Element UI
  ".ant-dropdown", // Ant Design
  ".q-menu", // Quasar

  // Дропдауны
  ".dropdown",
  ".dropdown-menu",
  ".dropdown-content",
  ".v-select", // Vuetify
  ".el-select-dropdown", // Element UI

  // Поповеры и тултипы
  ".popover",
  ".popover-content",
  ".tooltip",
  ".tooltip-content",
  ".v-tooltip", // Vuetify
  ".el-tooltip", // Element UI
  ".q-tooltip", // Quasar

  // Date picker
  ".datepicker",
  ".datepicker-popup",
  ".v-date-picker", // Vuetify
  ".el-date-picker", // Element UI

  // Toast/уведомления
  ".toast",
  ".notification",
  ".v-snackbar", // Vuetify
  ".el-message", // Element UI
]);

// WeakMap для хранения конфигураций
let handlers = new WeakMap();

// Функция для безопасного получения handlers
function getHandlers() {
  if (!handlers || !(handlers instanceof WeakMap)) {
    handlers = new WeakMap();
  }
  return handlers;
}

// Состояние глобального слушателя
let isListening = false;
let pendingEvents = [];
let animationFrame = null;

// Fallback для requestAnimationFrame
const raf = window.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
const caf = window.cancelAnimationFrame || ((id) => clearTimeout(id));

/**
 * Создает оптимизированный глобальный слушатель
 * @returns {Function} Обработчик событий
 */
function createGlobalListener() {
  return (event) => {
    // Сохраняем событие для обработки в RAF
    pendingEvents.push(event);
    if (!animationFrame) {
      animationFrame = raf(processPendingEvents);
    }
  };
}

/**
 * Обрабатывает накопившиеся события
 */
function processPendingEvents() {
  const events = [...pendingEvents];
  pendingEvents = [];
  animationFrame = null;

  // Оптимизация: группируем события по типу
  const eventsByType = new Map();
  events.forEach((event) => {
    const type = event.type;
    if (!eventsByType.has(type)) {
      eventsByType.set(type, []);
    }
    eventsByType.get(type).push(event);
  });

  eventsByType.forEach((typeEvents) => {
    const lastEvent = typeEvents[typeEvents.length - 1];

    getHandlers().forEach((config, element) => {
      // Защита от null target
      if (!lastEvent?.target) return;

      if (config.middleware && !config.middleware(lastEvent.target)) {
        return;
      }

      // Проверяем, был ли клик вне элемента
      if (element && !element.contains(lastEvent.target)) {
        try {
          config.handler(lastEvent);
        } catch (error) {
          console.error("v-click-outside handler error:", error);
        }
      }
    });
  });
}

// Глобальный слушатель
const globalListener = createGlobalListener();

/**
 * Запускает глобальное прослушивание
 */
function startListening() {
  if (!isListening) {
    const options = { passive: true };
    document.addEventListener("click", globalListener, options);
    document.addEventListener("touchstart", globalListener, options);
    document.addEventListener("contextmenu", globalListener, options);
    isListening = true;
  }
}

/**
 * Останавливает глобальное прослушивание
 */
function stopListening() {
  if (isListening && getHandlers().size === 0) {
    document.removeEventListener("click", globalListener);
    document.removeEventListener("touchstart", globalListener);
    document.removeEventListener("contextmenu", globalListener);

    if (animationFrame) {
      caf(animationFrame);
      animationFrame = null;
    }

    pendingEvents = [];
    isListening = false;
  }
}

/**
 * Валидирует значение директивы
 * @param {*} value - Значение для проверки
 * @returns {boolean} Валидно или нет
 */
function validateBinding(value) {
  if (!value) return false;

  if (typeof value === "function") return true;

  if (typeof value === "object" && value !== null) {
    return typeof value.handler === "function";
  }

  return false;
}

/**
 * Нормализует конфигурацию
 * @param {ClickOutsideBindingValue} value - Значение директивы
 * @param {Object} modifiers - Модификаторы
 * @returns {ClickOutsideConfig} Нормализованная конфигурация
 */
function normalizeConfig(value, modifiers) {
  const config = {
    handler: typeof value === "function" ? value : value.handler,
    middleware: value.middleware || null,
    capture: modifiers?.capture || false,
    passive: modifiers?.passive !== false, // true по умолчанию
  };

  return config;
}

// Основная директива
export const vOnClickOutside = {
  /**
   * @param {HTMLElement} el - Элемент
   * @param {Object} binding - Объект привязки
   */
  beforeMount(el, binding) {
    if (!validateBinding(binding.value)) {
      console.warn(
        "[v-click-outside] handler must be a function or an object with handler function",
      );
      return;
    }

    const config = normalizeConfig(binding.value, binding.modifiers);
    getHandlers().set(el, config);
    startListening();
  },

  /**
   * @param {HTMLElement} el - Элемент
   * @param {Object} binding - Объект привязки
   */
  updated(el, binding) {
    if (binding.value === binding.oldValue) return;

    if (!validateBinding(binding.value)) {
      console.warn(
        "[v-click-outside] handler must be a function or an object with handler function",
      );
      return;
    }

    const config = normalizeConfig(binding.value, binding.modifiers);
    getHandlers().set(el, config);
  },

  /**
   * @param {HTMLElement} el - Элемент
   */
  unmounted(el) {
    getHandlers().delete(el);
    stopListening();
  },
};

// Специализированная директива для модальных окон
export const vModalClickOutside = {
  /**
   * @param {HTMLElement} el - Элемент
   * @param {Object} binding - Объект привязки
   */
  beforeMount(el, binding) {
    if (typeof binding.value !== "function") {
      console.warn("[v-modal-click-outside] handler must be a function");
      return;
    }

    // Проверяем поддержку IntersectionObserver
    if (window.IntersectionObserver) {
      // Intersection Observer для отслеживания видимости
      const observer = new IntersectionObserver(
        (entries) => {
          // Обновляем состояние видимости
          entries.forEach((entry) => {
            el._isVisible = entry.isIntersecting;
          });
        },
        { threshold: 0, rootMargin: "10px" },
      );

      observer.observe(el);
      // Сохраняем observer для очистки
      el._clickOutsideObserver = observer;
    }
    el._isVisible = true;

    // Конфигурация с middleware для модалок
    const config = {
      handler: binding.value,
      middleware: (target) => {
        if (!target?.classList) return false;

        // Если есть IntersectionObserver, используем его
        if (window.IntersectionObserver && el._isVisible !== undefined) {
          if (!el._isVisible) return false;
        }

        // Проверяем, что клик не по модалке и не по разрешенным элементам
        if (el.contains(target)) return false;

        // Проверяем защищенные селекторы
        for (const selector of KEEP_OPEN_SELECTORS) {
          if (target.matches?.(selector) || target.closest?.(selector)) {
            return false; // клик по этим селекторам - не закрываем
          }
        }

        return true; // закрываем
      },
    };

    getHandlers().set(el, config);
    startListening();
  },

  /**
   * @param {HTMLElement} el - Элемент
   */
  unmounted(el) {
    if (el._clickOutsideObserver) {
      el._clickOutsideObserver.disconnect();
      delete el._clickOutsideObserver;
    }
    delete el._isVisible;

    getHandlers().delete(el);
    stopListening();
  },
};

// Плагин для Vue
export default {
  /**
   * @param {import('vue').App} app - Vue приложение
   * @param {Object} options - Опции плагина
   * @param {string[]} options.keepOpenSelectors - Дополнительные селекторы
   */
  install(app, options = {}) {
    // Добавляем пользовательские селекторы, которые не должны закрывать модалку
    if (options.keepOpenSelectors && Array.isArray(options.keepOpenSelectors)) {
      options.keepOpenSelectors.forEach((selector) => {
        KEEP_OPEN_SELECTORS.add(selector);
      });
    }

    app.directive("click-outside", vOnClickOutside);
    app.directive("modal-click-outside", vModalClickOutside);

    // Глобальное API
    app.config.globalProperties.$clickOutside = {
      addKeepOpenSelector(selector) {
        KEEP_OPEN_SELECTORS.add(selector);
      },
      removeKeepOpenSelector(selector) {
        KEEP_OPEN_SELECTORS.delete(selector);
      },
      getKeepOpenSelectors() {
        return Array.from(KEEP_OPEN_SELECTORS);
      },
    };
  },
};
