# Advanced Crystal PvP Minecraft Bot

This is an advanced Minecraft bot specialized in Crystal PvP combat. The bot uses End Crystals strategically for combat, maintains optimal positioning, and manages resources effectively.

## Features

### Crystal Combat
- Strategic End Crystal placement and detonation
- Optimal distance maintenance
- Quick crystal response system
- Smart retreat mechanics
- Totem of Undying management

### Inventory Management
- Automatic crystal and obsidian tracking
- Totem of Undying equipment
- Resource monitoring and alerts
- Smart gear management

### Movement
- Strategic positioning for crystal combat
- Automatic exploration
- Stuck detection and recovery
- Smart following behavior

### Commands
- `come`: Bot will follow the player
- `stop`: Bot will stop all activities
- `explore`: Bot will explore the surrounding area
- `status`: Bot will report its health, hunger, and crystal count
- `crystalpvp`: Initiates crystal PvP mode

## Usage

1. Update the config in `bot.js` with your server details:
   - host: Your Minecraft server IP
   - port: Server port (default: 25565)
   - username: Bot's username
   - version: Minecraft version

2. Required items in inventory:
   - End Crystals
   - Obsidian
   - Totem of Undying
   - Sword (preferably diamond or netherite)

3. Run the bot:
   ```bash
   npm start
   ```

## Requirements

- Node.js
- A running Minecraft server (version 1.19.2+)
- Server must allow bot connections
- Access to End Crystals and related items