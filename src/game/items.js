/** Items — tools, weapons, armor, accessories, potions, materials (parity expansion) */

const mat = (name, color, extra = {}) => ({ name, color, stack: 999, ...extra });
const place = (name, color, blockId, extra = {}) => ({ name, color, place: blockId, stack: 999, ...extra });
const tool = (name, color, power, speed = 1) => ({
  name,
  color,
  tool: "pick",
  power,
  speed,
  stack: 1,
});
const axe = (name, color, power) => ({ name, color, tool: "axe", power, speed: 1.2, stack: 1 });
const hammer = (name, color, power) => ({ name, color, tool: "hammer", power, speed: 1.1, stack: 1 });
const melee = (name, color, damage, knockback, cooldown, reach = 3) => ({
  name,
  color,
  weapon: "melee",
  damage,
  knockback,
  cooldown,
  reach,
  stack: 1,
});
const ranged = (name, color, damage, cooldown, mana = 0) => ({
  name,
  color,
  weapon: "ranged",
  damage,
  knockback: 2,
  cooldown,
  mana,
  stack: 1,
});
const magic = (name, color, damage, cooldown, mana) => ({
  name,
  color,
  weapon: "magic",
  damage,
  knockback: 1.5,
  cooldown,
  mana,
  stack: 1,
});
const armor = (name, color, slot, defense) => ({ name, color, armor: slot, defense, stack: 1 });
const acc = (name, color, effects) => ({ name, color, accessory: true, effects, stack: 1, value: 5000 });
const potion = (name, color, buff, duration, heal = 0) => ({
  name,
  color,
  stack: 30,
  potion: true,
  buff,
  duration,
  heal,
  value: 200,
});
const boss = (name, color, bossId) => ({ name, color, boss: bossId, stack: 5, value: 1000 });

