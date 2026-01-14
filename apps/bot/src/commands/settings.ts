import type { BotContext } from '../types.js';
import { settingsMenu } from '../menus/index.js';

export async function settingsHandler(ctx: BotContext): Promise<void> {
  const settingsText = `
\u{2699}\u{FE0F} *Bot Settings*

Configure your trading preferences:

*Current Settings:*
\u{2022} Slippage: ${(ctx.session.settings.slippageBps / 100).toFixed(1)}%
\u{2022} Notifications: ${ctx.session.settings.notifications ? 'ON' : 'OFF'}
\u{2022} Language: ${ctx.session.settings.language}

Tap buttons below to adjust:
`;

  await ctx.reply(settingsText, {
    parse_mode: 'Markdown',
    reply_markup: settingsMenu,
  });
}
