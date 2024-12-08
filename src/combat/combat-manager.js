const { goals } = require('mineflayer-pathfinder');
const SwordPvPStrategy = require('./strategies/sword-pvp');
const BowPvPStrategy = require('./strategies/bow-pvp');
const CrystalCombatManager = require('./crystal-combat');

class CombatManager {
  constructor(bot) {
    this.bot = bot;
    this.target = null;
    this.isInCombat = false;
    this.healthThreshold = 8;
    this.strategies = {
      sword: new SwordPvPStrategy(bot),
      bow: new BowPvPStrategy(bot),
      crystal: new CrystalCombatManager(bot)
    };
    this.currentStrategy = null;
  }

  async init() {
    this.bot.on('physicsTick', () => this.combatTick());
    this.bot.on('entityHurt', (entity) => this.handleDamage(entity));
  }

  async handleDamage(entity) {
    if (entity === this.bot.entity && !this.isInCombat) {
      const attacker = this.bot.nearestEntity(e => 
        e.type === 'player' && 
        e.username !== this.bot.username
      );
      if (attacker) {
        this.target = attacker;
        this.isInCombat = true;
        await this.selectStrategy();
      }
    }
  }

  async combatTick() {
    if (!this.isInCombat || !this.target) return;

    // Health management
    if (this.bot.health <= this.healthThreshold) {
      await this.handleLowHealth();
      return;
    }

    // Check if target is still valid
    if (!this.isValidTarget()) {
      this.resetCombat();
      return;
    }

    // Execute current strategy
    if (this.currentStrategy) {
      await this.currentStrategy.execute(this.target);
    }

    // Reassess strategy periodically
    if (Math.random() < 0.05) { // 5% chance each tick
      await this.selectStrategy();
    }
  }

  async selectStrategy() {
    const distance = this.target ? 
      this.bot.entity.position.distanceTo(this.target.position) : 0;

    // Get equipped items of target
    const targetArmor = this.getTargetArmor();
    const targetWeapon = this.getTargetWeapon();

    // Decision matrix for strategy selection
    if (this.hasEndCrystals() && targetArmor >= 15) {
      this.currentStrategy = this.strategies.crystal;
    } else if (this.hasBow() && distance > 10) {
      this.currentStrategy = this.strategies.bow;
    } else {
      this.currentStrategy = this.strategies.sword;
    }
  }

  getTargetArmor() {
    if (!this.target || !this.target.equipment) return 0;
    
    const armorPoints = {
      leather: 1,
      chainmail: 2,
      iron: 3,
      diamond: 4,
      netherite: 5
    };

    let total = 0;
    ['helmet', 'chestplate', 'leggings', 'boots'].forEach(slot => {
      const item = this.target.equipment[slot];
      if (item) {
        for (const [material, points] of Object.entries(armorPoints)) {
          if (item.name.includes(material)) {
            total += points;
            break;
          }
        }
      }
    });

    return total;
  }

  getTargetWeapon() {
    if (!this.target || !this.target.equipment || !this.target.equipment.mainhand) {
      return null;
    }
    return this.target.equipment.mainhand.name;
  }

  hasEndCrystals() {
    return this.bot.inventory.items().some(item => item.name === 'end_crystal');
  }

  hasBow() {
    return this.bot.inventory.items().some(item => item.name.includes('bow'));
  }

  isValidTarget() {
    return this.target && 
           this.target.isValid && 
           this.target.position.distanceTo(this.bot.entity.position) <= 30;
  }

  async handleLowHealth() {
    // Try to use health potions or golden apples
    const healthItems = this.bot.inventory.items().find(item => 
      item.name === 'golden_apple' || 
      item.name === 'splash_potion' && item.nbt?.type === 'healing'
    );

    if (healthItems) {
      await this.bot.equip(healthItems, 'hand');
      if (healthItems.name === 'golden_apple') {
        await this.bot.consume();
      } else {
        await this.bot.useOn(this.bot.entity);
      }
    }

    // Tactical retreat
    await this.retreat();
  }

  async retreat() {
    if (!this.target) return;
    
    const pos = this.target.position;
    const opposite = pos.offset(-pos.x * 5, 0, -pos.z * 5);
    this.bot.pathfinder.setGoal(new goals.GoalBlock(opposite.x, opposite.y, opposite.z));
    this.resetCombat();
  }

  resetCombat() {
    this.isInCombat = false;
    this.target = null;
    this.currentStrategy = null;
  }
}

module.exports = CombatManager;