export const ITEMS = {
  // --- blocks / mats ---
  dirt: place("Dirt", "#8b5a2b", 2, { value: 1 }),
  stone: place("Stone", "#7a7f88", 3, { value: 1 }),
  sand: place("Sand", "#e0c36a", 4, { value: 1 }),
  wood: place("Wood", "#6b4226", 5, { value: 1 }),
  planks: place("Planks", "#c4a35a", 12, { value: 1 }),
  brick: place("Brick", "#a0522d", 13, { value: 2 }),
  cobble: place("Cobblestone", "#6d7078", 23, { value: 1 }),
  glass: place("Glass", "#a8d8ea", 22, { value: 2 }),
  clay: place("Clay", "#b66a50", 21, { value: 1 }),
  ice: place("Ice", "#9ad7f5", 27, { value: 1 }),
  ash: place("Ash", "#4a4440", 28, { value: 1 }),
  platform: place("Platform", "#a67c52", 26, { value: 1 }),
  coal: mat("Coal", "#2d2d2d", { value: 5 }),
  copper_ore: mat("Copper Ore", "#cd7f32", { value: 8 }),
  iron_ore: mat("Iron Ore", "#b0a090", { value: 12 }),
  silver_ore: mat("Silver Ore", "#c0c0c0", { value: 15 }),
  gold_ore: mat("Gold Ore", "#d4af37", { value: 20 }),
  crystal: mat("Crystal", "#c56cf0", { value: 30 }),
  hellstone: mat("Hellstone", "#d63031", { value: 40 }),
  demonite: mat("Demonite Ore", "#5b2c6f", { value: 35 }),
  mythril_ore: mat("Mythril Ore", "#3dcf9a", { value: 50 }),
  adamantite_ore: mat("Adamantite Ore", "#c0392b", { value: 70 }),
  chlorophyte_ore: mat("Chlorophyte Ore", "#2ecc71", { value: 90 }),
  // smelted bars — proper progression (ore → furnace → bar → anvil gear)
  copper_bar: mat("Copper Bar", "#e09a50", { value: 25, stack: 99 }),
  iron_bar: mat("Iron Bar", "#c8c2b8", { value: 40, stack: 99 }),
  silver_bar: mat("Silver Bar", "#e8e8e8", { value: 55, stack: 99 }),
  gold_bar: mat("Gold Bar", "#ffd700", { value: 80, stack: 99 }),
  demonite_bar: mat("Demonite Bar", "#7d3c98", { value: 120, stack: 99 }),
  hellstone_bar: mat("Hellstone Bar", "#ff6b35", { value: 150, stack: 99 }),
  mythril_bar: mat("Mythril Bar", "#5eead4", { value: 180, stack: 99 }),
  adamantite_bar: mat("Adamantite Bar", "#e74c3c", { value: 220, stack: 99 }),
  chlorophyte_bar: mat("Chlorophyte Bar", "#58d68d", { value: 280, stack: 99 }),
  pearlstone: place("Pearlstone", "#f8c8dc", 47, { value: 5 }),
  ebonstone: place("Ebonstone", "#4a3a6a", 48, { value: 5 }),
  dungeon_brick: place("Dungeon Brick", "#5d6d7e", 41, { value: 8 }),
  cloud: place("Cloud", "#f5f6fa", 42, { value: 3 }),
  vine: mat("Vine", "#196f3d", { value: 2, stack: 99 }),
  torch: place("Torch", "#ffb347", 11, { value: 2 }),
  rope: mat("Rope", "#c4a35a", { value: 2, stack: 999 }),
  mushroom: mat("Mushroom", "#e17055", { stack: 99, heal: 15, value: 10 }),
  cooked_fish: mat("Cooked Fish", "#f8a5c2", { stack: 30, heal: 35, value: 25 }),
  gel: mat("Gel", "#74b9ff", { value: 3 }),
  lens: mat("Lens", "#a29bfe", { stack: 99, value: 15 }),
  bone: mat("Bone", "#f5f0e6", { stack: 99, value: 8 }),
  shadow_scale: mat("Shadow Scale", "#6c5ce7", { stack: 99, value: 40 }),
  boss_trophy: mat("Boss Trophy", "#fdcb6e", { stack: 20, value: 1000 }),
  life_crystal: { name: "Life Crystal", color: "#ff4d6d", stack: 20, lifeCrystal: true, value: 500 },
  mana_crystal: { name: "Mana Crystal", color: "#4dabf7", stack: 20, manaCrystal: true, value: 500 },
  chest_item: place("Chest", "#c49a3c", 25, { value: 50 }),
  workbench: place("Work Bench", "#c4a35a", 30, { value: 20 }),
  furnace: place("Furnace", "#6d6d6d", 31, { value: 40 }),
  anvil: place("Iron Anvil", "#8a8e94", 32, { value: 80 }),
  hellforge: place("Hellforge", "#c0392b", 38, { value: 200 }),
  chair: place("Chair", "#a67c52", 33, { value: 10 }),
  table: place("Table", "#b8956a", 34, { value: 15 }),
  door: place("Door", "#8b6914", 35, { value: 20 }),
  bench: place("Bench", "#9a7b4f", 36, { value: 12 }),
  bed: place("Bed", "#e84393", 37, { value: 50 }),
  piggy_bank: { name: "Piggy Bank", color: "#fd79a8", stack: 1, piggy: true, value: 5000 },

  // coins
  copper_coin: mat("Copper Coin", "#b87333", { value: 1 }),
  silver_coin: mat("Silver Coin", "#c0c0c0", { value: 100 }),
  gold_coin: mat("Gold Coin", "#ffd43b", { value: 10000 }),
  platinum_coin: mat("Platinum Coin", "#e5e4e2", { value: 1000000 }),

  // fishing
  wood_pole: { name: "Wood Fishing Pole", color: "#a67c52", fishingPower: 10, stack: 1, value: 50 },
  reinforced_pole: { name: "Reinforced Fishing Pole", color: "#74b9ff", fishingPower: 25, stack: 1, value: 500 },
  bass: mat("Bass", "#4a90a4", { stack: 99, heal: 20, value: 15 }),
  trout: mat("Trout", "#6ab04c", { stack: 99, heal: 18, value: 12 }),
  atlantic_cod: mat("Atlantic Cod", "#dfe6e9", { stack: 99, heal: 25, value: 20 }),
  neon_tetra: mat("Neon Tetra", "#00cec9", { stack: 99, value: 40 }),
  golden_carp: mat("Golden Carp", "#f1c40f", { stack: 10, value: 5000 }),
  old_shoe: mat("Old Shoe", "#636e72", { stack: 99, value: 1 }),
  seaweed: mat("Seaweed", "#27ae60", { stack: 99, value: 5 }),
  crate: mat("Wooden Crate", "#c4a35a", { stack: 20, value: 100 }),
  crate_hallowed: mat("Hallowed Crate", "#f8c8dc", { stack: 20, value: 500 }),
  prismite: mat("Prismite", "#fd79a8", { stack: 99, value: 80 }),
  scaley_trinket: acc("Scaly Trinket", "#00b894", { fishing: 10 }),

  // explosives
  bomb: { name: "Bomb", color: "#2d3436", stack: 50, bomb: true, radius: 3, value: 100 },
  dynamite: { name: "Dynamite", color: "#d63031", stack: 30, bomb: true, radius: 5, value: 400 },
  grenade: { name: "Grenade", color: "#636e72", stack: 50, bomb: true, radius: 2, value: 50 },

  // tools
  wood_pick: tool("Wooden Pickaxe", "#c4a35a", 1, 1),
  stone_pick: tool("Stone Pickaxe", "#95a5a6", 2, 1.2),
  copper_pick: tool("Copper Pickaxe", "#cd7f32", 2.6, 1.35),
  iron_pick: tool("Iron Pickaxe", "#b2bec3", 3.5, 1.5),
  silver_pick: tool("Silver Pickaxe", "#c0c0c0", 4, 1.6),
  gold_pick: tool("Gold Pickaxe", "#f1c40f", 5, 1.8),
  crystal_pick: tool("Crystal Pickaxe", "#c56cf0", 7, 2.2),
  nightmare_pick: tool("Nightmare Pickaxe", "#6c5ce7", 9, 2.5),
  mythril_pick: tool("Mythril Pickaxe", "#3dcf9a", 11, 2.8),
  adamantite_pick: tool("Adamantite Pickaxe", "#c0392b", 14, 3.1),
  chlorophyte_pick: tool("Chlorophyte Pickaxe", "#2ecc71", 18, 3.5),
  wood_axe: axe("Wooden Axe", "#a67c52", 2),
  iron_axe: axe("Iron Axe", "#b2bec3", 5),
  wood_hammer: hammer("Wooden Hammer", "#8d6e4c", 2),
  iron_hammer: hammer("Iron Hammer", "#95a5a6", 5),
  grappling_hook: { name: "Grappling Hook", color: "#74b9ff", grapple: true, stack: 1, value: 2000 },
  ivy_whip: { name: "Ivy Whip", color: "#27ae60", grapple: true, stack: 1, value: 5000 },

  // weapons melee
  wood_sword: melee("Wooden Sword", "#d4a574", 8, 4, 0.4, 2.8),
  copper_sword: melee("Copper Sword", "#e67e22", 12, 4.5, 0.38, 2.9),
  copper_axe: axe("Copper Axe", "#cd7f32", 3),
  iron_sword: melee("Iron Sword", "#dfe6e9", 16, 5.5, 0.35, 3.0),
  silver_sword: melee("Silver Sword", "#c0c0c0", 18, 5.5, 0.34, 3.05),
  gold_sword: melee("Gold Sword", "#fdcb6e", 24, 6, 0.32, 3.1),
  night_edge: melee("Night's Edge", "#6c5ce7", 42, 7, 0.28, 3.4),
  excalibur: melee("Excalibur", "#ffeaa7", 55, 8, 0.26, 3.5),
  true_excalibur: melee("True Excalibur", "#fff9c4", 70, 8.5, 0.24, 3.6),
  terra_blade: melee("Terra Blade", "#55efc4", 95, 9, 0.22, 3.8),
  // ranged
  bow: ranged("Wooden Bow", "#a67c52", 10, 0.5),
  gold_bow: ranged("Gold Bow", "#f1c40f", 18, 0.42),
  crystal_bow: ranged("Crystal Bow", "#a29bfe", 22, 0.38),
  phantasm: ranged("Phantasm", "#81ecec", 50, 0.22),
  minishark: ranged("Minishark", "#636e72", 6, 0.08),
  megashark: ranged("Megashark", "#2d3436", 25, 0.07),
  wooden_arrow: mat("Wooden Arrow", "#c4a35a", { stack: 999, value: 1, ammo: "arrow" }),
  flaming_arrow: mat("Flaming Arrow", "#e17055", { stack: 999, value: 3, ammo: "arrow" }),
  musket_ball: mat("Musket Ball", "#b2bec3", { stack: 999, value: 1, ammo: "bullet" }),
  // magic
  magic_staff: magic("Magic Staff", "#74b9ff", 18, 0.35, 6),
  demon_scythe: magic("Demon Scythe", "#e84393", 32, 0.4, 10),
  starfury: magic("Starfury", "#81ecec", 40, 0.32, 8),
  crystal_storm: magic("Crystal Storm", "#c56cf0", 28, 0.12, 4),
  razorblade_typhoon: magic("Razorblade Typhoon", "#00cec9", 60, 0.35, 14),
  last_prism: magic("Last Prism", "#ffeaa7", 90, 0.05, 12),
  summon_staff: {
    name: "Slime Staff",
    color: "#74b9ff",
    weapon: "summon",
    damage: 12,
    knockback: 1,
    cooldown: 0.5,
    mana: 10,
    stack: 1,
  },

  // armor sets
  wood_helmet: armor("Wood Helmet", "#a67c52", "head", 1),
  wood_chest: armor("Wood Breastplate", "#8d6e4c", "chest", 2),
  wood_legs: armor("Wood Greaves", "#7a5c3e", "legs", 1),
  copper_helmet: armor("Copper Helmet", "#cd7f32", "head", 2),
  copper_chest: armor("Copper Chainmail", "#b87333", "chest", 3),
  copper_legs: armor("Copper Greaves", "#a0522d", "legs", 2),
  iron_helmet: armor("Iron Helmet", "#b2bec3", "head", 3),
  iron_chest: armor("Iron Chainmail", "#b2bec3", "chest", 4),
  iron_legs: armor("Iron Greaves", "#95a5a6", "legs", 3),
  silver_helmet: armor("Silver Helmet", "#c0c0c0", "head", 4),
  silver_chest: armor("Silver Chainmail", "#b0b0b0", "chest", 5),
  silver_legs: armor("Silver Greaves", "#a8a8a8", "legs", 4),
  gold_helmet: armor("Gold Helmet", "#f1c40f", "head", 5),
  gold_chest: armor("Gold Chainmail", "#f39c12", "chest", 6),
  gold_legs: armor("Gold Greaves", "#e67e22", "legs", 5),
  shadow_helmet: armor("Shadow Helmet", "#6c5ce7", "head", 7),
  shadow_chest: armor("Shadow Scalemail", "#5f3dc4", "chest", 9),
  shadow_legs: armor("Shadow Greaves", "#4c2fb0", "legs", 7),
  molten_helmet: armor("Molten Helmet", "#e17055", "head", 9),
  molten_chest: armor("Molten Breastplate", "#d63031", "chest", 12),
  molten_legs: armor("Molten Greaves", "#c0392b", "legs", 9),
  mythril_helmet: armor("Mythril Helmet", "#3dcf9a", "head", 10),
  mythril_chest: armor("Mythril Chainmail", "#2bbd8a", "chest", 14),
  mythril_legs: armor("Mythril Greaves", "#1fa87a", "legs", 10),
  adamantite_helmet: armor("Adamantite Helmet", "#e74c3c", "head", 12),
  adamantite_chest: armor("Adamantite Breastplate", "#c0392b", "chest", 16),
  adamantite_legs: armor("Adamantite Leggings", "#a93226", "legs", 12),
  chlorophyte_helmet: armor("Chlorophyte Helmet", "#2ecc71", "head", 14),
  chlorophyte_chest: armor("Chlorophyte Plate", "#27ae60", "chest", 18),
  chlorophyte_legs: armor("Chlorophyte Greaves", "#1e8449", "legs", 14),
  beetle_helmet: armor("Beetle Helmet", "#2d3436", "head", 16),
  beetle_chest: armor("Beetle Scale Mail", "#636e72", "chest", 22),
  beetle_legs: armor("Beetle Leggings", "#2d3436", "legs", 16),
  solar_helmet: armor("Solar Flare Helmet", "#e17055", "head", 20),
  solar_chest: armor("Solar Flare Breastplate", "#d63031", "chest", 28),
  solar_legs: armor("Solar Flare Leggings", "#c0392b", "legs", 20),
  fedora: armor("Fedora", "#2d3436", "head", 1),
  robe: armor("Robe", "#6c5ce7", "chest", 2),

  // accessories
  hermes_boots: acc("Hermes Boots", "#e17055", { speed: 1.35 }),
  rocket_boots: acc("Rocket Boots", "#fd79a8", { rocket: true }),
  jetpack: acc("Jetpack", "#b2bec3", { rocket: true, speed: 1.15 }),
  cloud_bottle: acc("Cloud in a Bottle", "#dfe6e9", { doubleJump: true }),
  blizzard_bottle: acc("Blizzard in a Bottle", "#74b9ff", { doubleJump: true }),
  band_regen: acc("Band of Regeneration", "#ff6b6b", { regen: 1.5 }),
  band_starpower: acc("Band of Starpower", "#a29bfe", { mana: 20, manaRegen: 2 }),
  shaman_charm: acc("Shaman Charm", "#00b894", { dmg: 1.08 }),
  warrior_emblem: acc("Warrior Emblem", "#d63031", { dmg: 1.15 }),
  ranger_emblem: acc("Ranger Emblem", "#55efc4", { dmg: 1.15 }),
  sorcerer_emblem: acc("Sorcerer Emblem", "#74b9ff", { dmg: 1.15 }),
  avenger_emblem: acc("Avenger Emblem", "#e84393", { dmg: 1.12 }),
  destroyer_emblem: acc("Destroyer Emblem", "#2d3436", { dmg: 1.1, crit: 0.08 }),
  ankh_shield: acc("Ankh Shield", "#fdcb6e", { def: 4, knockbackImmune: true }),
  celestial_shell: acc("Celestial Shell", "#ffeaa7", { dmg: 1.1, speed: 1.1, regen: 1 }),
  wings_angel: acc("Angel Wings", "#ffffff", { wings: true }),
  wings_demon: acc("Demon Wings", "#6c5ce7", { wings: true }),
  toolbox: acc("Toolbox", "#95a5a6", { placeSpeed: 1.25 }),
  lava_charm: acc("Lava Charm", "#e17055", { lavaImmune: 7 }),
  diving_helmet: acc("Diving Helmet", "#0984e3", { breath: true }),
  lucky_horseshoe: acc("Lucky Horseshoe", "#f1c40f", { noFall: true }),
  obsidianskin: acc("Obsidian Skull", "#2d3436", { fireImmune: true }),

  // potions
  healing_potion: potion("Healing Potion", "#ff6b6b", null, 0, 80),
  greater_healing: potion("Greater Healing Potion", "#e84393", null, 0, 150),
  super_healing: potion("Super Healing Potion", "#fd79a8", null, 0, 200),
  mana_potion: potion("Mana Potion", "#74b9ff", null, 0, 0),
  ironskin_potion: potion("Ironskin Potion", "#a0a0a0", "ironskin", 300),
  regeneration_potion: potion("Regeneration Potion", "#ff7675", "regeneration", 300),
  swiftness_potion: potion("Swiftness Potion", "#74b9ff", "swiftness", 300),
  archery_potion: potion("Archery Potion", "#55efc4", "archery", 240),
  magic_power_potion: potion("Magic Power Potion", "#a29bfe", "magic_power", 240),
  shine_potion: potion("Shine Potion", "#ffeaa7", "shine", 300),
  hunter_potion: potion("Hunter Potion", "#fd79a8", "hunter", 300),
  gills_potion: potion("Gills Potion", "#0984e3", "gills", 120),
  gravitation_potion: potion("Gravitation Potion", "#6c5ce7", "gravitation", 180),
  thorns_potion: potion("Thorns Potion", "#00b894", "thorns", 120),
  recall_potion: { name: "Recall Potion", color: "#a29bfe", stack: 30, recall: true, value: 100 },
  wormhole_potion: { name: "Wormhole Potion", color: "#81ecec", stack: 30, value: 200 },
  mining_potion: potion("Mining Potion", "#b2bec3", "mining", 300),
  builder_potion: potion("Builder Potion", "#fdcb6e", "builder", 300),
  battle_potion: potion("Battle Potion", "#d63031", "battle", 420),
  calming_potion: potion("Calming Potion", "#81ecec", "calm", 420),
  imbue_venom: potion("Flask of Venom", "#6c5ce7", "thorns", 240),
  purification_powder: mat("Purification Powder", "#dfe6e9", { stack: 99, value: 20 }),
  bloom_seeds: mat("Bloom Seeds", "#27ae60", { stack: 99, value: 10 }),
  crystal_ball: { name: "Crystal Ball", color: "#c56cf0", stack: 1, value: 10000 },
  teleporter: place("Teleporter", "#74b9ff", 26, { value: 5000 }),

  // bosses
  suspicious_eye: boss("Suspicious Looking Eye", "#ff7675", "eye"),
  slime_crown: boss("Slime Crown", "#55efc4", "king_slime"),
  worm_food: boss("Worm Food", "#6c5ce7", "eater"),
  bloody_spine: boss("Bloody Spine", "#e84393", "brain"),
  abeemination: boss("Abeemination", "#f1c40f", "queen_bee"),
  clothier_voodoo: boss("Clothier Voodoo Doll", "#dfe6e9", "skeletron"),
  guide_voodoo: boss("Guide Voodoo Doll", "#e17055", "wall"),
  mechanical_eye: boss("Mechanical Eye", "#ff7675", "twins"),
  mechanical_worm: boss("Mechanical Worm", "#636e72", "destroyer"),
  mechanical_skull: boss("Mechanical Skull", "#dfe6e9", "prime"),
  plantera_bulb: boss("Strange Bulb", "#e84393", "plantera"),
  lizhard_power: boss("Lihzahrd Power Cell", "#e17055", "golem"),
  truffle_worm: boss("Truffle Worm", "#fdcb6e", "duke"),
  ancient_cultist: boss("Mysterious Tablet", "#a29bfe", "cultist"),
  celestial_sigil: boss("Celestial Sigil", "#ffeaa7", "moonlord"),

  // hardmode / late materials & unique drops
  soul_of_night: mat("Soul of Night", "#6c5ce7", { stack: 999, value: 100 }),
  soul_of_light: mat("Soul of Light", "#ffeaa7", { stack: 999, value: 100 }),
  soul_of_sight: mat("Soul of Sight", "#ff7675", { stack: 999, value: 150 }),
  soul_of_might: mat("Soul of Might", "#74b9ff", { stack: 999, value: 150 }),
  soul_of_fright: mat("Soul of Fright", "#fdcb6e", { stack: 999, value: 150 }),
  tissue_sample: mat("Tissue Sample", "#e84393", { stack: 99, value: 40 }),
  beenade: { name: "Beenade", color: "#f1c40f", stack: 50, bomb: true, radius: 2.5, value: 80 },
  pwnhammer: hammer("Pwnhammer", "#fd79a8", 12),
  hallowed_bar: mat("Hallowed Bar", "#f8c8dc", { stack: 999, value: 80 }),
  temple_key: mat("Temple Key", "#e17055", { stack: 10, value: 2000 }),
  beetle_husks: mat("Beetle Husk", "#2d3436", { stack: 99, value: 100 }),
  picksaw: tool("Picksaw", "#e17055", 20, 3.8),
  bubble_gun: magic("Bubble Gun", "#74b9ff", 45, 0.1, 5),
  ancient_manipulator: place("Ancient Manipulator", "#a29bfe", 32, { value: 5000 }),
  luminite: mat("Luminite", "#dfe6e9", { stack: 999, value: 200 }),
  portal_gun: { name: "Portal Gun", color: "#55efc4", stack: 1, weapon: "magic", damage: 40, knockback: 2, cooldown: 0.3, mana: 0, value: 50000 },

  // mounts
  fuzzy_carrot: { name: "Fuzzy Carrot", color: "#e67e22", stack: 1, mount: "bunny", value: 2000 },
  slimy_saddle: { name: "Slimy Saddle", color: "#74b9ff", stack: 1, mount: "slime", value: 5000 },
  blessed_apple: { name: "Blessed Apple", color: "#f8c8dc", stack: 1, mount: "unicorn", value: 15000 },
  ancient_horn: { name: "Ancient Horn", color: "#27ae60", stack: 1, mount: "baselisk", value: 20000 },
  cosmic_car_key: { name: "Cosmic Car Key", color: "#81ecec", stack: 1, mount: "ufo", value: 35000 },
  witch_broom: { name: "Witch's Broom", color: "#6c5ce7", stack: 1, mount: "witch_broom", value: 30000 },
  shiny_seduce: { name: "Shrimpy Truffle", color: "#fd79a8", stack: 1, mount: "cute_fishron", value: 40000 },

  // summon gear
  hornet_staff: {
    name: "Hornet Staff",
    color: "#f1c40f",
    weapon: "summon",
    damage: 16,
    knockback: 1,
    cooldown: 0.4,
    mana: 10,
    minion: "hornet",
    stack: 1,
    value: 8000,
  },
  imp_staff: {
    name: "Imp Staff",
    color: "#e17055",
    weapon: "summon",
    damage: 22,
    knockback: 1,
    cooldown: 0.4,
    mana: 12,
    minion: "shark",
    stack: 1,
    value: 12000,
  },
  stardust_cell: {
    name: "Stardust Cell Staff",
    color: "#81ecec",
    weapon: "summon",
    damage: 45,
    knockback: 1,
    cooldown: 0.35,
    mana: 10,
    minion: "stardust",
    stack: 1,
    value: 50000,
  },
  blade_staff: {
    name: "Blade Staff",
    color: "#f8c8dc",
    weapon: "summon",
    damage: 28,
    knockback: 1,
    cooldown: 0.3,
    mana: 8,
    minion: "slime",
    stack: 1,
    value: 25000,
  },
  bewitching_table: { name: "Bewitching Table", color: "#a29bfe", stack: 1, minionSlots: 1, value: 10000 },

  // invasion / unique mats
  sail: mat("Sail", "#dfe6e9", { stack: 99, value: 20 }),
  martian_conduit: mat("Martian Conduit Plating", "#00b894", { stack: 999, value: 50 }),
  deerclops_eyeball: mat("Deerclops Eyeball", "#e84393", { stack: 10, value: 2000 }),
  soaring_insignia: acc("Soaring Insignia", "#fd79a8", { wings: true, speed: 1.12 }),
  empress_wings: acc("Empress Wings", "#fd79a8", { wings: true, speed: 1.2 }),
  prismatic_dye: mat("Prismatic Dye", "#e84393", { stack: 99, value: 100 }),

  // more summons
  deer_thing: boss("Deer Thing", "#2d3436", "deerclops"),
  gelatin_crystal: boss("Gelatin Crystal", "#f8c8dc", "queen_slime"),
  prismatic_lacewing: boss("Prismatic Lacewing", "#fd79a8", "empress"),
  cannon: ranged("Cannon", "#2d3436", 80, 1.2),
  nanites: mat("Nanites", "#55efc4", { stack: 999, value: 50 }),
};

