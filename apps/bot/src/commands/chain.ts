import type { BotContext } from '../types.js';
import { chainMenu } from '../menus/index.js';
import { getChainEmoji, getChainName } from '../utils/chains.js';

export async function chainHandler(ctx: BotContext): Promise<void> {
  const chainMessage = `
\u{26D3}\u{FE0F} *Select Blockchain*

Current: ${getChainEmoji(ctx.session.chainId)} *${getChainName(ctx.session.chainId)}*

Tap a chain to switch:
`;

  await ctx.reply(chainMessage, {
    parse_mode: 'Markdown',
    reply_markup: chainMenu,
  });
}
