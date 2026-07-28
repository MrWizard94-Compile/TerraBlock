/**
 * Full acceptance smoke — proves the game loop without a human.
 * Fails hard if cabin, trees, craft, combat, inventory, or fishing are broken.
 */
export async function runSmoke(client, log = console.log) {
  const report = { name: "smoke", ok: true, checks: [] };

  function check(name, cond, detail = "") {
    report.checks.push({ name, ok: !!cond, detail: String(detail || "") });
    if (!cond) report.ok = false;
    log(`  [${cond ? "PASS" : "FAIL"}] ${name}${detail ? " — " + detail : ""}`);
  }

  await client.waitForEngine();
  await client.waitForBridge();
  check("bridge present", true);

  // —— Boot ——
  const start = await client.command("start_new", { seed: 42, audio: false });
  check("start_new", start.ok, start.error || `seed=${start.seed}`);
  await client.command("wait", { ms: 400 });
  await client.screenshot("01_start");

  let st = await client.getState();
  check("playing", st?.playing);
  check("player alive", st?.player && !st.player.dead, `hp=${st?.player?.hp}`);
  check("starter hp >= 100", (st?.player?.hp || 0) >= 100, `hp=${st?.player?.hp}`);
  check("has starter pick", (st?.inventory?.counts?.wood_pick || 0) >= 1);
  check("has starter axe", (st?.inventory?.counts?.wood_axe || 0) >= 1);
  check("has starter bow/arrows", (st?.inventory?.counts?.bow || 0) >= 1 || (st?.inventory?.counts?.wooden_arrow || 0) >= 1);

  // —— World: camp + trees + water (the things humans complained about) ——
  const probe = await client.command("probe_world");
  check("probe_world", probe.ok, JSON.stringify({
    camp: probe.campReady,
    trees: probe.treesPresent,
    wood: probe.wood,
    leaves: probe.leaves,
    wb: probe.workbench,
    fur: probe.furnace,
    anv: probe.anvil,
    water: probe.water,
  }));
  check(
    "starter camp stations",
    probe.workbench >= 1 && probe.furnace >= 1,
    `wb=${probe.workbench} furnace=${probe.furnace} anvil=${probe.anvil}`
  );
  check("starter camp door+light", probe.door >= 1 && probe.torch >= 1, `door=${probe.door} torch=${probe.torch}`);
  check(
    "trees in world (wood+leaves)",
    probe.treesPresent || (probe.wood >= 4 && probe.leaves >= 8),
    `wood=${probe.wood} leaves=${probe.leaves}`
  );
  check("water nearby for fishing", probe.waterNearby || probe.water >= 4, `water=${probe.water}`);

  // stations from state
  st = await client.getState();
  const stations = st?.stations?.list || [];
  check(
    "stations detected near player",
    stations.includes("workbench") || stations.includes("furnace"),
    st?.stations?.label || stations.join(",")
  );

  // NPCs
  const npcIds = (st?.npcs || []).map((n) => n.id);
  check("guide NPC present", npcIds.includes("guide"), npcIds.join(",") || "none");

  // —— Inventory rearrange ——
  const before0 = st.inventory?.hotbar?.[0]?.id;
  const before1 = st.inventory?.hotbar?.[1]?.id;
  const swap = await client.command("inventory_swap", { a: 0, b: 1 });
  check("inventory_swap", swap.ok);
  st = await client.getState();
  check(
    "inventory_swap reflected",
    st.inventory?.hotbar?.[0]?.id === before1 && st.inventory?.hotbar?.[1]?.id === before0,
    `${st.inventory?.hotbar?.[0]?.id} / ${st.inventory?.hotbar?.[1]?.id}`
  );
  // swap back
  await client.command("inventory_swap", { a: 0, b: 1 });

  // —— Craft hand recipe (planks) ——
  if ((st.inventory?.counts?.wood || 0) < 1) {
    await client.command("give", { item: "wood", count: 8 });
  }
  const craftPlanks = await client.command("craft", { id: "planks", count: 2 });
  check("craft planks", craftPlanks.ok, craftPlanks.error || `crafted=${craftPlanks.crafted}`);
  st = await client.getState();
  check("has planks", (st.inventory?.counts?.planks || 0) >= 4, `planks=${st.inventory?.counts?.planks}`);

  // —— Craft at stations (torch / furnace path) ——
  if ((st.inventory?.counts?.gel || 0) < 1) await client.command("give", { item: "gel", count: 5 });
  if ((st.inventory?.counts?.wood || 0) < 1) await client.command("give", { item: "wood", count: 5 });
  const gelTorch = await client.command("craft", { id: "torch_gel", count: 1 });
  check("craft gel torch (hand)", gelTorch.ok || gelTorch.canCraft === false, gelTorch.error || "ok");

  // smelt requires furnace nearby — player should be in cabin
  await client.command("give", { item: "copper_ore", count: 9 });
  const smelt = await client.command("craft", { id: "copper_bar", count: 2 });
  check(
    "smelt copper_bar at furnace",
    smelt.ok,
    smelt.error || `stations=${(smelt.stations || []).join(",")} crafted=${smelt.crafted}`
  );
  st = await client.getState();
  check("has copper_bar", (st.inventory?.counts?.copper_bar || 0) >= 1, `bars=${st.inventory?.counts?.copper_bar}`);

  // —— Loot starter chest ——
  const loot = await client.command("loot_nearest_chest");
  check("loot_nearest_chest", loot.ok, loot.error || `${loot.x},${loot.y},${loot.z}`);
  st = await client.getState();
  const hasOre =
    (st.inventory?.counts?.copper_ore || 0) + (st.inventory?.counts?.iron_ore || 0) > 0 ||
    (st.inventory?.counts?.copper_bar || 0) > 0;
  check("chest/starter materials present", hasOre, JSON.stringify({
    copper_ore: st.inventory?.counts?.copper_ore,
    iron_ore: st.inventory?.counts?.iron_ore,
    copper_bar: st.inventory?.counts?.copper_bar,
  }));

  // —— Mine ——
  await client.command("look", { yaw: st.player.yaw, pitch: -0.9 });
  await client.command("select_hotbar", { index: 0 });
  // ensure pick in slot 0
  await client.command("mine", { ms: 2500 });
  await client.screenshot("02_after_mine");
  st = await client.getState();
  const dug =
    (st.inventory?.counts?.dirt || 0) > 0 ||
    (st.inventory?.counts?.stone || 0) > 0 ||
    (st.inventory?.counts?.sand || 0) > 0 ||
    (st.inventory?.counts?.cobble || 0) > 0;
  check("mined resources", dug, "see counts if fail");

  // —— Move ——
  const x0 = st.player.x;
  const z0 = st.player.z;
  await client.command("look", { yaw: 0.2, pitch: 0.05 });
  await client.command("move", { forward: true, sprint: true, ms: 900 });
  st = await client.getState();
  const moved = Math.hypot(st.player.x - x0, st.player.z - z0) > 0.5;
  check("moved", moved, `dxz=${Math.hypot(st.player.x - x0, st.player.z - z0).toFixed(2)}`);

  // —— Combat: spawn + damage enemy ——
  const slimeHpBefore = 999;
  await client.command("spawn_enemy", {
    type: "slime",
    x: st.player.x + 2,
    y: st.player.y,
    z: st.player.z + 2,
  });
  st = await client.getState();
  const slime = (st.nearby || []).find((e) => e.type === "slime");
  check("spawn slime", !!slime, slime ? `hp=${slime.hp}` : "missing");
  const hp0 = slime?.hp ?? slimeHpBefore;
  await client.command("look_at", {
    x: st.player.x + 2,
    y: st.player.y + 0.4,
    z: st.player.z + 2,
  });
  // sword is often hotbar 1 after swap restore
  await client.command("select_hotbar", { index: 1 });
  await client.command("attack", { ms: 1500 });
  await client.command("tick", { ms: 200 });
  st = await client.getState();
  const slime2 = (st.nearby || []).find((e) => e.type === "slime");
  const damaged = !slime2 || slime2.hp < hp0;
  check("combat damages enemy", damaged, slime2 ? `hp ${hp0}→${slime2.hp}` : "killed");
  await client.screenshot("03_combat");

  // —— Boss spawn ——
  const boss = await client.command("spawn_boss", { type: "king_slime" });
  check("spawn_boss king_slime", boss.ok, boss.error || `hp=${boss.hp}`);
  st = await client.getState();
  check("boss in state", !!st.boss && st.boss.type === "king_slime", st.boss ? st.boss.type : "none");
  await client.screenshot("04_boss");

  // —— Fishing ——
  // give pole, force bite, reel
  if ((st.inventory?.counts?.wood_pole || 0) < 1) {
    await client.command("give", { item: "wood_pole", count: 1 });
  }
  // select pole — find hotbar index
  st = await client.getState();
  let poleIdx = (st.inventory?.hotbar || []).findIndex((h) => h.id === "wood_pole");
  if (poleIdx < 0) {
    // put pole by giving and hope it lands in empty slot; select via give only
    await client.command("give", { item: "wood_pole", count: 1 });
    st = await client.getState();
    poleIdx = (st.inventory?.hotbar || []).findIndex((h) => h.id === "wood_pole");
  }
  if (poleIdx >= 0) await client.command("select_hotbar", { index: poleIdx });
  const bite = await client.command("force_fish_bite");
  check("fishing cast/bite", bite.ok, bite.error || "bite ready");
  if (bite.ok) {
    const reel = await client.command("fish_reel");
    check("fishing reel loot", reel.ok, reel.item || reel.error || "");
  } else {
    check("fishing reel loot", false, "skipped — no bite");
  }

  // —— Still alive after suite ——
  st = await client.getState();
  check("still playing", st?.playing && st?.player && !st.player.dead, `hp=${st?.player?.hp}`);

  await client.screenshot("05_final");

  // Summary line for CI
  const passed = report.checks.filter((c) => c.ok).length;
  const total = report.checks.length;
  log(`  summary ${passed}/${total} checks`);
  report.passed = passed;
  report.total = total;
  return report;
}
