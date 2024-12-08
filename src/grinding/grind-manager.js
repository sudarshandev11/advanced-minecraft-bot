const { goals } = require('mineflayer-pathfinder');
const Vec3 = require('vec3');

class GrindManager {
  constructor(bot) {
    this.bot = bot;
    this.isGrinding = false;
    this.targetResources = new Set([
      'diamond_ore', 'ancient_debris', 'gold_ore', 'iron_ore',
      'emerald_ore', 'redstone_ore', 'lapis_ore'
    ]);
    this.mobGrindingTargets = new Set([
      'zombie', 'skeleton', 'spider', 'enderman'
    ]);
  }

  async init() {
    this.bot.on('physicsTick', () => this.grindTick());
    setInterval(() => this.checkInventorySpace(), 5000);
  }

  async grindTick() {
    if (!this.isGrinding) return;

    // Priority order: Valuable mobs > Resources > Common mobs
    const target = this.findBestGrindTarget();
    if (target) {
      await this.handleTarget(target);
    } else {
      await this.exploreForTargets();
    }
  }

  findBestGrindTarget() {
    // First priority: Valuable mobs (enderman, etc.)
    const valuableMob = this.bot.nearestEntity(e => 
      this.mobGrindingTargets.has(e.name) && 
      e.name === 'enderman'
    );
    if (valuableMob) return { type: 'mob', entity: valuableMob };

    // Second priority: Valuable ores
    const valuableBlock = this.findNearestValuableBlock();
    if (valuableBlock) return { type: 'block', block: valuableBlock };

    // Third priority: Common mobs
    const commonMob = this.bot.nearestEntity(e => 
      this.mobGrindingTargets.has(e.name)
    );
    if (commonMob) return { type: 'mob', entity: commonMob };

    return null;
  }

  findNearestValuableBlock() {
    const searchRadius = 32;
    const playerPos = this.bot.entity.position;

    for (let x = -searchRadius; x <= searchRadius; x++) {
      for (let y = -searchRadius; y <= searchRadius; y++) {
        for (let z = -searchRadius; z <= searchRadius; z++) {
          const pos = playerPos.offset(x, y, z);
          const block = this.bot.blockAt(pos);
          if (block && this.targetResources.has(block.name)) {
            return block;
          }
        }
      }
    }
    return null;
  }

  async handleTarget(target) {
    if (target.type === 'mob') {
      await this.handleMobTarget(target.entity);
    } else if (target.type === 'block') {
      await this.handleBlockTarget(target.block);
    }
  }

  async handleMobTarget(mob) {
    const distance = this.bot.entity.position.distanceTo(mob.position);
    
    if (distance > 16) {
      this.bot.pathfinder.setGoal(new goals.GoalFollow(mob, 3));
    } else {
      // Equip best weapon
      const sword = this.bot.inventory.items().find(item => 
        item.name.includes('sword')
      );
      if (sword) await this.bot.equip(sword, 'hand');

      // Attack with proper timing
      if (this.bot.entity.onGround) {
        await this.bot.lookAt(mob.position.offset(0, mob.height * 0.9, 0));
        await this.bot.attack(mob);
      }
    }
  }

  async handleBlockTarget(block) {
    const tool = this.bot.inventory.items().find(item => 
      item.name.includes('pickaxe')
    );
    if (tool) {
      await this.bot.equip(tool, 'hand');
      try {
        await this.bot.dig(block);
      } catch (err) {
        console.error('Mining failed:', err);
      }
    }
  }

  async exploreForTargets() {
    const range = 32;
    const x = this.bot.entity.position.x + (Math.random() * range * 2) - range;
    const z = this.bot.entity.position.z + (Math.random() * range * 2) - range;
    const y = this.findSafeY(x, z);

    this.bot.pathfinder.setGoal(new goals.GoalNear(x, y, z, 2));
  }

  findSafeY(x, z) {
    const y = this.bot.entity.position.y;
    const block = this.bot.blockAt(new Vec3(x, y, z));
    return block ? block.position.y : y;
  }

  async checkInventorySpace() {
    const inventory = this.bot.inventory.items();
    if (inventory.length >= this.bot.inventory.slots.length - 5) {
      await this.manageInventory();
    }
  }

  async manageInventory() {
    const valuableItems = new Set([
      'diamond', 'netherite', 'ancient_debris', 'gold_ingot',
      'iron_ingot', 'emerald', 'ender_pearl', 'experience_bottle'
    ]);

    // Drop less valuable items first
    for (const item of this.bot.inventory.items()) {
      if (!valuableItems.has(item.name) && 
          !item.name.includes('sword') && 
          !item.name.includes('pickaxe') && 
          !item.name.includes('armor')) {
        await this.bot.tossStack(item);
      }
    }
  }

  startGrinding() {
    this.isGrinding = true;
    this.bot.chat("Starting resource and XP grinding...");
  }

  stopGrinding() {
    this.isGrinding = false;
    this.bot.pathfinder.setGoal(null);
    this.bot.chat("Stopping grinding operations.");
  }
}

module.exports = GrindManager;