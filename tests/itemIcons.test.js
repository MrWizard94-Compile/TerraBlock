import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

// Canvas not in node by default — stub minimal canvas for icon gen
before(() => {
  if (typeof globalThis.document === "undefined") {
    globalThis.document = {
      createElement: () => {
        const data = new Uint8ClampedArray(32 * 32 * 4);
        return {
          width: 32,
          height: 32,
          getContext: () => ({
            createImageData: () => ({ data, width: 32, height: 32 }),
            putImageData: () => {},
          }),
          toDataURL: () => "data:image/png;base64,test",
        };
      },
    };
  }
});

describe("ItemIcons", () => {
  it("generates stable data URLs for known items", async () => {
    const { itemIconUrl } = await import("../src/game/ItemIcons.js");
    const a = itemIconUrl("wood_pick");
    const b = itemIconUrl("wood_pick");
    assert.equal(a, b);
    assert.ok(a.startsWith("data:image/png"));
  });

  it("handles unknown items", async () => {
    const { itemIconUrl } = await import("../src/game/ItemIcons.js");
    const u = itemIconUrl("not_real_item_xyz");
    assert.ok(u.startsWith("data:image/png"));
  });

  it("produces html snippet", async () => {
    const { itemIconHtml } = await import("../src/game/ItemIcons.js");
    const h = itemIconHtml("torch");
    assert.ok(h.includes("slot-icon"));
    assert.ok(h.includes("background-image"));
  });
});
