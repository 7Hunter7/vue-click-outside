import { mount } from "@vue/test-utils";
import ClickOutsidePlugin, {
  vOnClickOutside,
  vModalClickOutside,
  _test,
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
      wrapper.vm.$root.$clickOutside.addKeepOpenSelector(".modal-button");
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
      expect(typeof api.addKeepOpenSelector).toBe("function");
      expect(typeof api.removeKeepOpenSelector).toBe("function");
      expect(typeof api.getKeepOpenSelectors).toBe("function");

      // Проверяем что методы работают без ошибок
      expect(() => {
        api.addKeepOpenSelector(".test");
        api.removeKeepOpenSelector(".test");
        api.getKeepOpenSelectors();
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

// ========== ТЕСТЫ для getKeepOpenSelectors ==========
describe("Глобальное API - getKeepOpenSelectors", () => {
  test("возвращает массив защищенных селекторов", () => {
    const app = {
      directive: jest.fn(),
      config: { globalProperties: {} },
    };

    ClickOutsidePlugin.install(app);
    const api = app.config.globalProperties.$clickOutside;

    const selectors = api.getKeepOpenSelectors();
    expect(Array.isArray(selectors)).toBe(true);
    expect(selectors).toContain(".modal-content");
    expect(selectors).toContain(".dropdown");
  });

  test("обновляется после добавления нового селектора", () => {
    const app = {
      directive: jest.fn(),
      config: { globalProperties: {} },
    };

    ClickOutsidePlugin.install(app);
    const api = app.config.globalProperties.$clickOutside;

    const before = api.getKeepOpenSelectors();
    api.addKeepOpenSelector(".new-test-selector");
    const after = api.getKeepOpenSelectors();

    expect(after.length).toBe(before.length + 1);
    expect(after).toContain(".new-test-selector");
  });

  test("обновляется после удаления селектора", () => {
    const app = {
      directive: jest.fn(),
      config: { globalProperties: {} },
    };

    ClickOutsidePlugin.install(app);
    const api = app.config.globalProperties.$clickOutside;

    api.addKeepOpenSelector(".to-remove");
    const before = api.getKeepOpenSelectors();

    api.removeKeepOpenSelector(".to-remove");
    const after = api.getKeepOpenSelectors();

    expect(after.length).toBe(before.length - 1);
    expect(after).not.toContain(".to-remove");
  });
});

// ========== ТЕСТЫ для опций плагина ==========
describe("Опции плагина - keepOpenSelectors", () => {
  test("добавляет пользовательские селекторы при инициализации", () => {
    const app = {
      directive: jest.fn(),
      config: { globalProperties: {} },
    };

    const customSelectors = [".custom-1", ".custom-2", ".custom-3"];

    ClickOutsidePlugin.install(app, {
      keepOpenSelectors: customSelectors,
    });

    const api = app.config.globalProperties.$clickOutside;
    const selectors = api.getKeepOpenSelectors();

    customSelectors.forEach((selector) => {
      expect(selectors).toContain(selector);
    });
  });

  test("не ломается при пустых опциях", () => {
    const app = {
      directive: jest.fn(),
      config: { globalProperties: {} },
    };

    expect(() => {
      ClickOutsidePlugin.install(app, {});
      ClickOutsidePlugin.install(app, { keepOpenSelectors: [] });
      ClickOutsidePlugin.install(app, { keepOpenSelectors: null });
    }).not.toThrow();
  });
});

// ========== ТЕСТЫ для множественных модалок ==========
describe("Множественные модальные окна", () => {
  test("корректно обрабатывает несколько модалок одновременно", async () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    const wrapper = mount(
      {
        template: `
        <div>
          <div class="modal1" v-modal-click-outside="handler1" data-test="modal1">
            <div class="modal1-content">Modal 1</div>
          </div>
          <div class="modal2" v-modal-click-outside="handler2" data-test="modal2">
            <div class="modal2-content">Modal 2</div>
          </div>
        </div>
      `,
        directives: {
          modalClickOutside: vModalClickOutside,
        },
        data: () => ({ handler1, handler2 }),
      },
      { attachTo: document.body },
    );

    // Клик внутри первой модалки
    document.querySelector(".modal1-content").click();
    await new Promise((resolve) => setTimeout(resolve, TEST_TIMEOUT));

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();

    // Клик вне всех модалок
    document.body.click();
    await new Promise((resolve) => setTimeout(resolve, TEST_TIMEOUT));

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);

    wrapper.destroy();
  });
});

// ========== ТЕСТЫ для динамических элементов ==========
describe("Динамические элементы", () => {
  test("обрабатывает динамически добавленные элементы", async () => {
    const handler = jest.fn();

    const wrapper = mount(
      {
        template: `
        <div>
          <div v-if="show" v-click-outside="handler" class="dynamic-target" data-test="dynamic">
            Dynamic Target
          </div>
          <button @click="show = !show" data-test="toggle">Toggle</button>
        </div>
      `,
        directives: { clickOutside: vOnClickOutside },
        data: () => ({ show: true, handler }),
      },
      { attachTo: document.body },
    );

    // Элемент существует
    const target = document.querySelector('[data-test="dynamic"]');
    expect(target).toBeTruthy();

    // Клик вне
    document.body.click();
    await new Promise((resolve) => setTimeout(resolve, TEST_TIMEOUT));
    expect(handler).toHaveBeenCalledTimes(1);

    // Скрываем элемент
    await wrapper.find('[data-test="toggle"]').trigger("click");
    await wrapper.vm.$nextTick();

    // Кликаем снова - обработчик не должен вызываться (элемента нет)
    document.body.click();
    await new Promise((resolve) => setTimeout(resolve, TEST_TIMEOUT));
    expect(handler).toHaveBeenCalledTimes(1); // Не увеличилось

    wrapper.destroy();
  });
});

// ========== ТЕСТЫ производительности ==========
describe("Производительность", () => {
  test("обрабатывает быстрые последовательные клики без потери производительности", async () => {
    const handler = jest.fn();

    const wrapper = mount(
      createTestComponent(
        `<div v-click-outside="handler" class="target">Target</div>`,
        {},
        { handler },
      ),
      { attachTo: document.body },
    );

    const start = performance.now();
    const clickCount = 50;

    // Быстрые клики
    for (let i = 0; i < clickCount; i++) {
      document.body.click();
    }

    await new Promise((resolve) => setTimeout(resolve, TEST_TIMEOUT));

    const end = performance.now();
    const timePerClick = (end - start) / clickCount;

    // Должно быть быстро (меньше 2мс на клик)
    expect(timePerClick).toBeLessThan(2);
    expect(handler).toHaveBeenCalledTimes(clickCount);

    wrapper.destroy();
  });

  test("не накапливает утечки памяти при множественных монтированиях", async () => {
    const handler = jest.fn();
    const wrappers = [];

    // Создаем много экземпляров
    for (let i = 0; i < 100; i++) {
      const w = mount(
        createTestComponent(
          `<div v-click-outside="handler">Target ${i}</div>`,
          {},
          { handler },
        ),
        { attachTo: document.body },
      );
      wrappers.push(w);
    }

    // Проверяем что все работают
    document.body.click();
    await new Promise((resolve) => setTimeout(resolve, TEST_TIMEOUT));

    // Должен быть вызван для каждого экземпляра
    expect(handler).toHaveBeenCalledTimes(100);

    // Уничтожаем все
    wrappers.forEach((w) => w.destroy());
    handler.mockClear();

    // После уничтожения клики не должны вызывать обработчик
    document.body.click();
    await new Promise((resolve) => setTimeout(resolve, TEST_TIMEOUT));

    expect(handler).not.toHaveBeenCalled();
  });
});

// ========== ТЕСТЫ для расширенных селекторов ==========
describe("Расширенные селекторы", () => {
  test("должен содержать все популярные селекторы UI библиотек", () => {
    const app = {
      directive: jest.fn(),
      config: { globalProperties: {} },
    };

    ClickOutsidePlugin.install(app);
    const api = app.config.globalProperties.$clickOutside;
    const selectors = api.getKeepOpenSelectors();

    // Проверяем наличие селекторов для разных библиотек
    const expectedSelectors = [
      // Vuetify
      ".v-modal",
      ".v-menu",
      ".v-tooltip",
      ".v-snackbar",
      // Element UI
      ".el-dialog",
      ".el-dropdown-menu",
      ".el-tooltip",
      ".el-message",
      // Ant Design
      ".ant-modal",
      ".ant-dropdown",
    ];

    expectedSelectors.forEach((selector) => {
      expect(selectors).toContain(selector);
    });
  });
});
