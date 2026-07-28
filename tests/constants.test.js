import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CHUNK_SIZE,
  CHUNK_HEIGHT,
  RENDER_DISTANCE,
  FACE_VERTS,
  FACE_SHADE,
  DIRS,
  DAY_LENGTH,
  MAX_HP,
  MAX_MANA,
} from "../src/game/constants.js";

describe("constants", () => {
  it("chunk dimensions are positive powers-friendly", () => {
    assert.ok(CHUNK_SIZE > 0);
    assert.ok(CHUNK_HEIGHT > 0);
    assert.ok(RENDER_DISTANCE >= 2);
  });

  it("FACE_VERTS has 6 faces with 4 verts each", () => {
    assert.equal(FACE_VERTS.length, 6);
    for (const face of FACE_VERTS) {
      assert.equal(face.length, 4);
      for (const v of face) {
        assert.equal(v.length, 3);
      }
    }
  });

  it("FACE_SHADE and DIRS match face count", () => {
    assert.equal(FACE_SHADE.length, 6);
    assert.equal(DIRS.length, 6);
  });

  it("day length and vitals are positive", () => {
    assert.ok(DAY_LENGTH > 0);
    assert.ok(MAX_HP > 0);
    assert.ok(MAX_MANA > 0);
  });
});
