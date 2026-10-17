import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { createLoopCarousel } from '../src/shared/lib/carousel/index.ts';

// Exercise the installed engine's real touch listeners and animation frames.
// Only DOM layout/observers are supplied here; no scroll/rebase implementation is mocked.
function setup(t: TestContext, visible = 1, count = 3, startIndex = 0) {
  const previous = new Map<string, PropertyDescriptor | undefined>();
  function install(name: string, value: unknown) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  class Observer {
    observe() {}
    disconnect() {}
  }
  install('IntersectionObserver', Observer);
  install('ResizeObserver', Observer);
  install('MutationObserver', Observer);
  let time = 1000;
  let frameId = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const ownerWindow = {
    MouseEvent: class extends Event {},
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      frames.set(++frameId, callback);
      return frameId;
    },
    cancelAnimationFrame: (id: number) => frames.delete(id),
    getComputedStyle: () => ({ getPropertyValue: () => '0px' }),
    matchMedia: () => ({ matches: false }),
    setTimeout,
  };
  const ownerDocument = Object.assign(new EventTarget(), {
    defaultView: ownerWindow,
    hidden: false,
  });
  install('document', ownerDocument);
  t.after(() => {
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  });
  class Element extends EventTarget {
    ownerDocument = ownerDocument;
    nodeName = 'DIV';
    children: Element[] = [];
    style = { transform: '' };
    offsetTop = 0;
    offsetLeft = 0;
    offsetWidth = 400;
    offsetHeight = 240;
    offsetParent: Element | null = null;
    parentElement: Element | null = null;
    getAttribute() {
      return null;
    }
    removeAttribute() {}
  }
  const root = new Element();
  const container = new Element();
  root.children = [container];
  container.offsetParent = root;
  container.parentElement = root;
  root.offsetWidth = container.offsetWidth = visible * 400;
  container.children = Array.from({ length: count }, (_, index) => {
    const slide = new Element();
    slide.offsetLeft = index * 400;
    slide.parentElement = slide.offsetParent = container;
    return slide;
  });
  const api = createLoopCarousel(root as unknown as HTMLElement, { startIndex });
  function tick(amount = 16) {
    time += amount;
    const pending = [...frames.values()];
    frames.clear();
    for (const callback of pending) callback(time);
  }
  function touch(type: string, x: number, y = 100, fingers = 1) {
    const event = new Event(type, { cancelable: true });
    Object.defineProperties(event, {
      timeStamp: { value: time },
      touches: { value: Array.from({ length: fingers }, () => ({ clientX: x, clientY: y })) },
    });
    root.dispatchEvent(event);
    return event;
  }
  function swipe(direction: number) {
    touch('touchstart', 200);
    for (let step = 1; step <= 4; step++) {
      tick();
      assert.equal(touch('touchmove', 200 - direction * step * 75).defaultPrevented, true);
    }
    touch('touchend', 200 - direction * 300);
    tick(); // The next touch starts before the previous animation settles.
  }
  t.after(() => {
    api.destroy();
  });
  return { api, root, container, touch, tick, swipe };
}

for (const visible of [1, 2]) {
  for (const firstDirection of [-1, 1]) {
    test(`${visible} visible reviews: 120 interrupted swipes, starting ${firstDirection}`, (t) => {
      const { api, swipe } = setup(t, visible);
      assert.equal(
        api.internalEngine().options.loop,
        true,
        'three reviews must support a real loop',
      );
      for (const direction of [firstDirection, -firstDirection, firstDirection, -firstDirection]) {
        const seen = new Set<number>();
        for (let i = 0; i < 30; i++) {
          const before = api.selectedScrollSnap();
          swipe(direction);
          assert.notEqual(api.selectedScrollSnap(), before, `swipe ${i} must not hit an end`);
          assert.equal(api.canScrollNext() && api.canScrollPrev(), true);
          seen.add(api.selectedScrollSnap());
        }
        assert.equal(seen.size, 3, 'every review remains reachable in each direction');
      }
    });
  }
}

test('vertical gestures and pinch zoom are released, then a horizontal swipe still works', (t) => {
  const { api, touch, swipe } = setup(t);
  touch('touchstart', 200);
  assert.equal(touch('touchmove', 202, 200).defaultPrevented, false);
  assert.equal(api.internalEngine().dragHandler.pointerDown(), false);
  touch('touchstart', 200);
  assert.equal(touch('touchmove', 100, 100, 2).defaultPrevented, false);
  assert.equal(api.internalEngine().dragHandler.pointerDown(), false);
  swipe(1);
  assert.notEqual(api.selectedScrollSnap(), 0);
});

test('gallery opens at the chosen photo and loops across both ends during rapid swipes', (t) => {
  const { api, swipe } = setup(t, 1, 20, 19);
  assert.equal(api.selectedScrollSnap(), 19);
  for (const direction of [1, -1]) {
    const seen = new Set<number>();
    for (let i = 0; i < 40; i++) {
      swipe(direction);
      seen.add(api.selectedScrollSnap());
    }
    assert.equal(seen.size, 20);
  }
  api.scrollTo(7, true);
  assert.equal(api.selectedScrollSnap(), 7, 'thumbnail navigation stays in sync');
  api.reInit();
  assert.equal(api.selectedScrollSnap(), 7, 'resize preserves the active photo');
});

test('a single gallery photo stays still and destroying a viewer removes its touch handlers', (t) => {
  const { api, touch, container } = setup(t, 1, 1);
  assert.equal(api.canScrollNext() || api.canScrollPrev(), false);
  api.destroy();
  touch('touchstart', 200);
  assert.equal(touch('touchmove', 20).defaultPrevented, false);
  assert.equal(container.style.transform, '');
});
