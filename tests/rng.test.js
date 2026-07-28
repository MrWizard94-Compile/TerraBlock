import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RNG, mulberry32 } from "../src/game/RNG.js";

describe("RNG", () => {
  it("mulberry32 is deterministic", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    assert.equal(a(), b());
    assert.equal(a(), b());
  });

  it("RNG next stays in [0,1)", () => {
    const r = new RNG(123);
    for (let i = 0; i < 100; i++) {
      const v = r.next();
      assert.ok(v >= 0 && v < 1);
    }
  });

  it("int respects inclusive bounds", () => {
    const r = new RNG(7);
    for (let i = 0; i < 50; i++) {
      const v = r.int(2, 5);
      assert.ok(v >= 2 && v <= 5);
    }
  });

  it("fork produces independent stream", () => {
    const r = new RNG(99);
    const f = r.fork(1);
    assert.notEqual(r.next(), f.next());
  });
});
