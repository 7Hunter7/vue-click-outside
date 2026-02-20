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
