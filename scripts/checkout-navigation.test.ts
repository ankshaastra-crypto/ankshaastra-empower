import { afterEach, expect, test } from "bun:test";
import { DEFAULT_PACKAGE, openNameCheck, showPackages } from "../src/lib/packageNavigation";

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "document");
  Reflect.deleteProperty(globalThis, "requestAnimationFrame");
});

test("general report CTA selects Name Check, not a baby report", () => {
  let selected = "";
  Object.assign(globalThis, { window: { dispatchEvent(event: CustomEvent) { selected = event.detail; } } });
  openNameCheck();
  expect(DEFAULT_PACKAGE).toBe("name-check");
  expect(selected).toBe("name-check");
});

test("package popup resets browsing and reaches pricing even when it loads late", () => {
  const events: string[] = [];
  const callbacks: (() => void)[] = [];
  let loaded = false;
  let destination = "";
  Object.assign(globalThis, {
    window: { dispatchEvent(event: Event) { events.push(event.type); }, setTimeout(callback: () => void) { callbacks.push(callback); } },
    requestAnimationFrame(callback: () => void) { callback(); },
    document: { getElementById(id: string) { return loaded ? { scrollIntoView() { destination = id; } } : null; } },
  });
  showPackages();
  expect(events).toEqual(["showPackages"]);
  expect(destination).toBe("");
  loaded = true;
  callbacks[0]?.();
  expect(destination).toBe("pricing");
});