const { goals } = require('mineflayer-pathfinder');

class MovementManager {
  constructor(bot) {
    this.bot = bot;
    this.isExploring = false;
    this.lastPosition = null;
    this.stuckTimeout = null;
  }

  async init() {
    this.bot.on('physicsTick', () => this.checkStuck());
    setInterval(() => this.explore(), 10000);
  }

  async explore() {
    if (this.bot.pvp.target || !this.isExploring) return;

    const range = 20;
    const x = this.bot.entity.position.x + (Math.random() * range * 2) - range;
    const z = this.bot.entity.position.z + (Math.random() * range * 2) - range;
    const y = this.bot.entity.position.y;

    this.bot.pathfinder.setGoal(new goals.GoalNear(x, y, z, 1));
  }

  checkStuck() {
    if (!this.lastPosition) {
      this.lastPosition = this.bot.entity.position.clone();
      return;
    }

    const movement = this.bot.entity.position.distanceTo(this.lastPosition);
    if (movement < 0.1 && this.bot.pathfinder.isMoving()) {
      if (!this.stuckTimeout) {
        this.stuckTimeout = setTimeout(() => this.handleStuck(), 5000);
      }
    } else {
      if (this.stuckTimeout) {
        clearTimeout(this.stuckTimeout);
        this.stuckTimeout = null;
      }
    }

    this.lastPosition = this.bot.entity.position.clone();
  }

  async handleStuck() {
    this.bot.pathfinder.setGoal(null);
    const jumpPromise = this.bot.setControlState('jump', true);
    await new Promise(resolve => setTimeout(resolve, 250));
    await this.bot.setControlState('jump', false);
    await jumpPromise;
  }

  startExploring() {
    this.isExploring = true;
  }

  stopExploring() {
    this.isExploring = false;
    this.bot.pathfinder.setGoal(null);
  }
}

module.exports = MovementManager;