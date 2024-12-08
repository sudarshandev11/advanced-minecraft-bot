const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const pvp = require('mineflayer-pvp').plugin;
const armorManager = require('mineflayer-armor-manager');
const { plugin: collectBlock } = require('mineflayer-collectblock');
const toolPlugin = require('mineflayer-tool').plugin;

const CombatManager = require('./src/combat/combat-manager');
const InventoryManager = require('./src/inventory');
const MovementManager = require('./src/movement');
const GrindManager = require('./src/grinding/grind-manager');

const config = {
  host: process.env.SERVER_IP || 'localhost',
  port: process.env.SERVER_PORT || 25565,
  username: process.env.BOT_USERNAME || 'PvPMaster',
  version: '1.19.2'
};

// Create bot instance
const bot = mineflayer.createBot(config);

// Load plugins
bot.loadPlugin(pathfinder);
bot.loadPlugin(pvp);
bot.loadPlugin(armorManager);
bot.loadPlugin(collectBlock);
bot.loadPlugin(toolPlugin);

// Initialize managers
let combatManager;
let inventoryManager;
let movementManager;
let grindManager;

bot.once('spawn', async () => {
  console.log('Enhanced PvP Bot has spawned!');
  
  const mcData = require('mineflayer').MinecraftData(bot.version);
  const movements = new Movements(bot, mcData);
  movements.allowParkour = true;
  movements.canDig = true;
  movements.allowSprinting = true;
  bot.pathfinder.setMovements(movements);

  // Initialize managers
  combatManager = new CombatManager(bot);
  inventoryManager = new InventoryManager(bot);
  movementManager = new MovementManager(bot);
  grindManager = new GrindManager(bot);

  await combatManager.init();
  await inventoryManager.init();
  await movementManager.init();
  await grindManager.init();

  bot.chat("Advanced PvP and Grinding Bot ready for action!");
});

// Enhanced chat commands
bot.on('chat', async (username, message) => {
  if (username === bot.username) return;

  const commands = {
    'attack': () => {
      const player = bot.players[username];
      if (!player?.entity) {
        bot.chat("I can't see you!");
        return;
      }
      grindManager.stopGrinding();
      combatManager.target = player.entity;
      combatManager.isInCombat = true;
      bot.chat("Engaging in combat!");
    },
    'grind': () => {
      combatManager.resetCombat();
      grindManager.startGrinding();
    },
    'stop': () => {
      movementManager.stopExploring();
      bot.pathfinder.setGoal(null);
      combatManager.resetCombat();
      grindManager.stopGrinding();
      bot.chat("All operations stopped!");
    },
    'status': () => {
      const health = Math.round(bot.health);
      const armor = inventoryManager.getTotalArmorPoints();
      const weapon = bot.inventory.items().find(item => 
        item.name.includes('sword') || 
        item.name.includes('bow') || 
        item.name === 'end_crystal'
      );
      bot.chat(`Health: ${health}/20, Armor: ${armor}/20, Weapon: ${weapon?.name || 'none'}`);
    }
  };

  const command = commands[message.toLowerCase()];
  if (command) {
    await command();
  }
});

// Error handling
bot.on('kicked', console.log);
bot.on('error', console.log);

// Auto-collect valuable items
bot.on('spawn', () => {
  const valuableItems = [
    'diamond', 'netherite', 'end_crystal', 'golden_apple',
    'totem_of_undying', 'enchanted_book', 'experience_bottle',
    'ancient_debris', 'emerald', 'ender_pearl'
  ];
  
  setInterval(async () => {
    if (combatManager.isInCombat) return;

    const item = bot.nearestEntity(e => 
      e.type === 'object' && 
      valuableItems.some(valuable => e.name.includes(valuable))
    );

    if (item) {
      await bot.collectBlock.collect(item);
    }
  }, 1000);
});