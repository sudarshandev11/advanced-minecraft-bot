const { goals } = require('mineflayer-pathfinder');

class SwordPvPStrategy {
  constructor(bot) {
    this.bot = bot;
    this.attackRange = 3;
    this.criticalStrikeJumpDelay = 500;
    this.lastJump = 0;
  }

  async execute(target) {
    if (!target) return;

    const distance = this.bot.entity.position.distanceTo(target.position);
    
    // Perform critical hits by jumping
    const currentTime = Date.now();
    if (currentTime - this.lastJump > this.criticalStrikeJumpDelay && distance <= this.attackRange) {
      await this.bot.setControlState('jump', true);
      this.lastJump = currentTime;
      setTimeout(() => this.bot.setControlState('jump', false), 100);
    }

    // Sprint and attack
    if (distance <= this.attackRange) {
      this.bot.setControlState('sprint', true);
      await this.bot.lookAt(target.position.offset(0, target.height * 0.9, 0));
      await this.bot.attack(target);
    } else {
      // Close distance using pathfinder
      this.bot.pathfinder.setGoal(new goals.GoalFollow(target, 2));
    }

    // Strafe to avoid hits
    this.strafe();
  }

  strafe() {
    const direction = Math.random() > 0.5 ? 1 : -1;
    this.bot.setControlState('left', direction > 0);
    this.bot.setControlState('right', direction < 0);
    setTimeout(() => {
      this.bot.setControlState('left', false);
      this.bot.setControlState('right', false);
    }, 200);
  }
}

module.exports = SwordPvPStrategy;