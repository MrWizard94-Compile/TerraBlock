import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { defaultSettings, clampSettings } from "../src/game/Settings.js";

describe("Settings", () => {
  it("defaultSettings has expected keys", () => {
    const s = defaultSettings();
    assert.ok(s.mouseSensitivity > 0);
    assert.ok(s.renderDistance >= 2);
    assert.equal(typeof s.autoSave, "boolean");
  });

  it("clampSettings clamps ranges", () => {
    const s = clampSettings({
      mouseSensitivity: 99,
      masterVolume: -1,
      renderDistance: 100,
      fov: 10,
    });
    assert.equal(s.mouseSensitivity, 3);
    assert.equal(s.masterVolume, 0);
    assert.equal(s.renderDistance, 8);
    assert.equal(s.fov, 50);
  });
});
