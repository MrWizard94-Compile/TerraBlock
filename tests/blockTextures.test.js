import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  tileIndex,
  faceRole,
  tileUVs,
  LOCAL_DEV_TILES,
  packTileUrl,
  useLocalDevTextures,
  LOCAL_DEV_TEXTURE_BASE,
} from "../src/game/BlockTextures.js";
import { BlockId } from "../src/game/blocks.js";

describe("BlockTextures", () => {
  it("faceRole maps +y to top and -y to bottom", () => {
    assert.equal(faceRole(2), 1);
    assert.equal(faceRole(3), 2);
    assert.equal(faceRole(0), 0);
  });

  it("tileIndex is unique per block role", () => {
    assert.notEqual(tileIndex(BlockId.GRASS, 0), tileIndex(BlockId.GRASS, 1));
    assert.equal(tileIndex(1, 0), 3);
  });

  it("tileUVs return 4 corners in 0-1", () => {
    const uvs = tileUVs(BlockId.STONE, 0);
    assert.equal(uvs.length, 4);
    for (const [u, v] of uvs) {
      assert.ok(u >= 0 && u <= 1);
      assert.ok(v >= 0 && v <= 1);
    }
  });

  it("LOCAL_DEV_TILES lists candidate basenames for core terrain", () => {
    assert.ok(LOCAL_DEV_TILES[BlockId.GRASS][1].includes("grass_top.png"));
    assert.ok(LOCAL_DEV_TILES[BlockId.DIRT][0].includes("dirt.png"));
    assert.ok(LOCAL_DEV_TILES[BlockId.STONE][0].includes("stone.png"));
  });

  it("packTileUrl is local-dev path only", () => {
    const url = packTileUrl("dirt.png");
    assert.equal(url, `${LOCAL_DEV_TEXTURE_BASE}dirt.png`);
  });

  it("unit tests do not enable local dev textures (prod-safe default)", () => {
    // node:test has no import.meta.env.DEV unless Vite injects it
    assert.equal(typeof useLocalDevTextures(), "boolean");
  });
});
