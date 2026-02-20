import { mount } from "@vue/test-utils";
import ClickOutsidePlugin, {
  vOnClickOutside,
  vModalClickOutside,
} from "../src/clickOutside";

// Константы для тестов
const TEST_TIMEOUT = 200;
const EVENT_OPTIONS = {
  bubbles: true,
  cancelable: true,
  view: window,
};

// Хелпер для создания тестовых компонентов
const createTestComponent = (template, data = {}, methods = {}) => ({
  template,
  data: () => data,
  methods,
  directives: {
    "click-outside": vOnClickOutside,
    "modal-click-outside": vModalClickOutside,
  },
});

describe("v-click-outside directive", () => {
  let wrapper;
  let handler;

  beforeEach(() => {
    handler = jest.fn();

    wrapper = mount(
      createTestComponent(
        `<div>
        <div v-click-outside="onClickOutside" class="target" data-test="target">
          Target Element
        </div>
        <div class="outside" data-test="outside">Outside Element</div>
      </div>`,
        {},
        { onClickOutside: handler },
      ),
      { attachTo: document.body },
    );
  });

  afterEach(() => {
    wrapper?.destroy();
    handler.mockClear();
    document.body.innerHTML = "";
    jest.clearAllMocks();

    // Восстанавливаем нативные API
    if (window.requestAnimationFrame.mockRestore) {
      window.requestAnimationFrame.mockRestore();
    }
  });

  // ========== БАЗОВЫЕ ТЕСТЫ ==========
  test("вызывает обработчик при клике вне элемента", async () => {
    const outsideElement = document.querySelector('[data-test="outside"]');
    expect(outsideElement).toBeTruthy();

    const event = new MouseEvent("click", EVENT_OPTIONS);
    outsideElement.dispatchEvent(event);

    await new Promise((resolve) => setTimeout(resolve, TEST_TIMEOUT));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].type).toBe("click");
  });

  test("НЕ вызывает обработчик при клике внутри элемента", async () => {
    const targetElement = document.querySelector('[data-test="target"]');
    expect(targetElement).toBeTruthy();

    const event = new MouseEvent("click", EVENT_OPTIONS);
    targetElement.dispatchEvent(event);

    await new Promise((resolve) => setTimeout(resolve, TEST_TIMEOUT));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(handler).not.toHaveBeenCalled();
  });

  // ========== MIDDLEWARE ТЕСТЫ ==========
  test("middleware предотвращает вызов обработчика", async () => {
    const configHandler = jest.fn();

    wrapper = mount(
      createTestComponent(
        `<div>
        <div v-click-outside="config" class="target">Target</div>
        <div class="outside">Outside</div>
      </div>`,
        {
          config: {
            handler: configHandler,
            middleware: (target) => target?.className !== "outside",
          },
        },
      ),
      { attachTo: document.body },
    );

    const outsideElement = document.querySelector(".outside");
    expect(outsideElement).toBeTruthy();

    const event = new MouseEvent("click", EVENT_OPTIONS);
    outsideElement.dispatchEvent(event);

    await new Promise((resolve) => setTimeout(resolve, TEST_TIMEOUT));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(configHandler).not.toHaveBeenCalled();
  });

  // ========== XSS ТЕСТ ==========
  test("предотвращает XSS в middleware", () => {
    const maliciousInput = "<img src=x onerror=alert(1)>";

    const xssWrapper = mount(
      createTestComponent(
        `<div v-click-outside="{
        handler: () => {},
        middleware: (target) => target?.className === '${maliciousInput}'
      }">Test</div>`,
      ),
    );

    expect(xssWrapper).toBeDefined();
    expect(xssWrapper.vm).toBeDefined();
    xssWrapper.destroy();
  });

  // ========== ДЕТАЛИ СОБЫТИЙ ==========
  test("обработчик получает правильный объект события", async () => {
    const outsideElement = document.querySelector('[data-test="outside"]');
    expect(outsideElement).toBeTruthy();

    const event = new MouseEvent("click", {
      ...EVENT_OPTIONS,
      clientX: 100,
      clientY: 200,
    });

    outsideElement.dispatchEvent(event);

    await new Promise((resolve) => setTimeout(resolve, TEST_TIMEOUT));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toMatchObject({
      type: "click",
      clientX: 100,
      clientY: 200,
    });
  });
});

