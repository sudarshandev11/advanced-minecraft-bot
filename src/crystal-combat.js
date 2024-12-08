const { goals } = require('mineflayer-pathfinder');
const Vec3 = require('vec3');

class CrystalCombatManager {
  constructor(bot) {
    this.bot = bot;
    this.target = null;
    this.isInCombat = false;
    this.healthThreshold = 8;
    this.crystalPlaceDelay = 100; // ms
    this.lastCrystalPlace = 0;
    this.optimalDistance = 4; // blocks
  }

  async init() {
    this.bot.on('physicsTick', () => this.crystalPvpTick());
    this.bot.on('entitySpawn', (entity) => this.handleCrystalSpawn(entity));
  }

  async crystalPvpTick() {
    if (!this.isInCombat || !this.target) return;

    const currentTime = Date.now();
    if (currentTime - this.lastCrystalPlace < this.crystalPlaceDelay) return;

    // Check health and retreat if necessary
    if (this.bot.health <= this.healthThreshold) {
      await this.retreat();
      return;
    }

    // Find optimal position for crystal placement
    const crystalPos = this.findCrystalPlacement();
    if (crystalPos) {
      await this.placeCrystalAndDetonate(crystalPos);
      this.lastCrystalPlace = currentTime;
    }

    // Maintain optimal distance
    await this.maintainDistance();
  }

  findCrystalPlacement() {
    if (!this.target) return null;

    const targetPos = this.target.position;
    const searchRadius = 4;

    for (let x = -searchRadius; x <= searchRadius; x++) {
      for (let z = -searchRadius; z <= searchRadius; z++) {
        const pos = targetPos.offset(x, -1, z);
        if (this.isValidCrystalPosition(pos)) {
          return pos;
        }
      }
    }
    return null;
  }

  isValidCrystalPosition(pos) {
    const block = this.bot.blockAt(pos);
    const blockAbove = this.bot.blockAt(pos.offset(0, 1, 0));
    return block && 
           (block.name === 'obsidian' || block.name === 'bedrock') &&
           (!blockAbove || blockAbove.name === 'air');
  }

  async placeCrystalAndDetonate(pos) {
    try {
      // Equip crystal
      const crystal = this.bot.inventory.items().find(item => item.name === 'end_crystal');
      if (!crystal) return;
      await this.bot.equip(crystal, 'hand');

      // Place crystal
      const blockPos = pos.offset(0, 1, 0);
      await this.bot.placeBlock(this.bot.blockAt(pos), new Vec3(0, 1, 0));

      // Find placed crystal entity
      const placedCrystal = this.bot.nearestEntity(entity => 
        entity.name === 'end_crystal' &&
        entity.position.distanceTo(blockPos) < 1
      );

      if (placedCrystal) {
        // Switch to sword and attack
        const sword = this.bot.inventory.items().find(item => 
          item.name.includes('sword')
        );
        if (sword) {
          await this.bot.equip(sword, 'hand');
          await this.bot.attack(placedCrystal);
        }
      }
    } catch (err) {
      console.error('Crystal placement failed:', err);
    }
  }

  async handleCrystalSpawn(entity) {
    if (entity.name === 'end_crystal' && this.isInCombat) {
      // Quickly detonate enemy crystals if they're close
      const distance = entity.position.distanceTo(this.bot.entity.position);
      if (distance < 4) {
        const sword = this.bot.inventory.items().find(item => 
          item.name.includes('sword')
        );
        if (sword) {
          await this.bot.equip(sword, 'hand');
          await this.bot.attack(entity);
        }
      }
    }
  }

  async maintainDistance() {
    if (!this.target) return;

    const distance = this.bot.entity.position.distanceTo(this.target.position);
    if (Math.abs(distance - this.optimalDistance) > 1) {
      const direction = distance < this.optimalDistance ? -1 : 1;
      const moveVec = this.target.position.subtract(this.bot.entity.position).normalize();
      const goalPos = this.bot.entity.position.plus(moveVec.scaled(direction * 2));
      this.bot.pathfinder.setGoal(new goals.GoalNear(goalPos.x, goalPos.y, goalPos.z, 1));
    }
  }

  async retreat() {
    if (!this.target) return;
    
    const pos = this.target.position;
    const opposite = pos.offset(-pos.x * 5, 0, -pos.z * 5);
    this.bot.pathfinder.setGoal(new goals.GoalBlock(opposite.x, opposite.y, opposite.z));
    this.isInCombat = false;
  }
}

module.exports = CrystalCombatManager;