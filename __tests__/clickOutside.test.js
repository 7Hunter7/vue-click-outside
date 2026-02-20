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
describe('Memory leaks', () => {
  test('handlers WeakMap is cleaned up', async () => {
    const wrapper = mount({
      template: `<div v-click-outside="() => {}">Test</div>`,
      directives: { clickOutside: ClickOutside.vOnClickOutside }
    });

    const element = wrapper.element;
    expect(handlers.has(element)).toBe(true);

    wrapper.destroy();
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(handlers.has(element)).toBe(false);
    expect(isListening).toBe(false);
  });

  test('multiple directives are handled efficiently', async () => {
    const wrappers = [];
    
    // Создаем 1000 директив
    for (let i = 0; i < 1000; i++) {
      wrappers.push(mount({
        template: `<div v-click-outside="() => {}">Test ${i}</div>`,
        directives: { clickOutside: ClickOutside.vOnClickOutside }
      }));
    }

    expect(handlers.size).toBe(1000);
    expect(isListening).toBe(true);

    // Удаляем все
    wrappers.forEach(w => w.destroy());
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(handlers.size).toBe(0);
    expect(isListening).toBe(false);
  });
});