class InventoryManager {
  constructor(bot) {
    this.bot = bot;
    this.armorSlots = ['head', 'torso', 'legs', 'feet'];
    this.preferredWeapons = ['diamond_sword', 'iron_sword', 'stone_sword', 'wooden_sword'];
  }

  async init() {
    this.bot.on('spawn', () => this.equipBestGear());
    setInterval(() => this.manageFoodAndHealth(), 3000);
  }

  async equipBestGear() {
    await this.equipBestArmor();
    await this.equipBestWeapon();
  }

  async equipBestArmor() {
    for (const slot of this.armorSlots) {
      const items = this.bot.inventory.items();
      const bestArmor = items.reduce((best, item) => {
        if (item.name.includes(slot) && (!best || this.getArmorPoints(item) > this.getArmorPoints(best))) {
          return item;
        }
        return best;
      }, null);

      if (bestArmor) {
        await this.bot.equip(bestArmor, slot);
      }
    }
  }

  async equipBestWeapon() {
    for (const weaponType of this.preferredWeapons) {
      const weapon = this.bot.inventory.items().find(item => item.name === weaponType);
      if (weapon) {
        await this.bot.equip(weapon, 'hand');
        break;
      }
    }
  }

  getArmorPoints(item) {
    const armorPoints = {
      diamond: 4,
      iron: 3,
      chainmail: 2,
      golden: 1,
      leather: 1
    };

    for (const [material, points] of Object.entries(armorPoints)) {
      if (item.name.includes(material)) return points;
    }
    return 0;
  }

  async manageFoodAndHealth() {
    if (this.bot.food < 15) {
      const foods = this.bot.inventory.items().filter(item => 
        ['cooked_beef', 'cooked_porkchop', 'bread', 'golden_apple'].includes(item.name)
      );
      
      if (foods.length > 0) {
        const bestFood = foods.sort((a, b) => this.getFoodPoints(b) - this.getFoodPoints(a))[0];
        await this.bot.equip(bestFood, 'hand');
        await this.bot.consume();
      }
    }
  }

  getFoodPoints(item) {
    const foodPoints = {
      'cooked_beef': 8,
      'cooked_porkchop': 8,
      'golden_apple': 4,
      'bread': 5
    };
    return foodPoints[item.name] || 0;
  }
}

module.exports = InventoryManager;