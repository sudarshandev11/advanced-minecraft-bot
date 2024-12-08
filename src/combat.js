const { goals } = require('mineflayer-pathfinder');

class CombatManager {
  constructor(bot) {
    this.bot = bot;
    this.target = null;
    this.isInCombat = false;
    this.healthThreshold = 8;
  }

  async init() {
    this.bot.on('entityHurt', (entity) => this.handleDamage(entity));
    this.bot.on('physicsTick', () => this.combatTick());
  }

  async handleDamage(entity) {
    if (entity === this.bot.entity && !this.isInCombat) {
      const attacker = this.bot.nearestEntity(e => e.type === 'player' && e.username !== this.bot.username);
      if (attacker) {
        this.target = attacker;
        this.isInCombat = true;
        await this.engageInCombat();
      }
    }
  }

  async combatTick() {
    if (!this.isInCombat) return;

    if (this.bot.health <= this.healthThreshold) {
      await this.retreat();
      return;
    }

    if (this.target && this.target.position) {
      const distance = this.bot.entity.position.distanceTo(this.target.position);
      if (distance > 16) {
        this.isInCombat = false;
        this.target = null;
      }
    }
  }

  async engageInCombat() {
    if (!this.target) return;

    // Equip best weapon and armor
    await this.bot.pvp.attack(this.target);
  }

  async retreat() {
    if (!this.target) return;
    
    const pos = this.target.position;
    const opposite = pos.offset(-pos.x * 3, 0, -pos.z * 3);
    this.bot.pathfinder.setGoal(new goals.GoalBlock(opposite.x, opposite.y, opposite.z));
    this.isInCombat = false;
  }
}

module.exports = CombatManager;