export function getItem(id) {
  return ITEMS[id] || null;
}

export function itemColor(id) {
  return ITEMS[id]?.color || "#ffffff";
}

export function calcDefense(equipment) {
  let d = 0;
  for (const slot of ["head", "chest", "legs"]) {
    const id = equipment?.[slot];
    if (id && ITEMS[id]?.armor === slot) d += ITEMS[id].defense || 0;
  }
  for (let i = 1; i <= 5; i++) {
    const id = equipment?.[`acc${i}`];
    if (id && ITEMS[id]?.effects?.def) d += ITEMS[id].effects.def;
  }
  return d;
}

export function accessoryMods(equipment) {
  const mods = { speed: 1, dmg: 1, regen: 0, mana: 0, manaRegen: 0, doubleJump: false, rocket: false, wings: false, noFall: false, crit: 0 };
  for (let i = 1; i <= 5; i++) {
    const id = equipment?.[`acc${i}`];
    const e = id && ITEMS[id]?.effects;
    if (!e) continue;
    if (e.speed) mods.speed *= e.speed;
    if (e.dmg) mods.dmg *= e.dmg;
    if (e.regen) mods.regen += e.regen;
    if (e.mana) mods.mana += e.mana;
    if (e.manaRegen) mods.manaRegen += e.manaRegen;
    if (e.doubleJump) mods.doubleJump = true;
    if (e.rocket) mods.rocket = true;
    if (e.wings) mods.wings = true;
    if (e.noFall) mods.noFall = true;
    if (e.crit) mods.crit += e.crit;
  }
  return mods;
}

export function isFullSet(equipment, prefix) {
  return (
    equipment?.head === `${prefix}_helmet` &&
    equipment?.chest === `${prefix}_chest` &&
    equipment?.legs === `${prefix}_legs`
  );
}
