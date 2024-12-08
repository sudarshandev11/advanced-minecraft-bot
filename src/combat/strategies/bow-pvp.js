const { goals } = require('mineflayer-pathfinder');
const Vec3 = require('vec3');

class BowPvPStrategy {
  constructor(bot) {
    this.bot = bot;
    this.optimalDistance = 15;
    this.chargeTime = 1200;
  }

  async execute(target) {
    if (!target) return;

    const distance = this.bot.entity.position.distanceTo(target.position);
    
    // Maintain optimal distance
    if (Math.abs(distance - this.optimalDistance) > 2) {
      const direction = distance < this.optimalDistance ? -1 : 1;
      const moveVec = target.position.subtract(this.bot.entity.position).normalize();
      const goalPos = this.bot.entity.position.plus(moveVec.scaled(direction * 2));
      this.bot.pathfinder.setGoal(new goals.GoalNear(goalPos.x, goalPos.y, goalPos.z, 1));
    }

    // Aim and shoot
    await this.aimAndShoot(target);
  }

  async aimAndShoot(target) {
    const bow = this.bot.inventory.items().find(item => item.name.includes('bow'));
    if (!bow) return;

    await this.bot.equip(bow, 'hand');
    
    // Predict target movement
    const targetVelocity = target.velocity;
    const predictedPos = target.position.plus(targetVelocity.scaled(1.5));
    
    // Account for arrow drop
    const distance = this.bot.entity.position.distanceTo(target.position);
    const heightCompensation = Math.min(distance * 0.007, 1);
    
    await this.bot.lookAt(predictedPos.offset(0, target.height * heightCompensation, 0));
    
    // Charge and release
    await this.bot.activateItem();
    await new Promise(resolve => setTimeout(resolve, this.chargeTime));
    await this.bot.deactivateItem();
  }
}

module.exports = BowPvPStrategy;