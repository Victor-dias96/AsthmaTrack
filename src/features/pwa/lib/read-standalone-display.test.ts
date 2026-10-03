import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { readStandaloneDisplay } from "./read-standalone-display";

describe("readStandaloneDisplay", () => {
  test("uses display-mode standalone", () => {
    assert.equal(
      readStandaloneDisplay({
        matchMedia: () => ({ matches: true }),
      }),
      true
    );
  });

  test("does not treat a browser tab as installed", () => {
    assert.equal(
      readStandaloneDisplay({
        matchMedia: () => ({ matches: false }),
        navigator: {},
      }),
      false
    );
  });

  test("accepts navigator.standalone only when it is true", () => {
    assert.equal(
      readStandaloneDisplay({
        matchMedia: () => ({ matches: false }),
        navigator: { standalone: true },
      }),
      true
    );
    assert.equal(
      readStandaloneDisplay({
        matchMedia: () => ({ matches: false }),
        navigator: { standalone: false },
      }),
      false
    );
  });

  test("survives a matchMedia failure", () => {
    assert.equal(
      readStandaloneDisplay({
        matchMedia: () => {
          throw new Error("unsupported");
        },
        navigator: {},
      }),
      false
    );
  });
});
