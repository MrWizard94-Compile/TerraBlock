/**
 * Enemy and boss definitions — expanded for ~50% content parity target.
 */

/** @type {Record<string, object>} */
export const ENEMY_TYPES = {
  // day
  slime: { name: "Blue Slime", hp: 25, damage: 5, speed: 4, height: 0.8, width: 0.9, color: 0x74b9ff, shape: "sphere", ai: "slime", drops: [{ item: "gel", count: () => 1 + ((Math.random() * 3) | 0), chance: 1 }, { item: "copper_coin", count: 20, chance: 0.5 }] },
  green_slime: { name: "Green Slime", hp: 18, damage: 4, speed: 3.5, height: 0.7, width: 0.75, color: 0x55efc4, shape: "sphere", ai: "slime", drops: [{ item: "gel", count: 1, chance: 1 }] },
  purple_slime: { name: "Purple Slime", hp: 40, damage: 7, speed: 4.2, height: 0.95, width: 1, color: 0xa29bfe, shape: "sphere", ai: "slime", drops: [{ item: "gel", count: 3, chance: 1 }] },
  // night
  zombie: { name: "Zombie", hp: 45, damage: 7, speed: 2.8, height: 1.7, width: 0.6, color: 0x636e72, shape: "box", ai: "walker", drops: [{ item: "gel", count: 1, chance: 0.2 }, { item: "copper_coin", count: 50, chance: 0.6 }] },
  skeleton: { name: "Skeleton", hp: 55, damage: 9, speed: 3.2, height: 1.7, width: 0.55, color: 0xf5f0e6, shape: "box", ai: "walker", drops: [{ item: "bone", count: () => 1 + ((Math.random() * 2) | 0), chance: 0.7 }, { item: "silver_coin", count: 1, chance: 0.3 }] },
  demon_eye: { name: "Demon Eye", hp: 30, damage: 7, speed: 5.5, height: 0.8, width: 0.8, color: 0xff6b6b, emissive: 0x330000, shape: "eye", ai: "flyer", flying: true, attackRate: 2.2, projColor: 0xff6b6b, drops: [{ item: "lens", count: 1, chance: 0.5 }] },
  bat: { name: "Cave Bat", hp: 22, damage: 6, speed: 6.5, height: 0.5, width: 0.6, color: 0x2d3436, shape: "sphere", ai: "flyer", flying: true, attackRate: 2.8, drops: [{ item: "copper_coin", count: 15, chance: 0.4 }] },
  fire_imp: { name: "Fire Imp", hp: 70, damage: 11, speed: 4.5, height: 1.2, width: 0.7, color: 0xe17055, emissive: 0x441100, shape: "box", ai: "flyer", flying: true, attackRate: 1.6, projColor: 0xff7675, drops: [{ item: "ash", count: 2, chance: 0.6 }, { item: "hellstone", count: 1, chance: 0.15 }] },
  blood_zombie: { name: "Blood Zombie", hp: 80, damage: 12, speed: 3.6, height: 1.7, width: 0.65, color: 0xc0392b, shape: "box", ai: "walker", drops: [{ item: "gold_coin", count: 1, chance: 0.2 }, { item: "bone", count: 1, chance: 0.3 }] },
  demon: { name: "Demon", hp: 120, damage: 14, speed: 5, height: 1.8, width: 0.8, color: 0x6c5ce7, shape: "box", ai: "flyer", flying: true, attackRate: 1.4, projColor: 0xa29bfe, drops: [{ item: "demonite", count: 1, chance: 0.25 }] },
  hornet: { name: "Hornet", hp: 48, damage: 10, speed: 6, height: 0.7, width: 0.7, color: 0xf1c40f, shape: "sphere", ai: "flyer", flying: true, attackRate: 1.5, drops: [{ item: "vine", count: 1, chance: 0.4 }] },
  piranha: { name: "Piranha", hp: 30, damage: 9, speed: 5, height: 0.4, width: 0.7, color: 0xe17055, shape: "sphere", ai: "slime", drops: [{ item: "bass", count: 1, chance: 0.2 }] },
  angry_bones: { name: "Angry Bones", hp: 90, damage: 13, speed: 3.4, height: 1.7, width: 0.55, color: 0xdfe6e9, shape: "box", ai: "walker", drops: [{ item: "bone", count: 3, chance: 0.8 }] },
  dark_caster: { name: "Dark Caster", hp: 60, damage: 12, speed: 2.5, height: 1.7, width: 0.55, color: 0x5b2c6f, shape: "box", ai: "flyer", flying: true, attackRate: 1.3, projColor: 0x6c5ce7, drops: [{ item: "bone", count: 2, chance: 0.5 }] },
  // goblins
  goblin_peon: { name: "Goblin Peon", hp: 50, damage: 7, speed: 3.5, height: 1.5, width: 0.55, color: 0x00b894, shape: "box", ai: "walker", drops: [{ item: "copper_coin", count: 80, chance: 0.7 }] },
  goblin_thief: { name: "Goblin Thief", hp: 45, damage: 9, speed: 5, height: 1.5, width: 0.5, color: 0x55efc4, shape: "box", ai: "walker", drops: [{ item: "silver_coin", count: 2, chance: 0.5 }] },
  goblin_warrior: { name: "Goblin Warrior", hp: 110, damage: 13, speed: 2.8, height: 1.7, width: 0.65, color: 0x00cec9, shape: "box", ai: "walker", drops: [{ item: "silver_coin", count: 3, chance: 0.6 }] },
  goblin_sorcerer: { name: "Goblin Sorcerer", hp: 55, damage: 11, speed: 2.5, height: 1.6, width: 0.55, color: 0x6c5ce7, shape: "box", ai: "flyer", flying: true, attackRate: 1.5, projColor: 0xa29bfe, drops: [{ item: "gold_coin", count: 1, chance: 0.25 }] },
  // eclipse
  vampire: { name: "Vampire", hp: 150, damage: 18, speed: 5.5, height: 1.8, width: 0.6, color: 0x2d3436, shape: "box", ai: "flyer", flying: true, attackRate: 1.2, drops: [{ item: "gold_coin", count: 2, chance: 0.5 }] },
  frankenstein: { name: "Frankenstein", hp: 200, damage: 20, speed: 2.5, height: 2, width: 0.8, color: 0x55efc4, shape: "box", ai: "walker", drops: [{ item: "gold_coin", count: 3, chance: 0.6 }] },
  swollen_zombie: { name: "Swollen Zombie", hp: 180, damage: 17, speed: 2.2, height: 1.9, width: 0.85, color: 0x636e72, shape: "box", ai: "walker", drops: [{ item: "gel", count: 5, chance: 0.5 }] },
  eyezor: { name: "Eyezor", hp: 120, damage: 16, speed: 4.5, height: 1.2, width: 1.2, color: 0xff6b6b, shape: "eye", ai: "flyer", flying: true, attackRate: 1.1, drops: [{ item: "lens", count: 2, chance: 0.6 }] },
  // hardmode
  wraith: { name: "Wraith", hp: 160, damage: 22, speed: 6, height: 1.8, width: 0.6, color: 0x2d3436, shape: "box", ai: "flyer", flying: true, attackRate: 1.4, drops: [{ item: "soul_of_night", count: 1, chance: 0.3 }] },
  corruptor: { name: "Corruptor", hp: 200, damage: 24, speed: 5, height: 1.2, width: 1.2, color: 0x6c5ce7, shape: "sphere", ai: "flyer", flying: true, attackRate: 1.3, drops: [{ item: "soul_of_night", count: 1, chance: 0.4 }] },
  poss_armor: { name: "Possessed Armor", hp: 260, damage: 26, speed: 3, height: 1.8, width: 0.7, color: 0x636e72, shape: "box", ai: "walker", drops: [{ item: "soul_of_night", count: 1, chance: 0.25 }] },
  moss_hornet: { name: "Moss Hornet", hp: 180, damage: 25, speed: 7, height: 0.8, width: 0.8, color: 0x27ae60, shape: "sphere", ai: "flyer", flying: true, attackRate: 1.0, drops: [{ item: "chlorophyte_ore", count: 1, chance: 0.1 }] },

  // bosses
  king_slime: { name: "King Slime", hp: 1200, damage: 18, speed: 5, height: 2.8, width: 2.8, color: 0x0984e3, shape: "sphere", ai: "boss_slime", boss: true, drops: [{ item: "gel", count: 50, chance: 1 }, { item: "gold_ore", count: 12, chance: 1 }, { item: "gold_coin", count: 8, chance: 1 }, { item: "slime_crown", count: 1, chance: 0.1 }] },
  eye: { name: "Eye of Cthulhu", hp: 1600, damage: 15, speed: 9, height: 2.2, width: 2.2, color: 0xd63031, emissive: 0x440000, shape: "eye", ai: "boss_eye", flying: true, boss: true, drops: [{ item: "lens", count: 12, chance: 1 }, { item: "crystal", count: 6, chance: 1 }, { item: "gold_coin", count: 12, chance: 1 }, { item: "demonite", count: 8, chance: 1 }] },
  eater: { name: "Eater of Worlds", hp: 2500, damage: 16, speed: 11, height: 1.2, width: 1.2, color: 0x6c5ce7, shape: "sphere", ai: "boss_worm", flying: true, boss: true, drops: [{ item: "shadow_scale", count: 16, chance: 1 }, { item: "demonite", count: 14, chance: 1 }, { item: "gold_coin", count: 15, chance: 1 }] },
  brain: { name: "Brain of Cthulhu", hp: 2200, damage: 18, speed: 8, height: 2.4, width: 2.4, color: 0xe84393, shape: "sphere", ai: "boss_brain", flying: true, boss: true, drops: [{ item: "tissue_sample", count: 16, chance: 1 }, { item: "crystal", count: 8, chance: 1 }, { item: "gold_coin", count: 15, chance: 1 }] },
  queen_bee: { name: "Queen Bee", hp: 2800, damage: 21, speed: 10, height: 2, width: 2.5, color: 0xf1c40f, shape: "sphere", ai: "boss_bee", flying: true, boss: true, drops: [{ item: "vine", count: 20, chance: 1 }, { item: "gold_coin", count: 18, chance: 1 }, { item: "beenade", count: 20, chance: 0.5 }] },
  skeletron: { name: "Skeletron", hp: 3200, damage: 23, speed: 8, height: 2.4, width: 2.0, color: 0xdfe6e9, emissive: 0x222222, shape: "box", ai: "boss_skeletron", flying: true, boss: true, drops: [{ item: "bone", count: 40, chance: 1 }, { item: "gold_coin", count: 20, chance: 1 }, { item: "dungeon_brick", count: 30, chance: 1 }] },
  wall: { name: "Wall of Flesh", hp: 5000, damage: 29, speed: 6, height: 4.5, width: 3.5, color: 0xff7675, emissive: 0x550000, shape: "box", ai: "boss_wall", flying: true, boss: true, drops: [{ item: "hellstone", count: 40, chance: 1 }, { item: "pwnhammer", count: 1, chance: 1 }, { item: "gold_coin", count: 40, chance: 1 }, { item: "warrior_emblem", count: 1, chance: 0.33 }] },
  twins: { name: "The Twins", hp: 6000, damage: 33, speed: 11, height: 2.2, width: 2.2, color: 0xff6b6b, shape: "eye", ai: "boss_eye", flying: true, boss: true, drops: [{ item: "soul_of_sight", count: 25, chance: 1 }, { item: "hallowed_bar", count: 20, chance: 1 }, { item: "gold_coin", count: 30, chance: 1 }] },
  destroyer: { name: "The Destroyer", hp: 8000, damage: 34, speed: 12, height: 1.4, width: 1.4, color: 0x636e72, shape: "sphere", ai: "boss_worm", flying: true, boss: true, drops: [{ item: "soul_of_might", count: 25, chance: 1 }, { item: "hallowed_bar", count: 20, chance: 1 }, { item: "gold_coin", count: 30, chance: 1 }] },
  prime: { name: "Skeletron Prime", hp: 7000, damage: 37, speed: 9, height: 2.6, width: 2.2, color: 0xb2bec3, shape: "box", ai: "boss_skeletron", flying: true, boss: true, drops: [{ item: "soul_of_fright", count: 25, chance: 1 }, { item: "hallowed_bar", count: 20, chance: 1 }, { item: "gold_coin", count: 30, chance: 1 }] },
  plantera: { name: "Plantera", hp: 10000, damage: 41, speed: 8, height: 3, width: 3, color: 0xe84393, shape: "sphere", ai: "boss_plantera", flying: true, boss: true, drops: [{ item: "chlorophyte_ore", count: 30, chance: 1 }, { item: "temple_key", count: 1, chance: 1 }, { item: "gold_coin", count: 40, chance: 1 }] },
  golem: { name: "Golem", hp: 12000, damage: 45, speed: 5, height: 3.5, width: 2.8, color: 0xe17055, shape: "box", ai: "boss_golem", boss: true, drops: [{ item: "beetle_husks", count: 20, chance: 1 }, { item: "gold_coin", count: 45, chance: 1 }, { item: "picksaw", count: 1, chance: 0.3 }] },
  duke: { name: "Duke Fishron", hp: 14000, damage: 49, speed: 14, height: 2.5, width: 3, color: 0x00cec9, shape: "sphere", ai: "boss_bee", flying: true, boss: true, drops: [{ item: "gold_coin", count: 50, chance: 1 }, { item: "razorblade_typhoon", count: 1, chance: 0.25 }, { item: "bubble_gun", count: 1, chance: 0.25 }] },
  cultist: { name: "Lunatic Cultist", hp: 16000, damage: 53, speed: 10, height: 2, width: 1.2, color: 0xa29bfe, shape: "box", ai: "boss_cultist", flying: true, boss: true, drops: [{ item: "gold_coin", count: 55, chance: 1 }, { item: "ancient_manipulator", count: 1, chance: 1 }] },
  moonlord: { name: "Moon Lord", hp: 25000, damage: 66, speed: 7, height: 5, width: 4, color: 0xdfe6e9, emissive: 0x223344, shape: "box", ai: "boss_moon", flying: true, boss: true, drops: [{ item: "luminite", count: 50, chance: 1 }, { item: "portal_gun", count: 1, chance: 0.2 }, { item: "last_prism", count: 1, chance: 0.15 }, { item: "gold_coin", count: 100, chance: 1 }] },
  // invasions
  pirate_deckhand: { name: "Pirate Deckhand", hp: 140, damage: 23, speed: 3.4, height: 1.7, width: 0.6, color: 0xb2bec3, shape: "box", ai: "walker", drops: [{ item: "gold_coin", count: 1, chance: 0.4 }, { item: "sail", count: 1, chance: 0.2 }] },
  pirate_corsair: { name: "Pirate Corsair", hp: 180, damage: 26, speed: 3.8, height: 1.7, width: 0.6, color: 0x636e72, shape: "box", ai: "walker", drops: [{ item: "gold_coin", count: 2, chance: 0.5 }] },
  pirate_crossbower: { name: "Pirate Crossbower", hp: 120, damage: 25, speed: 3, height: 1.7, width: 0.55, color: 0xdfe6e9, shape: "box", ai: "flyer", flying: true, attackRate: 1.3, drops: [{ item: "silver_coin", count: 8, chance: 0.6 }] },
  pirate_deadeye: { name: "Pirate Deadeye", hp: 130, damage: 28, speed: 3.2, height: 1.7, width: 0.55, color: 0x2d3436, shape: "box", ai: "flyer", flying: true, attackRate: 1.1, drops: [{ item: "gold_coin", count: 1, chance: 0.45 }] },
  snowman_gangsta: { name: "Snowman Gangsta", hp: 150, damage: 25, speed: 3.5, height: 1.5, width: 0.7, color: 0xf0f5ff, shape: "box", ai: "walker", drops: [{ item: "ice", count: 3, chance: 0.5 }] },
  mister_stabby: { name: "Mister Stabby", hp: 160, damage: 30, speed: 4.2, height: 1.6, width: 0.55, color: 0x74b9ff, shape: "box", ai: "walker", drops: [{ item: "silver_coin", count: 10, chance: 0.5 }] },
  snow_balla: { name: "Snow Balla", hp: 200, damage: 26, speed: 2.8, height: 1.8, width: 0.9, color: 0xdfe6e9, shape: "sphere", ai: "slime", drops: [{ item: "ice", count: 5, chance: 0.6 }] },
  martian_drone: { name: "Martian Drone", hp: 180, damage: 31, speed: 7, height: 0.8, width: 0.9, color: 0x55efc4, shape: "sphere", ai: "flyer", flying: true, attackRate: 1.2, drops: [{ item: "martian_conduit", count: 1, chance: 0.3 }] },
  martian_walker: { name: "Martian Walker", hp: 280, damage: 34, speed: 3.2, height: 2.2, width: 0.9, color: 0x00b894, shape: "box", ai: "walker", drops: [{ item: "martian_conduit", count: 2, chance: 0.4 }] },
  martian_officer: { name: "Martian Officer", hp: 220, damage: 33, speed: 3.5, height: 1.8, width: 0.7, color: 0x81ecec, shape: "box", ai: "flyer", flying: true, attackRate: 1.0, drops: [{ item: "gold_coin", count: 3, chance: 0.5 }] },
  scutlix: { name: "Scutlix", hp: 300, damage: 37, speed: 5.5, height: 1.4, width: 1.6, color: 0x2d3436, shape: "box", ai: "walker", drops: [{ item: "martian_conduit", count: 2, chance: 0.35 }] },
  // extra bosses
  deerclops: { name: "Deerclops", hp: 3500, damage: 25, speed: 4.5, height: 3.2, width: 2.2, color: 0x2d3436, shape: "box", ai: "boss_golem", boss: true, drops: [{ item: "bone", count: 25, chance: 1 }, { item: "ice", count: 40, chance: 1 }, { item: "gold_coin", count: 18, chance: 1 }, { item: "deerclops_eyeball", count: 1, chance: 1 }] },
  queen_slime: { name: "Queen of Slimes", hp: 5500, damage: 31, speed: 7, height: 3, width: 3, color: 0xf8c8dc, shape: "sphere", ai: "boss_slime", boss: true, drops: [{ item: "gel", count: 80, chance: 1 }, { item: "hallowed_bar", count: 12, chance: 1 }, { item: "gold_coin", count: 25, chance: 1 }, { item: "blade_staff", count: 1, chance: 0.3 }] },
  empress: { name: "Empress of Light", hp: 13000, damage: 48, speed: 13, height: 2.8, width: 2.4, color: 0xfd79a8, shape: "sphere", ai: "boss_bee", flying: true, boss: true, drops: [{ item: "gold_coin", count: 50, chance: 1 }, { item: "soaring_insignia", count: 1, chance: 0.25 }, { item: "empress_wings", count: 1, chance: 0.25 }, { item: "prismatic_dye", count: 5, chance: 1 }] },
};

// materials referenced in drops that need to exist in ITEMS
export const EXTRA_DROP_ITEMS = [
  "soul_of_night", "tissue_sample", "beenade", "pwnhammer", "soul_of_sight", "soul_of_might",
  "soul_of_fright", "hallowed_bar", "temple_key", "beetle_husks", "picksaw", "bubble_gun",
  "ancient_manipulator", "luminite", "portal_gun",
];

export const BOSS_ORDER = [
  "king_slime", "eye", "eater", "brain", "queen_bee", "skeletron", "deerclops", "wall",
  "queen_slime", "twins", "destroyer", "prime", "plantera", "golem", "empress", "duke",
  "cultist", "moonlord",
];
