import 'dotenv/config';
import { createBot } from './bot.js';

const BOT_TOKEN = process.env['BOT_TOKEN'];

if (!BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN environment variable is required');
  process.exit(1);
}

const bot = createBot(BOT_TOKEN);

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  bot.stop();
});

process.once('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  bot.stop();
});

// Start the bot
console.log('Starting ChainHopper Telegram Bot...');
bot.start({
  onStart: (botInfo) => {
    console.log(`Bot started as @${botInfo.username}`);
  },
});
