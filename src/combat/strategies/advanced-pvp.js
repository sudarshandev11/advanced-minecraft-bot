const { goals } = require('mineflayer-pathfinder');
const Vec3 = require('vec3');

class AdvancedPvPStrategy {
  constructor(bot) {
    this.bot = bot;
    this.lastStrategyChange = Date.now();
    this.strategyDuration = 2000; // Change strategy every 2 seconds
    this.currentTactic = 'aggressive';
  }

  async execute(target) {
    if (!target) return;

    // Regularly switch tactics to be unpredictable
    if (Date.now() - this.lastStrategyChange > this.strategyDuration) {
      this.switchTactic();
    }

    switch (this.currentTactic) {
      case 'aggressive':
        await this.aggressiveTactic(target);
        break;
      case 'defensive':
        await this.defensiveTactic(target);
        break;
      case 'bait':
        await this.baitTactic(target);
        break;
      case 'surround':
        await this.surroundTactic(target);
        break;
    }
  }

  async aggressiveTactic(target) {
    const distance = this.bot.entity.position.distanceTo(target.position);
    
    // Sprint and jump for critical hits
    this.bot.setControlState('sprint', true);
    if (distance <= 3 && this.bot.entity.onGround) {
      await this.bot.setControlState('jump', true);
      setTimeout(() => this.bot.setControlState('jump', false), 100);
    }

    // Rapid weapon switching for faster hits
    await this.switchWeapons();
    
    // Attack with proper timing
    await this.bot.lookAt(target.position.offset(0, target.height * 0.9, 0));
    await this.bot.attack(target);
  }

  async defensiveTactic(target) {
    const distance = this.bot.entity.position.distanceTo(target.position);
    
    // Maintain safe distance
    if (distance < 4) {
      const awayVector = this.bot.entity.position.subtract(target.position).normalize();
      const retreatPos = this.bot.entity.position.plus(awayVector.scaled(5));
      this.bot.pathfinder.setGoal(new goals.GoalNear(retreatPos.x, retreatPos.y, retreatPos.z, 1));
    }

    // Block with shield if available
    const shield = this.bot.inventory.items().find(item => item.name === 'shield');
    if (shield && distance < 5) {
      await this.bot.equip(shield, 'off-hand');
      await this.bot.activateItem(false); // Block with shield
    }
  }

  async baitTactic(target) {
    const distance = this.bot.entity.position.distanceTo(target.position);
    
    // Pretend to be weak to bait the target
    if (distance > 5) {
      // Show back to enemy and walk slowly
      await this.bot.lookAt(target.position.offset(0, target.height * -0.9, 0));
      this.bot.setControlState('forward', true);
    } else {
      // Quick turn and attack
      await this.aggressiveTactic(target);
    }
  }

  async surroundTactic(target) {
    const distance = this.bot.entity.position.distanceTo(target.position);
    
    // Circle around target
    if (distance <= 3) {
      const angle = Math.atan2(
        this.bot.entity.position.z - target.position.z,
        this.bot.entity.position.x - target.position.x
      );
      
      const newAngle = angle + (Math.PI / 4); // 45-degree movement
      const circleRadius = 3;
      const newPos = new Vec3(
        target.position.x + Math.cos(newAngle) * circleRadius,
        target.position.y,
        target.position.z + Math.sin(newAngle) * circleRadius
      );

      this.bot.pathfinder.setGoal(new goals.GoalNear(newPos.x, newPos.y, newPos.z, 0.5));
    }

    // Attack while circling
    await this.bot.lookAt(target.position.offset(0, target.height * 0.9, 0));
    await this.bot.attack(target);
  }

  async switchWeapons() {
    const weapons = this.bot.inventory.items().filter(item => 
      item.name.includes('sword') || item.name.includes('axe')
    );

    if (weapons.length > 1) {
      const nextWeapon = weapons[Math.floor(Math.random() * weapons.length)];
      await this.bot.equip(nextWeapon, 'hand');
    }
  }

  switchTactic() {
    const tactics = ['aggressive', 'defensive', 'bait', 'surround'];
    const newTactic = tactics[Math.floor(Math.random() * tactics.length)];
    if (newTactic !== this.currentTactic) {
      this.currentTactic = newTactic;
      this.lastStrategyChange = Date.now();
    }
  }
}

module.exports = AdvancedPvPStrategy;