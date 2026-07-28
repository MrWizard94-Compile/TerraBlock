/**
 * Crafting recipes — expanded progression through hardmode.
 */

/** @typedef {{ item: string, count: number }} ItemStack */
/** @typedef {{ id: string, result: ItemStack, cost: ItemStack[], station?: string }} Recipe */

/** @type {Recipe[]} */
export const RECIPES = [
  // basic (hand)
  { id: "planks", result: { item: "planks", count: 4 }, cost: [{ item: "wood", count: 1 }], category: "basic", station: "none" },
  { id: "torch_gel", result: { item: "torch", count: 3 }, cost: [{ item: "gel", count: 1 }, { item: "wood", count: 1 }], category: "basic", station: "none" },
  { id: "torch", result: { item: "torch", count: 4 }, cost: [{ item: "coal", count: 1 }, { item: "wood", count: 1 }], category: "basic", station: "none" },
  { id: "workbench", result: { item: "workbench", count: 1 }, cost: [{ item: "wood", count: 10 }], category: "basic", station: "none" },
  { id: "platform", result: { item: "platform", count: 2 }, cost: [{ item: "wood", count: 1 }], category: "basic", station: "none" },
  { id: "cobble", result: { item: "cobble", count: 1 }, cost: [{ item: "stone", count: 1 }], category: "basic", station: "none" },

  // workbench — furniture, wood gear, stations
  { id: "furnace", result: { item: "furnace", count: 1 }, cost: [{ item: "stone", count: 20 }, { item: "torch", count: 4 }], category: "basic", station: "workbench" },
  { id: "chair", result: { item: "chair", count: 1 }, cost: [{ item: "wood", count: 4 }], category: "basic", station: "workbench" },
  { id: "table", result: { item: "table", count: 1 }, cost: [{ item: "wood", count: 8 }], category: "basic", station: "workbench" },
  { id: "door", result: { item: "door", count: 1 }, cost: [{ item: "wood", count: 6 }], category: "basic", station: "workbench" },
  { id: "bench", result: { item: "bench", count: 1 }, cost: [{ item: "wood", count: 6 }], category: "basic", station: "workbench" },
  { id: "bed", result: { item: "bed", count: 1 }, cost: [{ item: "wood", count: 12 }, { item: "gel", count: 5 }], category: "basic", station: "workbench" },
  { id: "brick", result: { item: "brick", count: 2 }, cost: [{ item: "stone", count: 2 }], category: "basic", station: "workbench" },
  { id: "chest_item", result: { item: "chest_item", count: 1 }, cost: [{ item: "wood", count: 8 }, { item: "iron_bar", count: 2 }], category: "basic", station: "workbench" },
  { id: "wood_pole", result: { item: "wood_pole", count: 1 }, cost: [{ item: "wood", count: 10 }], category: "tools", station: "workbench" },
  { id: "wood_pick", result: { item: "wood_pick", count: 1 }, cost: [{ item: "wood", count: 8 }], category: "tools", station: "workbench" },
  { id: "wood_sword", result: { item: "wood_sword", count: 1 }, cost: [{ item: "wood", count: 6 }], category: "weapons", station: "workbench" },
  { id: "wood_axe", result: { item: "wood_axe", count: 1 }, cost: [{ item: "wood", count: 8 }], category: "tools", station: "workbench" },
  { id: "wood_hammer", result: { item: "wood_hammer", count: 1 }, cost: [{ item: "wood", count: 8 }], category: "tools", station: "workbench" },
  { id: "stone_pick", result: { item: "stone_pick", count: 1 }, cost: [{ item: "stone", count: 12 }, { item: "wood", count: 4 }], category: "tools", station: "workbench" },
  { id: "wood_helmet", result: { item: "wood_helmet", count: 1 }, cost: [{ item: "wood", count: 12 }], category: "armor", station: "workbench" },
  { id: "wood_chest", result: { item: "wood_chest", count: 1 }, cost: [{ item: "wood", count: 20 }], category: "armor", station: "workbench" },
  { id: "wood_legs", result: { item: "wood_legs", count: 1 }, cost: [{ item: "wood", count: 16 }], category: "armor", station: "workbench" },
  { id: "bow", result: { item: "bow", count: 1 }, cost: [{ item: "wood", count: 10 }, { item: "gel", count: 5 }], category: "weapons", station: "workbench" },
  { id: "wooden_arrow", result: { item: "wooden_arrow", count: 25 }, cost: [{ item: "wood", count: 1 }, { item: "stone", count: 1 }], category: "weapons", station: "workbench" },
  { id: "flaming_arrow", result: { item: "flaming_arrow", count: 10 }, cost: [{ item: "wooden_arrow", count: 10 }, { item: "torch", count: 1 }], category: "weapons", station: "workbench" },

  // furnace — smelt bars + glass + cook
  { id: "copper_bar", result: { item: "copper_bar", count: 1 }, cost: [{ item: "copper_ore", count: 3 }], category: "basic", station: "furnace" },
  { id: "iron_bar", result: { item: "iron_bar", count: 1 }, cost: [{ item: "iron_ore", count: 3 }], category: "basic", station: "furnace" },
  { id: "silver_bar", result: { item: "silver_bar", count: 1 }, cost: [{ item: "silver_ore", count: 3 }], category: "basic", station: "furnace" },
  { id: "gold_bar", result: { item: "gold_bar", count: 1 }, cost: [{ item: "gold_ore", count: 3 }], category: "basic", station: "furnace" },
  { id: "demonite_bar", result: { item: "demonite_bar", count: 1 }, cost: [{ item: "demonite", count: 3 }], category: "basic", station: "furnace" },
  { id: "mythril_bar", result: { item: "mythril_bar", count: 1 }, cost: [{ item: "mythril_ore", count: 3 }], category: "basic", station: "furnace" },
  { id: "adamantite_bar", result: { item: "adamantite_bar", count: 1 }, cost: [{ item: "adamantite_ore", count: 3 }], category: "basic", station: "furnace" },
  { id: "chlorophyte_bar", result: { item: "chlorophyte_bar", count: 1 }, cost: [{ item: "chlorophyte_ore", count: 3 }], category: "basic", station: "furnace" },
  { id: "glass", result: { item: "glass", count: 1 }, cost: [{ item: "sand", count: 2 }], category: "basic", station: "furnace" },
  { id: "bottle", result: { item: "bottle", count: 2 }, cost: [{ item: "glass", count: 1 }], category: "potions", station: "furnace" },
  { id: "cooked_fish", result: { item: "cooked_fish", count: 1 }, cost: [{ item: "bass", count: 1 }], category: "potions", station: "furnace" },
  { id: "cooked_trout", result: { item: "cooked_fish", count: 1 }, cost: [{ item: "trout", count: 1 }], category: "potions", station: "furnace" },

  // hellforge — hellstone
  { id: "hellstone_bar", result: { item: "hellstone_bar", count: 1 }, cost: [{ item: "hellstone", count: 3 }, { item: "ash", count: 1 }], category: "basic", station: "hellforge" },

  // anvil — metal tools / weapons / armor (bars)
  { id: "anvil", result: { item: "anvil", count: 1 }, cost: [{ item: "iron_bar", count: 5 }], category: "basic", station: "workbench" },
  { id: "copper_pick", result: { item: "copper_pick", count: 1 }, cost: [{ item: "copper_bar", count: 8 }, { item: "wood", count: 3 }], category: "tools", station: "anvil" },
  { id: "copper_sword", result: { item: "copper_sword", count: 1 }, cost: [{ item: "copper_bar", count: 6 }, { item: "wood", count: 2 }], category: "weapons", station: "anvil" },
  { id: "copper_axe", result: { item: "copper_axe", count: 1 }, cost: [{ item: "copper_bar", count: 6 }, { item: "wood", count: 3 }], category: "tools", station: "anvil" },
  { id: "copper_helmet", result: { item: "copper_helmet", count: 1 }, cost: [{ item: "copper_bar", count: 10 }], category: "armor", station: "anvil" },
  { id: "copper_chest", result: { item: "copper_chest", count: 1 }, cost: [{ item: "copper_bar", count: 16 }], category: "armor", station: "anvil" },
  { id: "copper_legs", result: { item: "copper_legs", count: 1 }, cost: [{ item: "copper_bar", count: 12 }], category: "armor", station: "anvil" },
  { id: "silver_sword", result: { item: "silver_sword", count: 1 }, cost: [{ item: "silver_bar", count: 8 }], category: "weapons", station: "anvil" },
  { id: "silver_helmet", result: { item: "silver_helmet", count: 1 }, cost: [{ item: "silver_bar", count: 10 }], category: "armor", station: "anvil" },
  { id: "silver_chest", result: { item: "silver_chest", count: 1 }, cost: [{ item: "silver_bar", count: 16 }], category: "armor", station: "anvil" },
  { id: "silver_legs", result: { item: "silver_legs", count: 1 }, cost: [{ item: "silver_bar", count: 12 }], category: "armor", station: "anvil" },
  { id: "iron_pick", result: { item: "iron_pick", count: 1 }, cost: [{ item: "iron_bar", count: 10 }, { item: "wood", count: 3 }], category: "tools", station: "anvil" },
  { id: "iron_sword", result: { item: "iron_sword", count: 1 }, cost: [{ item: "iron_bar", count: 8 }], category: "weapons", station: "anvil" },
  { id: "iron_axe", result: { item: "iron_axe", count: 1 }, cost: [{ item: "iron_bar", count: 8 }, { item: "wood", count: 3 }], category: "tools", station: "anvil" },
  { id: "iron_hammer", result: { item: "iron_hammer", count: 1 }, cost: [{ item: "iron_bar", count: 8 }, { item: "wood", count: 3 }], category: "tools", station: "anvil" },
  { id: "silver_pick", result: { item: "silver_pick", count: 1 }, cost: [{ item: "silver_bar", count: 10 }, { item: "wood", count: 3 }], category: "tools", station: "anvil" },
  { id: "gold_pick", result: { item: "gold_pick", count: 1 }, cost: [{ item: "gold_bar", count: 10 }, { item: "wood", count: 3 }], category: "tools", station: "anvil" },
  { id: "gold_sword", result: { item: "gold_sword", count: 1 }, cost: [{ item: "gold_bar", count: 8 }], category: "weapons", station: "anvil" },
  { id: "gold_bow", result: { item: "gold_bow", count: 1 }, cost: [{ item: "gold_bar", count: 8 }, { item: "wood", count: 6 }], category: "weapons", station: "anvil" },
  { id: "crystal_pick", result: { item: "crystal_pick", count: 1 }, cost: [{ item: "crystal", count: 12 }, { item: "gold_bar", count: 4 }], category: "tools", station: "anvil" },
  { id: "nightmare_pick", result: { item: "nightmare_pick", count: 1 }, cost: [{ item: "demonite_bar", count: 12 }, { item: "shadow_scale", count: 6 }], category: "tools", station: "anvil" },
  { id: "mythril_pick", result: { item: "mythril_pick", count: 1 }, cost: [{ item: "mythril_bar", count: 12 }, { item: "soul_of_light", count: 5 }], category: "tools", station: "anvil" },
  { id: "adamantite_pick", result: { item: "adamantite_pick", count: 1 }, cost: [{ item: "adamantite_bar", count: 12 }, { item: "soul_of_night", count: 5 }], category: "tools", station: "anvil" },
  { id: "chlorophyte_pick", result: { item: "chlorophyte_pick", count: 1 }, cost: [{ item: "chlorophyte_bar", count: 14 }], category: "tools", station: "anvil" },
  { id: "grappling_hook", result: { item: "grappling_hook", count: 1 }, cost: [{ item: "iron_bar", count: 8 }, { item: "gel", count: 20 }], category: "tools", station: "anvil" },
  { id: "reinforced_pole", result: { item: "reinforced_pole", count: 1 }, cost: [{ item: "iron_bar", count: 6 }, { item: "wood", count: 6 }], category: "tools", station: "anvil" },
  { id: "ivy_whip", result: { item: "ivy_whip", count: 1 }, cost: [{ item: "vine", count: 20 }, { item: "jungle_spores", count: 12 }], category: "tools", station: "anvil" },
  { id: "crystal_bow", result: { item: "crystal_bow", count: 1 }, cost: [{ item: "crystal", count: 8 }, { item: "wood", count: 6 }], category: "weapons", station: "anvil" },
  { id: "magic_staff", result: { item: "magic_staff", count: 1 }, cost: [{ item: "crystal", count: 6 }, { item: "wood", count: 4 }], category: "weapons", station: "anvil" },
  { id: "night_edge", result: { item: "night_edge", count: 1 }, cost: [{ item: "shadow_scale", count: 8 }, { item: "demonite_bar", count: 10 }, { item: "crystal", count: 4 }], category: "weapons", station: "anvil" },
  { id: "demon_scythe", result: { item: "demon_scythe", count: 1 }, cost: [{ item: "shadow_scale", count: 10 }, { item: "hellstone_bar", count: 8 }, { item: "crystal", count: 6 }], category: "weapons", station: "anvil" },
  { id: "excalibur", result: { item: "excalibur", count: 1 }, cost: [{ item: "hallowed_bar", count: 12 }], category: "weapons", station: "anvil" },
  { id: "true_excalibur", result: { item: "true_excalibur", count: 1 }, cost: [{ item: "excalibur", count: 1 }, { item: "chlorophyte_bar", count: 12 }], category: "weapons", station: "anvil" },
  { id: "terra_blade", result: { item: "terra_blade", count: 1 }, cost: [{ item: "true_excalibur", count: 1 }, { item: "broken_hero_sword", count: 1 }], category: "weapons", station: "anvil" },
  { id: "starfury", result: { item: "starfury", count: 1 }, cost: [{ item: "crystal", count: 15 }, { item: "gold_bar", count: 8 }, { item: "lens", count: 4 }], category: "weapons", station: "anvil" },
  { id: "crystal_storm", result: { item: "crystal_storm", count: 1 }, cost: [{ item: "crystal", count: 20 }, { item: "soul_of_light", count: 10 }], category: "weapons", station: "anvil" },
  { id: "megashark", result: { item: "megashark", count: 1 }, cost: [{ item: "minishark", count: 1 }, { item: "soul_of_might", count: 20 }, { item: "shark_fin", count: 5 }], category: "weapons", station: "anvil" },
  { id: "summon_staff", result: { item: "summon_staff", count: 1 }, cost: [{ item: "gel", count: 100 }, { item: "gold_bar", count: 8 }], category: "weapons", station: "anvil" },
  { id: "iron_helmet", result: { item: "iron_helmet", count: 1 }, cost: [{ item: "iron_bar", count: 12 }], category: "armor", station: "anvil" },
  { id: "iron_chest", result: { item: "iron_chest", count: 1 }, cost: [{ item: "iron_bar", count: 20 }], category: "armor", station: "anvil" },
  { id: "iron_legs", result: { item: "iron_legs", count: 1 }, cost: [{ item: "iron_bar", count: 16 }], category: "armor", station: "anvil" },
  { id: "gold_helmet", result: { item: "gold_helmet", count: 1 }, cost: [{ item: "gold_bar", count: 12 }], category: "armor", station: "anvil" },
  { id: "gold_chest", result: { item: "gold_chest", count: 1 }, cost: [{ item: "gold_bar", count: 20 }], category: "armor", station: "anvil" },
  { id: "gold_legs", result: { item: "gold_legs", count: 1 }, cost: [{ item: "gold_bar", count: 16 }], category: "armor", station: "anvil" },
  { id: "shadow_helmet", result: { item: "shadow_helmet", count: 1 }, cost: [{ item: "shadow_scale", count: 8 }, { item: "demonite_bar", count: 8 }], category: "armor", station: "anvil" },
  { id: "shadow_chest", result: { item: "shadow_chest", count: 1 }, cost: [{ item: "shadow_scale", count: 14 }, { item: "demonite_bar", count: 14 }], category: "armor", station: "anvil" },
  { id: "shadow_legs", result: { item: "shadow_legs", count: 1 }, cost: [{ item: "shadow_scale", count: 10 }, { item: "demonite_bar", count: 10 }], category: "armor", station: "anvil" },
  { id: "molten_helmet", result: { item: "molten_helmet", count: 1 }, cost: [{ item: "hellstone_bar", count: 10 }], category: "armor", station: "anvil" },
  { id: "molten_chest", result: { item: "molten_chest", count: 1 }, cost: [{ item: "hellstone_bar", count: 20 }], category: "armor", station: "anvil" },
  { id: "molten_legs", result: { item: "molten_legs", count: 1 }, cost: [{ item: "hellstone_bar", count: 15 }], category: "armor", station: "anvil" },
  { id: "mythril_helmet", result: { item: "mythril_helmet", count: 1 }, cost: [{ item: "mythril_bar", count: 10 }], category: "armor", station: "anvil" },
  { id: "mythril_chest", result: { item: "mythril_chest", count: 1 }, cost: [{ item: "mythril_bar", count: 20 }], category: "armor", station: "anvil" },
  { id: "mythril_legs", result: { item: "mythril_legs", count: 1 }, cost: [{ item: "mythril_bar", count: 15 }], category: "armor", station: "anvil" },
  { id: "adamantite_helmet", result: { item: "adamantite_helmet", count: 1 }, cost: [{ item: "adamantite_bar", count: 10 }], category: "armor", station: "anvil" },
  { id: "adamantite_chest", result: { item: "adamantite_chest", count: 1 }, cost: [{ item: "adamantite_bar", count: 20 }], category: "armor", station: "anvil" },
  { id: "adamantite_legs", result: { item: "adamantite_legs", count: 1 }, cost: [{ item: "adamantite_bar", count: 15 }], category: "armor", station: "anvil" },
  { id: "chlorophyte_helmet", result: { item: "chlorophyte_helmet", count: 1 }, cost: [{ item: "chlorophyte_bar", count: 10 }], category: "armor", station: "anvil" },
  { id: "chlorophyte_chest", result: { item: "chlorophyte_chest", count: 1 }, cost: [{ item: "chlorophyte_bar", count: 20 }], category: "armor", station: "anvil" },
  { id: "chlorophyte_legs", result: { item: "chlorophyte_legs", count: 1 }, cost: [{ item: "chlorophyte_bar", count: 15 }], category: "armor", station: "anvil" },
  { id: "beetle_helmet", result: { item: "beetle_helmet", count: 1 }, cost: [{ item: "beetle_husks", count: 8 }, { item: "chlorophyte_bar", count: 8 }], category: "armor", station: "anvil" },
  { id: "beetle_chest", result: { item: "beetle_chest", count: 1 }, cost: [{ item: "beetle_husks", count: 16 }, { item: "chlorophyte_bar", count: 12 }], category: "armor", station: "anvil" },
  { id: "beetle_legs", result: { item: "beetle_legs", count: 1 }, cost: [{ item: "beetle_husks", count: 12 }, { item: "chlorophyte_bar", count: 10 }], category: "armor", station: "anvil" },
  { id: "solar_helmet", result: { item: "solar_helmet", count: 1 }, cost: [{ item: "luminite", count: 12 }, { item: "solar_fragment", count: 10 }], category: "armor", station: "anvil" },
  { id: "solar_chest", result: { item: "solar_chest", count: 1 }, cost: [{ item: "luminite", count: 20 }, { item: "solar_fragment", count: 16 }], category: "armor", station: "anvil" },
  { id: "solar_legs", result: { item: "solar_legs", count: 1 }, cost: [{ item: "luminite", count: 16 }, { item: "solar_fragment", count: 12 }], category: "armor", station: "anvil" },

  // accessories
  { id: "hermes_boots", result: { item: "hermes_boots", count: 1 }, cost: [{ item: "silk", count: 10 }, { item: "gold_ore", count: 8 }] },
  { id: "cloud_bottle", result: { item: "cloud_bottle", count: 1 }, cost: [{ item: "cloud", count: 20 }, { item: "glass", count: 5 }] },
  { id: "band_regen", result: { item: "band_regen", count: 1 }, cost: [{ item: "life_crystal", count: 1 }, { item: "silver_ore", count: 10 }] },
  { id: "band_starpower", result: { item: "band_starpower", count: 1 }, cost: [{ item: "mana_crystal", count: 1 }, { item: "crystal", count: 8 }] },
  { id: "lucky_horseshoe", result: { item: "lucky_horseshoe", count: 1 }, cost: [{ item: "gold_ore", count: 15 }, { item: "cloud", count: 10 }] },
  { id: "obsidianskin", result: { item: "obsidianskin", count: 1 }, cost: [{ item: "hellstone", count: 10 }, { item: "ash", count: 20 }] },
  { id: "shaman_charm", result: { item: "shaman_charm", count: 1 }, cost: [{ item: "bone", count: 30 }, { item: "jungle_spores", count: 8 }] },
  { id: "avenger_emblem", result: { item: "avenger_emblem", count: 1 }, cost: [{ item: "warrior_emblem", count: 1 }, { item: "ranger_emblem", count: 1 }, { item: "sorcerer_emblem", count: 1 }] },
  { id: "destroyer_emblem", result: { item: "destroyer_emblem", count: 1 }, cost: [{ item: "avenger_emblem", count: 1 }, { item: "soul_of_might", count: 10 }] },
  { id: "wings_angel", result: { item: "wings_angel", count: 1 }, cost: [{ item: "soul_of_flight", count: 20 }, { item: "feather", count: 10 }] },
  { id: "wings_demon", result: { item: "wings_demon", count: 1 }, cost: [{ item: "soul_of_flight", count: 20 }, { item: "shadow_scale", count: 15 }] },

  // potions
  { id: "healing_potion", result: { item: "healing_potion", count: 1 }, cost: [{ item: "mushroom", count: 2 }, { item: "gel", count: 2 }, { item: "bottle", count: 1 }] },
  { id: "mana_potion", result: { item: "mana_potion", count: 1 }, cost: [{ item: "gel", count: 2 }, { item: "crystal", count: 1 }, { item: "bottle", count: 1 }] },
  { id: "ironskin_potion", result: { item: "ironskin_potion", count: 1 }, cost: [{ item: "iron_ore", count: 1 }, { item: "mushroom", count: 1 }, { item: "bottle", count: 1 }] },
  { id: "regeneration_potion", result: { item: "regeneration_potion", count: 1 }, cost: [{ item: "mushroom", count: 2 }, { item: "daybloom", count: 1 }, { item: "bottle", count: 1 }] },
  { id: "swiftness_potion", result: { item: "swiftness_potion", count: 1 }, cost: [{ item: "gel", count: 2 }, { item: "daybloom", count: 1 }, { item: "bottle", count: 1 }] },
  { id: "shine_potion", result: { item: "shine_potion", count: 1 }, cost: [{ item: "torch", count: 1 }, { item: "gel", count: 1 }, { item: "bottle", count: 1 }] },
  { id: "mining_potion", result: { item: "mining_potion", count: 1 }, cost: [{ item: "coal", count: 2 }, { item: "bottle", count: 1 }] },
  { id: "recall_potion", result: { item: "recall_potion", count: 1 }, cost: [{ item: "specular_fish", count: 1 }, { item: "bottle", count: 1 }] },
  { id: "daybloom", result: { item: "daybloom", count: 1 }, cost: [{ item: "bloom_seeds", count: 1 }, { item: "dirt", count: 1 }], category: "potions", station: "none" },

  // boss summons
  { id: "suspicious_eye", result: { item: "suspicious_eye", count: 1 }, cost: [{ item: "lens", count: 6 }, { item: "gel", count: 10 }] },
  { id: "slime_crown", result: { item: "slime_crown", count: 1 }, cost: [{ item: "gel", count: 30 }, { item: "gold_ore", count: 4 }] },
  { id: "worm_food", result: { item: "worm_food", count: 1 }, cost: [{ item: "mushroom", count: 5 }, { item: "gel", count: 15 }, { item: "stone", count: 20 }] },
  { id: "bloody_spine", result: { item: "bloody_spine", count: 1 }, cost: [{ item: "bone", count: 10 }, { item: "gel", count: 15 }, { item: "tissue_sample", count: 0 }] },
  { id: "bloody_spine2", result: { item: "bloody_spine", count: 1 }, cost: [{ item: "bone", count: 15 }, { item: "mushroom", count: 8 }, { item: "gel", count: 20 }] },
  { id: "abeemination", result: { item: "abeemination", count: 1 }, cost: [{ item: "honey", count: 5 }, { item: "hive", count: 5 }, { item: "stinger", count: 5 }] },
  { id: "abeemination2", result: { item: "abeemination", count: 1 }, cost: [{ item: "vine", count: 10 }, { item: "gel", count: 20 }, { item: "gold_ore", count: 5 }] },
  { id: "clothier_voodoo", result: { item: "clothier_voodoo", count: 1 }, cost: [{ item: "bone", count: 20 }, { item: "shadow_scale", count: 5 }] },
  { id: "guide_voodoo", result: { item: "guide_voodoo", count: 1 }, cost: [{ item: "hellstone", count: 10 }, { item: "bone", count: 10 }, { item: "ash", count: 20 }] },
  { id: "mechanical_eye", result: { item: "mechanical_eye", count: 1 }, cost: [{ item: "lens", count: 3 }, { item: "iron_ore", count: 5 }, { item: "soul_of_light", count: 5 }] },
  { id: "mechanical_worm", result: { item: "mechanical_worm", count: 1 }, cost: [{ item: "iron_ore", count: 5 }, { item: "soul_of_night", count: 6 }, { item: "rotten_chunk", count: 6 }] },
  { id: "mechanical_worm2", result: { item: "mechanical_worm", count: 1 }, cost: [{ item: "iron_ore", count: 10 }, { item: "soul_of_night", count: 6 }, { item: "gel", count: 20 }] },
  { id: "mechanical_skull", result: { item: "mechanical_skull", count: 1 }, cost: [{ item: "bone", count: 30 }, { item: "iron_ore", count: 5 }, { item: "soul_of_night", count: 5 }] },
  { id: "plantera_bulb", result: { item: "plantera_bulb", count: 1 }, cost: [{ item: "chlorophyte_ore", count: 5 }, { item: "vine", count: 15 }, { item: "jungle_spores", count: 10 }] },
  { id: "lizhard_power", result: { item: "lizhard_power", count: 1 }, cost: [{ item: "temple_key", count: 1 }, { item: "chlorophyte_ore", count: 10 }] },
  { id: "truffle_worm", result: { item: "truffle_worm", count: 1 }, cost: [{ item: "bass", count: 5 }, { item: "mushroom", count: 20 }] },
  { id: "celestial_sigil", result: { item: "celestial_sigil", count: 1 }, cost: [{ item: "luminite", count: 20 }, { item: "soul_of_flight", count: 10 }] },
  { id: "deer_thing", result: { item: "deer_thing", count: 1 }, cost: [{ item: "bone", count: 10 }, { item: "ice", count: 15 }, { item: "lens", count: 2 }] },
  { id: "gelatin_crystal", result: { item: "gelatin_crystal", count: 1 }, cost: [{ item: "gel", count: 50 }, { item: "crystal", count: 8 }, { item: "soul_of_light", count: 5 }] },
  { id: "prismatic_lacewing", result: { item: "prismatic_lacewing", count: 1 }, cost: [{ item: "crystal", count: 20 }, { item: "soul_of_light", count: 10 }, { item: "gel", count: 20 }] },
  { id: "fuzzy_carrot", result: { item: "fuzzy_carrot", count: 1 }, cost: [{ item: "gel", count: 20 }, { item: "gold_ore", count: 5 }] },
  { id: "slimy_saddle", result: { item: "slimy_saddle", count: 1 }, cost: [{ item: "gel", count: 80 }, { item: "gold_ore", count: 10 }] },
  { id: "hornet_staff", result: { item: "hornet_staff", count: 1 }, cost: [{ item: "vine", count: 15 }, { item: "stinger", count: 8 }, { item: "jungle_spores", count: 10 }] },
  { id: "imp_staff", result: { item: "imp_staff", count: 1 }, cost: [{ item: "hellstone", count: 15 }, { item: "ash", count: 20 }] },
  { id: "blade_staff", result: { item: "blade_staff", count: 1 }, cost: [{ item: "hallowed_bar", count: 12 }, { item: "gel", count: 40 }] },
  { id: "stardust_cell", result: { item: "stardust_cell", count: 1 }, cost: [{ item: "luminite", count: 18 }, { item: "crystal", count: 20 }] },
];

