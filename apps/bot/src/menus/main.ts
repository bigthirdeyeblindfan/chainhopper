import { Menu } from '@grammyjs/menu';
import type { BotContext } from '../types.js';

export const mainMenu = new Menu<BotContext>('main-menu')
  .text('\u{1F4B0} Balance', async (ctx) => {
    await ctx.reply(
      'Use `/balance` to check your wallet balance.',
      { parse_mode: 'Markdown' }
    );
  })
  .text('\u{1F504} Swap', async (ctx) => {
    await ctx.reply(
      'Use: `/swap <tokenIn> <tokenOut> <amount>`\n\n' +
        '*Examples:*\n' +
        '`/swap TON USDT 10`\n' +
        '`/swap native USDC 0.5`',
      { parse_mode: 'Markdown' }
    );
  })
  .row()
  .submenu('\u{26D3}\u{FE0F} Chain', 'chain-menu')
  .submenu('\u{2699}\u{FE0F} Settings', 'settings-menu')
  .row()
  .text('\u{1F4CA} History', async (ctx) => {
    await ctx.reply(
      'Use `/history` to view your transaction history.',
      { parse_mode: 'Markdown' }
    );
  })
  .text('\u{2753} Help', async (ctx) => {
    await ctx.reply(
      '*Available Commands:*\n\n' +
        '`/start` - Welcome message\n' +
        '`/help` - Show help\n' +
        '`/chain` - Switch blockchain\n' +
        '`/wallet <address>` - Set wallet\n' +
        '`/balance` - Check balance\n' +
        '`/swap <in> <out> <amt>` - Execute swap\n' +
        '`/history` - Transaction history\n' +
        '`/settings` - Bot settings',
      { parse_mode: 'Markdown' }
    );
  });
