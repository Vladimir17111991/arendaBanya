import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer, ref } from 'vue';
import { useReviewCarousel } from '../src/widgets/reviews/model/useReviewCarousel.ts';

function setup(t: TestContext) {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval'] });
  const previous = new Map<string, PropertyDescriptor | undefined>();
  function install(name: string, value: unknown) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  install('matchMedia', () => ({ matches: true }));
  install(
    'ResizeObserver',
    class {
      private notify: () => void;
      constructor(notify: () => void) {
        this.notify = notify;
      }
      observe() {
        this.notify();
      }
      disconnect() {}
    },
  );
  let captures = 0;
  const element = {
    scrollLeft: 0,
    getBoundingClientRect: () => ({ top: 0, bottom: 300 }),
    style: { scrollSnapType: '' },
    children: [
      { getBoundingClientRect: (): { left: number } => ({ left: -element.scrollLeft }) },
      { getBoundingClientRect: (): { left: number } => ({ left: 360 - element.scrollLeft }) },
    ],
    scrollTo: ({ left }: { left: number }) => {
      element.scrollLeft = left;
    },
    setPointerCapture: () => {
      captures++;
    },
    hasPointerCapture: () => false,
  };
  type Node = { children: Node[] };
  const node = (): Node => ({ children: [] });
  const renderer = createRenderer<Node, Node>({
    insert: (child, parent) => {
      parent.children.push(child);
    },
    remove() {},
    createElement: node,
    createText: node,
    createComment: node,
    setText() {},
    setElementText() {},
    parentNode: () => null,
    nextSibling: () => null,
    patchProp() {},
  });
  let carousel!: ReturnType<typeof useReviewCarousel>;
  const app = renderer.createApp({
    setup() {
      carousel = useReviewCarousel(3, ref(false), ref(element as unknown as HTMLElement));
      return () => null;
    },
  });
  app.mount(node());
  t.after(() => {
    app.unmount();
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  });
  return { carousel, element, captures: () => captures };
}

test('touch pointers stay native and pointercancel does not rewind a finger swipe', (t) => {
  const { carousel, element, captures } = setup(t);
  assert.equal(element.scrollLeft, 3 * 360);
  carousel.startTouch();
  carousel.startDrag({
    pointerType: 'touch',
    isPrimary: true,
    button: 0,
    pointerId: 1,
  } as PointerEvent);
  assert.equal(captures(), 0);
  assert.equal(element.style.scrollSnapType, '');
  element.scrollLeft = 4 * 360;
  carousel.onScroll();
  carousel.endDrag({ type: 'pointercancel', pointerId: 1 } as PointerEvent);
  assert.equal(element.scrollLeft, 4 * 360);
  carousel.advance(1);
  assert.equal(element.scrollLeft, 4 * 360, 'autoplay cannot fight the active touch');
  carousel.endTouch();
  carousel.finishTouchScroll();
  carousel.advance(1);
  assert.equal(element.scrollLeft, 5 * 360);
});

test('native swipes rebase after settling and remain endless in both directions', (t) => {
  const { carousel, element } = setup(t);
  for (const direction of [-1, 1]) {
    for (let index = 0; index < 12; index++) {
      const before = element.scrollLeft / 360;
      carousel.startTouch();
      element.scrollLeft += direction * 360;
      carousel.onScroll();
      carousel.finishTouchScroll();
      assert.equal(
        element.scrollLeft / 360,
        before + direction,
        'no teleport while finger is down',
      );
      carousel.endTouch();
      carousel.finishTouchScroll();
      assert.equal(element.scrollLeft / 360, 3 + ((((before + direction) % 3) + 3) % 3));
    }
  }
});

test('older mobile browsers wait for momentum to finish before rebasing', (t) => {
  const { carousel, element } = setup(t);
  carousel.startTouch();
  element.scrollLeft = 6 * 360;
  carousel.onScroll();
  t.mock.timers.tick(300);
  assert.equal(element.scrollLeft, 6 * 360, 'a held gesture must not be rebased');
  carousel.endTouch();
  t.mock.timers.tick(150);
  element.scrollLeft += 20;
  carousel.onScroll();
  t.mock.timers.tick(150);
  assert.equal(element.scrollLeft, 6 * 360 + 20, 'momentum restarts the idle timer');
  element.scrollLeft = 6 * 360;
  carousel.onScroll();
  t.mock.timers.tick(220);
  assert.equal(element.scrollLeft, 3 * 360);
});
