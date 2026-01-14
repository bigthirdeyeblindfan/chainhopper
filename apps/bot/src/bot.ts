import { Bot, session } from 'grammy';
import { limit } from '@grammyjs/ratelimiter';
import type { BotContext, SessionData } from './types.js';
import { mainMenu } from './menus/index.js';
import {
  startHandler,
  helpHandler,
  chainHandler,
  walletHandler,
  balanceHandler,
  swapHandler,
  historyHandler,
  settingsHandler,
} from './commands/index.js';
import { confirmSwapHandler, cancelSwapHandler } from './callbacks/index.js';

function createInitialSession(): SessionData {
  return {
    chainId: 'ton',
    walletAddress: undefined,
    pendingSwap: undefined,
    step: 'idle',
    settings: {
      slippageBps: 100,
      notifications: true,
      language: 'en',
    },
    auth: undefined,
    isAuthenticated: false,
  };
}

export function createBot(token: string): Bot<BotContext> {
  const bot = new Bot<BotContext>(token);

  // Rate limiting middleware
  bot.use(
    limit({
      timeFrame: 2000,
      limit: 3,
      onLimitExceeded: async (ctx) => {
        await ctx.reply('\u{23F3} Please slow down! Try again in a moment.');
      },
    })
  );

  // Session middleware
  bot.use(
    session({
      initial: createInitialSession,
    })
  );

  // Menu middleware
  bot.use(mainMenu);

  // Command handlers
  bot.command('start', startHandler);
  bot.command('help', helpHandler);
  bot.command('chain', chainHandler);
  bot.command('wallet', walletHandler);
  bot.command('balance', balanceHandler);
  bot.command('swap', swapHandler);
  bot.command('history', historyHandler);
  bot.command('settings', settingsHandler);

  // Callback query handlers
  bot.callbackQuery(/^confirm_swap:/, confirmSwapHandler);
  bot.callbackQuery('cancel_swap', cancelSwapHandler);

  // Error handler
  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error for update ${ctx.update.update_id}:`, err.error);

    ctx.reply('\u{274C} Something went wrong. Please try again.').catch(() => {
      // Ignore reply errors
    });
  });

  return bot;
}