// Fix recipes that had zero costs - remove bad bloody_spine
export const RECIPES_CLEAN = RECIPES.filter((r) => r.cost.every((c) => c.count > 0 && c.item));

// re-export cleaned
import { ITEMS } from "./items.js";

// Add missing craft materials to items if not present - patch at module load
const CRAFT_MATS = {
  jungle_spores: { name: "Jungle Spores", color: "#27ae60", stack: 99, value: 20 },
  silk: { name: "Silk", color: "#dfe6e9", stack: 99, value: 15 },
  bottle: { name: "Bottle", color: "#a8d8ea", stack: 99, value: 5 },
  daybloom: { name: "Daybloom", color: "#ffeaa7", stack: 99, value: 10 },
  specular_fish: { name: "Specular Fish", color: "#74b9ff", stack: 99, value: 30 },
  honey: { name: "Honey Block", color: "#f1c40f", stack: 999, value: 5 },
  hive: { name: "Hive", color: "#e67e22", stack: 999, value: 8 },
  stinger: { name: "Stinger", color: "#55efc4", stack: 99, value: 25 },
  rotten_chunk: { name: "Rotten Chunk", color: "#6c5ce7", stack: 99, value: 15 },
  broken_hero_sword: { name: "Broken Hero Sword", color: "#2d3436", stack: 5, value: 5000 },
  shark_fin: { name: "Shark Fin", color: "#636e72", stack: 99, value: 40 },
  soul_of_flight: { name: "Soul of Flight", color: "#81ecec", stack: 999, value: 120 },
  feather: { name: "Feather", color: "#dfe6e9", stack: 99, value: 10 },
  solar_fragment: { name: "Solar Fragment", color: "#e17055", stack: 999, value: 200 },
};

