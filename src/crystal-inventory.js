class CrystalInventoryManager {
  constructor(bot) {
    this.bot = bot;
    this.crystalMinimum = 16;
    this.totemMinimum = 1;
  }

  async init() {
    this.bot.on('spawn', () => this.checkGear());
    setInterval(() => this.manageCrystalInventory(), 1000);
  }

  async checkGear() {
    await this.equipTotem();
    await this.ensureObsidian();
    await this.ensureCrystals();
  }

  async equipTotem() {
    const totem = this.bot.inventory.items().find(item => 
      item.name === 'totem_of_undying'
    );
    if (totem) {
      await this.bot.equip(totem, 'off-hand');
    }
  }

  async manageCrystalInventory() {
    const crystals = this.bot.inventory.items().filter(item => 
      item.name === 'end_crystal'
    );

    const obsidian = this.bot.inventory.items().filter(item => 
      item.name === 'obsidian'
    );

    if (crystals.length < this.crystalMinimum) {
      this.bot.chat("Need more end crystals!");
    }

    if (obsidian.length < 16) {
      this.bot.chat("Need more obsidian!");
    }

    // Ensure totem is equipped
    const offHand = this.bot.inventory.slots[45]; // Off-hand slot
    if (!offHand || offHand.name !== 'totem_of_undying') {
      await this.equipTotem();
    }
  }

  async ensureObsidian() {
    const obsidian = this.bot.inventory.items().find(item => 
      item.name === 'obsidian'
    );
    if (!obsidian) {
      this.bot.chat("Need obsidian for crystal PvP!");
    }
  }

  async ensureCrystals() {
    const crystals = this.bot.inventory.items().find(item => 
      item.name === 'end_crystal'
    );
    if (!crystals) {
      this.bot.chat("Need end crystals for crystal PvP!");
    }
  }
}

module.exports = CrystalInventoryManager;