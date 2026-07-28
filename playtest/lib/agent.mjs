/**
 * Autonomous playtest agent — observes getState(), acts via commands, captures screenshots.
 */

export class PlaytestAgent {
  /**
   * @param {import('./client.mjs').PlaytestClient} client
   * @param {{ log?: (msg: string) => void }} [opts]
   */
  constructor(client, opts = {}) {
    this.client = client;
    this.log = opts.log || console.log;
    this.history = [];
  }

  /**
   * Run an autonomous session with a simple goal-driven policy.
   * @param {{
   *   seed?: number,
   *   maxSteps?: number,
   *   goals?: string[],
   *   screenshotEvery?: number
   * }} opts
   */
  async run(opts = {}) {
    const seed = opts.seed ?? 42;
    const maxSteps = opts.maxSteps ?? 40;
    const screenshotEvery = opts.screenshotEvery ?? 3;
    const goals = opts.goals || ["alive", "move", "mine", "craft_planks", "survive"];

    this.log(`[agent] starting seed=${seed} steps=${maxSteps}`);
    await this.client.waitForEngine();
    await this.client.waitForBridge();

    const r = await this.client.command("start_new", { seed, audio: false });
    if (!r.ok) throw new Error(`start_new failed: ${r.error}`);
    await this.client.screenshot("start");

    const results = { ok: true, steps: [], failures: [], goalsCompleted: [] };
    const completed = new Set();

    for (let step = 0; step < maxSteps; step++) {
      const state = await this.client.getState();
      if (!state?.playing) {
        results.failures.push(`step ${step}: not playing`);
        results.ok = false;
        break;
      }

      // Goal checks
      if (state.player && !state.player.dead) completed.add("alive");
      if (state.player && (Math.abs(state.player.x) > 1 || Math.abs(state.player.z) > 1)) {
        completed.add("move");
      }
      if ((state.inventory?.counts?.dirt || 0) > 0 || (state.inventory?.counts?.stone || 0) > 0) {
        completed.add("mine");
      }
      if ((state.inventory?.counts?.planks || 0) > 0) completed.add("craft_planks");
      if (state.player && state.player.hp > 0 && step > 5) completed.add("survive");

      const action = chooseAction(state, completed, step);
      this.log(`[agent] step=${step} action=${action.name} ${JSON.stringify(action.args || {})}`);

      const outcome = await this.execute(action, state);
      results.steps.push({ step, action: action.name, outcome, hp: state.player?.hp });

      if (step % screenshotEvery === 0 || action.name === "fail_safe") {
        await this.client.screenshot(`step_${step}_${action.name}`);
      }

      if (state.player?.dead) {
        await this.client.command("respawn");
        await this.client.screenshot("respawn");
      }

      // Early success if all goals met
      if (goals.every((g) => completed.has(g))) {
        this.log("[agent] all goals completed");
        break;
      }
    }

    results.goalsCompleted = [...completed];
    for (const g of goals) {
      if (!completed.has(g)) {
        results.failures.push(`goal not met: ${g}`);
        results.ok = false;
      }
    }

    await this.client.screenshot("final");
    const finalState = await this.client.getState();
    results.final = {
      hp: finalState?.player?.hp,
      pos: finalState?.player
        ? { x: finalState.player.x, y: finalState.player.y, z: finalState.player.z }
        : null,
      inventory: finalState?.inventory?.counts,
      kills: finalState?.player?.killCount,
    };

    this.log(`[agent] done ok=${results.ok} goals=${results.goalsCompleted.join(",")}`);
    return results;
  }

  async execute(action, state) {
    switch (action.name) {
      case "look_down":
        return this.client.command("look", {
          yaw: state.player.yaw,
          pitch: -0.9,
        });
      case "look_forward":
        return this.client.command("look", {
          yaw: state.player.yaw,
          pitch: 0.05,
        });
      case "move_forward":
        return this.client.command("move", { forward: true, sprint: true, ms: action.ms || 600 });
      case "strafe":
        return this.client.command("move", {
          left: action.dir < 0,
          right: action.dir > 0,
          ms: 400,
        });
      case "jump_forward":
        return this.client.command("move", { forward: true, jump: true, ms: 500 });
      case "mine_block":
        if (action.lookAt) {
          await this.client.command("look_at", action.lookAt);
        } else {
          await this.client.command("look", { yaw: state.player.yaw, pitch: -0.7 });
        }
        await this.client.command("select_hotbar", { index: 0 }); // pickaxe usually slot 0
        return this.client.command("mine", { ms: action.ms || 2500 });
      case "craft":
        return this.client.command("craft", { id: action.id });
      case "place_torch": {
        // find torch in hotbar
        const hb = state.inventory?.hotbar || [];
        const idx = hb.findIndex((s) => s.id === "torch");
        if (idx >= 0) await this.client.command("select_hotbar", { index: idx });
        await this.client.command("look", { yaw: state.player.yaw, pitch: -0.4 });
        return this.client.command("place");
      }
      case "attack_nearest": {
        const e = state.nearby?.[0];
        if (!e) return { ok: false, error: "no enemy" };
        await this.client.command("look_at", { x: e.x, y: e.y + 0.8, z: e.z });
        // select sword if present
        const hb = state.inventory?.hotbar || [];
        const sword = hb.findIndex((s) => s.id && String(s.id).includes("sword"));
        if (sword >= 0) await this.client.command("select_hotbar", { index: sword });
        return this.client.command("attack", { ms: 800 });
      }
      case "heal": {
        const hb = state.inventory?.hotbar || [];
        const food = hb.findIndex((s) => s.id === "mushroom" || s.id === "cooked_fish");
        if (food >= 0) {
          await this.client.command("select_hotbar", { index: food });
          return this.client.command("use");
        }
        return { ok: false, error: "no food" };
      }
      case "wait":
        return this.client.command("wait", { ms: action.ms || 200 });
      default:
        return { ok: false, error: `unknown action ${action.name}` };
    }
  }
}

/**
 * Simple reactive policy.
 * @param {object} state
 * @param {Set<string>} completed
 * @param {number} step
 */
export function chooseAction(state, completed, step) {
  const p = state.player;
  if (!p) return { name: "wait", ms: 100 };

  // Emergency heal
  if (p.hp < p.maxHp * 0.4) {
    return { name: "heal" };
  }

  // Threat: nearby enemy
  const foe = state.nearby?.[0];
  if (foe && foe.dist < 8 && !foe.boss) {
    if (foe.dist < 3.5) return { name: "attack_nearest" };
    return { name: "look_forward" };
  }

  // Craft planks if we have wood and no planks yet
  if (!completed.has("craft_planks") && (state.inventory?.counts?.wood || 0) >= 1) {
    if (state.inventory.craftable?.includes("planks")) {
      return { name: "craft", id: "planks" };
    }
  }

  // Mine if looking at diggable block or need resources
  if (!completed.has("mine") || step % 7 === 0) {
    if (state.look && state.look.name !== "Bedrock" && state.look.name !== "Air") {
      return {
        name: "mine_block",
        ms: 2200,
        lookAt: { x: state.look.x + 0.5, y: state.look.y + 0.5, z: state.look.z + 0.5 },
      };
    }
    return { name: "look_down" };
  }

  // Explore
  if (step % 5 === 2) return { name: "strafe", dir: step % 2 === 0 ? 1 : -1 };
  if (step % 11 === 0) return { name: "jump_forward" };
  if (step % 13 === 0 && (state.inventory?.counts?.torch || 0) > 0) {
    return { name: "place_torch" };
  }

  return { name: "move_forward", ms: 700 };
}