for (const [k, v] of Object.entries(CRAFT_MATS)) {
  if (!ITEMS[k]) ITEMS[k] = v;
}

export function getAllRecipes() {
  return RECIPES.filter(
    (r) =>
      r.cost.every((c) => c.count >= 1 && ITEMS[c.item]) &&
      ITEMS[r.result?.item]
  );
}

/**
 * Guess category for UI filters when recipe has no explicit category.
 * @param {Recipe} recipe
 */
export function recipeCategory(recipe) {
  if (recipe.category) return recipe.category;
  const id = recipe.result?.item || "";
  const def = ITEMS[id] || {};
  if (def.tool) return "tools";
  if (def.weapon || def.ammo) return "weapons";
  if (def.armor) return "armor";
  if (def.accessory || def.mount) return "accessories";
  if (def.potion || def.heal || def.buff || id.includes("potion") || id === "bottle") return "potions";
  if (def.boss || id.includes("eye") || id.includes("crown") || id.includes("voodoo") || id.includes("mechanical") || id.includes("sigil") || id.includes("bulb") || id.includes("worm") || id.includes("spine") || id.includes("abeemination") || id.includes("deer") || id.includes("gelatin") || id.includes("lacewing") || id.includes("truffle") || id.includes("lizhard") || id.includes("power"))
    return "boss";
  if (def.place !== undefined || id.includes("plank") || id.includes("brick") || id.includes("door") || id.includes("chair") || id.includes("table") || id.includes("wall") || id.includes("platform") || id.includes("torch") || id.includes("chest") || id.includes("workbench") || id.includes("furnace") || id.includes("anvil") || id.includes("bed") || id.includes("bench"))
    return "basic";
  return "misc";
}