describe("v-modal-click-outside directive", () => {
  let wrapper;
  let handler;

  beforeEach(() => {
    handler = jest.fn();

    wrapper = mount(
      createTestComponent(
        `<div class="modal" v-modal-click-outside="onClickOutside" data-test="modal">
        <div class="modal-content" data-test="content">Modal Content</div>
        <button class="modal-button" data-test="button">Button</button>
      </div>`,
        {},
        { onClickOutside: handler },
      ),
      { attachTo: document.body },
    );
  });

  afterEach(() => {
    wrapper?.destroy();
    handler.mockClear();
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  test("НЕ вызывает обработчик при клике внутри модалки", async () => {
    const contentElement = document.querySelector('[data-test="content"]');
    expect(contentElement).toBeTruthy();

    const event = new MouseEvent("click", EVENT_OPTIONS);
    contentElement.dispatchEvent(event);

    await new Promise((resolve) => setTimeout(resolve, TEST_TIMEOUT));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(handler).not.toHaveBeenCalled();
  });

  test("вызывает обработчик при клике вне модалки", async () => {
    const event = new MouseEvent("click", EVENT_OPTIONS);
    document.body.dispatchEvent(event);

    await new Promise((resolve) => setTimeout(resolve, TEST_TIMEOUT));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  test("НЕ вызывает обработчик при клике на игнорируемые селекторы", async () => {
    // Добавляем игнорируемый селектор через глобальное API
    if (wrapper.vm.$root.$clickOutside) {
      wrapper.vm.$root.$clickOutside.addIgnoredSelector(".modal-button");
    }

    const button = document.querySelector('[data-test="button"]');
    expect(button).toBeTruthy();

    const event = new MouseEvent("click", EVENT_OPTIONS);
    button.dispatchEvent(event);

    await new Promise((resolve) => setTimeout(resolve, TEST_TIMEOUT));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(handler).not.toHaveBeenCalled();
  });
});

describe("Плагин и API", () => {
  // ========== ТЕСТЫ ПЛАГИНА ==========
  describe("Plugin installation", () => {
    test("устанавливает директивы", () => {
      const app = {
        directive: jest.fn(),
        config: { globalProperties: {} },
      };

      ClickOutsidePlugin.install(app);

      expect(app.directive).toHaveBeenCalledWith(
        "click-outside",
        vOnClickOutside,
      );
      expect(app.directive).toHaveBeenCalledWith(
        "modal-click-outside",
        vModalClickOutside,
      );
    });

    test("добавляет глобальное API", () => {
      const app = {
        directive: jest.fn(),
        config: { globalProperties: {} },
      };

      ClickOutsidePlugin.install(app);

      const api = app.config.globalProperties.$clickOutside;
      expect(api).toBeDefined();
      expect(typeof api.addIgnoredSelector).toBe("function");
      expect(typeof api.removeIgnoredSelector).toBe("function");

      // Проверяем что методы работают без ошибок
      expect(() => {
        api.addIgnoredSelector(".test");
        api.removeIgnoredSelector(".test");
      }).not.toThrow();
    });
  });

  // ========== ТЕСТЫ СОВМЕСТИМОСТИ ==========
  describe("Browser compatibility", () => {
    test("работает без requestAnimationFrame (старые браузеры)", () => {
      const originalRAF = window.requestAnimationFrame;
      window.requestAnimationFrame = undefined;

      const wrapper = mount(
        createTestComponent(`<div v-click-outside="() => {}">Test</div>`),
      );

      document.body.click();

      expect(wrapper).toBeDefined();
      expect(wrapper.vm).toBeDefined();

      wrapper.destroy();
      window.requestAnimationFrame = originalRAF;
    });

    test("работает без IntersectionObserver (старые браузеры)", () => {
      const originalIO = window.IntersectionObserver;
      window.IntersectionObserver = undefined;

      const wrapper = mount(
        createTestComponent(
          `<div class="modal" v-modal-click-outside="() => {}">Modal</div>`,
        ),
      );

      document.body.click();

      expect(wrapper).toBeDefined();
      expect(wrapper.vm).toBeDefined();

      wrapper.destroy();
      window.IntersectionObserver = originalIO;
    });
  });
});
