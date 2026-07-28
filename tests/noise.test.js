import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fade, lerp, hash2, valueNoise2D, fbm2D, valueNoise3D } from "../src/game/noise.js";

describe("noise", () => {
  it("fade is 0 at 0 and 1 at 1", () => {
    assert.equal(fade(0), 0);
    assert.equal(fade(1), 1);
  });

  it("lerp interpolates endpoints", () => {
    assert.equal(lerp(0, 10, 0), 0);
    assert.equal(lerp(0, 10, 1), 10);
    assert.equal(lerp(0, 10, 0.5), 5);
  });

  it("hash2 is deterministic and in [0,1)", () => {
    const a = hash2(3, 7, 42);
    const b = hash2(3, 7, 42);
    assert.equal(a, b);
    assert.ok(a >= 0 && a < 1);
    assert.notEqual(hash2(3, 7, 42), hash2(3, 8, 42));
  });

  it("valueNoise2D is deterministic and continuous-ish", () => {
    const a = valueNoise2D(1.25, 2.5, 99);
    const b = valueNoise2D(1.25, 2.5, 99);
    assert.equal(a, b);
    assert.ok(a >= 0 && a <= 1);
  });

  it("fbm2D is deterministic and normalized-ish", () => {
    const a = fbm2D(10, 20, 7, 4);
    const b = fbm2D(10, 20, 7, 4);
    assert.equal(a, b);
    assert.ok(a >= 0 && a <= 1);
  });

  it("valueNoise3D is deterministic", () => {
    const a = valueNoise3D(1.1, 2.2, 3.3, 5);
    const b = valueNoise3D(1.1, 2.2, 3.3, 5);
    assert.equal(a, b);
  });
});
