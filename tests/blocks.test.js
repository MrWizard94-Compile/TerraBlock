import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BlockId,
  BLOCKS,
  isSolid,
  isTransparent,
  getBlockColor,
  blockDrop,
} from "../src/game/blocks.js";

describe("blocks", () => {
  it("air is non-solid and transparent", () => {
    assert.equal(isSolid(BlockId.AIR), false);
    assert.equal(isTransparent(BlockId.AIR), true);
  });

  it("stone is solid and opaque", () => {
    assert.equal(isSolid(BlockId.STONE), true);
    assert.equal(isTransparent(BlockId.STONE), false);
  });

  it("bedrock is unbreakable", () => {
    assert.equal(BLOCKS[BlockId.BEDROCK].hardness, Infinity);
  });

  it("getBlockColor returns RGB triples", () => {
    const c = getBlockColor(BlockId.GRASS, 2);
    assert.equal(c.length, 3);
    assert.ok(c.every((n) => n >= 0 && n <= 255));
  });

  it("grass uses distinct top color", () => {
    const top = getBlockColor(BlockId.GRASS, 2);
    const side = getBlockColor(BlockId.GRASS, 0);
    assert.notDeepEqual(top, side);
  });

  it("blockDrop returns dirt for dirt blocks", () => {
    const d = blockDrop(BlockId.DIRT);
    assert.deepEqual(d, { item: "dirt", count: 1 });
  });

  it("blockDrop returns null for bedrock", () => {
    assert.equal(blockDrop(BlockId.BEDROCK), null);
  });

  it("every solid block has hardness number", () => {
    for (const def of Object.values(BLOCKS)) {
      assert.equal(typeof def.hardness, "number");
    }
  });
});