/**
 * @param {{ count: (itemId: string) => number }} inventory
 * @param {Recipe} recipe
 * @param {Set<string>|null} [stations] nearby station keys; if null, stations ignored
 */
export function canCraft(inventory, recipe, stations = null) {
  if (!recipe?.cost?.length || !recipe?.result?.item) return false;
  if (!ITEMS[recipe.result.item]) return false;
  if (stations) {
    const need = recipe.station || "none";
    if (need !== "none") {
      if (!stations.has(need) && !(need === "furnace" && stations.has("hellforge"))) return false;
    }
  }
  return recipe.cost.every(({ item, count }) => count >= 1 && inventory.count(item) >= count);
}

/**
 * How many times the recipe can be crafted with current materials.
 * @param {{ count: (itemId: string) => number }} inventory
 * @param {Recipe} recipe
 * @param {Set<string>|null} [stations]
 */
export function maxCraftable(inventory, recipe, stations = null) {
  if (!canCraft(inventory, recipe, stations) && stations) {
    // still compute mats if only station missing
  }
  if (!recipe?.cost?.length) return 0;
  if (stations) {
    const need = recipe.station || "none";
    if (need !== "none" && !stations.has(need) && !(need === "furnace" && stations.has("hellforge"))) {
      return 0;
    }
  }
  let n = Infinity;
  for (const { item, count } of recipe.cost) {
    if (count < 1) return 0;
    n = Math.min(n, Math.floor(inventory.count(item) / count));
  }
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/**
 * @param {{ count: (id: string) => number, remove: (id: string, n: number) => boolean, add: (id: string, n: number) => number }} inventory
 * @param {Recipe} recipe
 * @param {Set<string>|null} [stations]
 */
export function craft(inventory, recipe, stations = null) {
  if (!canCraft(inventory, recipe, stations)) return false;
  for (const { item, count } of recipe.cost) {
    if (!inventory.remove(item, count)) return false;
  }
  inventory.add(recipe.result.item, recipe.result.count);
  return true;
}

/**
 * Craft up to `times` (or as many as materials allow).
 * @returns {number} how many crafts succeeded
 */
export function craftMany(inventory, recipe, times = 1, stations = null) {
  const max = maxCraftable(inventory, recipe, stations);
  const n = Math.min(Math.max(0, times | 0), max);
  let done = 0;
  for (let i = 0; i < n; i++) {
    if (!craft(inventory, recipe, stations)) break;
    done++;
  }
  return done;
}

/**
 * Sorted list: craftable first, then by name. Optional filter.
 * @param {object} inventory
 * @param {{ query?: string, category?: string, onlyReady?: boolean, stations?: Set<string>|null }} [opts]
 */
export function listRecipes(inventory, opts = {}) {
  const q = (opts.query || "").trim().toLowerCase();
  const cat = opts.category || "all";
  const stations = opts.stations ?? null;
  let list = getAllRecipes().map((r) => {
    const hasMats = r.cost.every(({ item, count }) => count >= 1 && inventory.count(item) >= count);
    const need = r.station || "none";
    const hasStat =
      !stations ||
      need === "none" ||
      stations.has(need) ||
      (need === "furnace" && stations.has("hellforge"));
    const ready = hasMats && hasStat;
    const max = ready ? maxCraftable(inventory, r, stations) : 0;
    return {
      recipe: r,
      ready,
      max,
      category: recipeCategory(r),
      missingStation: hasMats && !hasStat ? need : null,
      station: need,
    };
  });
  if (cat === "ready") list = list.filter((x) => x.ready);
  else if (cat !== "all") list = list.filter((x) => x.category === cat);
  if (q) {
    list = list.filter((x) => {
      const name = (ITEMS[x.recipe.result.item]?.name || x.recipe.result.item).toLowerCase();
      const id = x.recipe.result.item.toLowerCase();
      const cost = x.recipe.cost.map((c) => (ITEMS[c.item]?.name || c.item).toLowerCase()).join(" ");
      return name.includes(q) || id.includes(q) || cost.includes(q);
    });
  }
  list.sort((a, b) => {
    if (a.ready !== b.ready) return a.ready ? -1 : 1;
    const na = ITEMS[a.recipe.result.item]?.name || a.recipe.result.item;
    const nb = ITEMS[b.recipe.result.item]?.name || b.recipe.result.item;
    return na.localeCompare(nb);
  });
  return list;
}

/** @param {string} id */
export function getRecipe(id) {
  return getAllRecipes().find((r) => r.id === id) ?? null;
}

// Keep RECIPES as source; consumers should prefer getAllRecipes()
