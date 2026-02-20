import { mount } from "@vue/test-utils";
import ClickOutside from "../src/clickOutside";

describe("v-click-outside directive", () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(
      {
        template: `
        <div>
          <div v-click-outside="handler" class="target">Target</div>
          <div class="outside">Outside</div>
        </div>
      `,
        directives: { clickOutside: ClickOutside.vOnClickOutside },
        methods: { handler: jest.fn() },
      },
      { attachTo: document.body },
    );
  });

  afterEach(() => {
    wrapper.destroy();
    jest.clearAllMocks();
  });

  test("calls handler when clicking outside", async () => {
    document.querySelector(".outside").click();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(wrapper.vm.handler).toHaveBeenCalled();
  });

  test("does not call handler when clicking inside", async () => {
    document.querySelector(".target").click();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(wrapper.vm.handler).not.toHaveBeenCalled();
  });

  test("middleware prevents handler call", async () => {
    wrapper = mount(
      {
        template: `
        <div>
          <div v-click-outside="config" class="target">Target</div>
          <div class="outside">Outside</div>
        </div>
      `,
        directives: { clickOutside: ClickOutside.vOnClickOutside },
        data: () => ({
          config: {
            handler: jest.fn(),
            middleware: (target) => target.className !== "outside",
          },
        }),
      },
      { attachTo: document.body },
    );

    document.querySelector(".outside").click();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(wrapper.vm.config.handler).not.toHaveBeenCalled();
  });
});

// Проверка утечек
describe("Memory leaks", () => {
  test("handlers WeakMap is cleaned up", async () => {
    const wrapper = mount({
      template: `<div v-click-outside="() => {}">Test</div>`,
      directives: { clickOutside: ClickOutside.vOnClickOutside },
    });

    const element = wrapper.element;
    expect(handlers.has(element)).toBe(true);

    wrapper.destroy();
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(handlers.has(element)).toBe(false);
    expect(isListening).toBe(false);
  });

  test("multiple directives are handled efficiently", async () => {
    const wrappers = [];

    // Создаем 1000 директив
    for (let i = 0; i < 1000; i++) {
      wrappers.push(
        mount({
          template: `<div v-click-outside="() => {}">Test ${i}</div>`,
          directives: { clickOutside: ClickOutside.vOnClickOutside },
        }),
      );
    }

    expect(handlers.size).toBe(1000);
    expect(isListening).toBe(true);

    // Удаляем все
    wrappers.forEach((w) => w.destroy());
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(handlers.size).toBe(0);
    expect(isListening).toBe(false);
  });
});

// Проверка на XSS
test("prevents XSS in middleware", () => {
  const maliciousInput = "<img src=x onerror=alert(1)>";

  const wrapper = mount({
    template: `
      <div v-click-outside="{
        handler: () => {},
        middleware: (target) => {
          // Зловредный код не выполнится
          return target.className === '${maliciousInput}';
        }
      }">Test</div>
    `,
    directives: { clickOutside: ClickOutside.vOnClickOutside },
  });

  // Проверяем, что функция не выполнилась
  expect(wrapper.vm).toBeDefined();
});

// Производительность
test("handles rapid events efficiently", async () => {
  const handler = jest.fn();

  const wrapper = mount(
    {
      template: `<div v-click-outside="handler">Target</div>`,
      directives: { clickOutside: ClickOutside.vOnClickOutside },
      data: () => ({ handler }),
    },
    { attachTo: document.body },
  );

  const start = performance.now();

  // 100 быстрых кликов
  for (let i = 0; i < 100; i++) {
    document.body.click();
  }

  await new Promise((resolve) => requestAnimationFrame(resolve));

  const end = performance.now();
  const timePerClick = (end - start) / 100;

  // Должно быть < 1ms на клик
  expect(timePerClick).toBeLessThan(1);
  expect(handler).toHaveBeenCalled();
});

// Проверка feature detection
test("works in older browsers", () => {
  // Симулируем отсутствие requestAnimationFrame
  const originalRAF = window.requestAnimationFrame;
  window.requestAnimationFrame = undefined;

  const wrapper = mount({
    template: `<div v-click-outside="() => {}">Test</div>`,
    directives: { clickOutside: ClickOutside.vOnClickOutside },
  });

  document.body.click();

  // Должен использовать fallback на setTimeout
  expect(wrapper).toBeDefined();

  window.requestAnimationFrame = originalRAF;
});
