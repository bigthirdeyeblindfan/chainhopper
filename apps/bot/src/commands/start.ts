import type { BotContext } from '../types.js';
import { mainMenu } from '../menus/index.js';
import { getChainEmoji, getChainName } from '../utils/chains.js';

export async function startHandler(ctx: BotContext): Promise<void> {
  const welcomeMessage = `
\u{1F680} *Welcome to ChainHopper!*

Trade across multiple blockchains directly from Telegram.

*Supported Chains:*
\u{1F48E} TON | \u{1F994} Sonic | \u{1F535} Kaia | \u{1F30A} Sui | \u{1F43B} Berachain

*Quick Start:*
1\u{FE0F}\u{20E3} Set wallet: \`/wallet <address>\`
2\u{FE0F}\u{20E3} Check balance: \`/balance\`
3\u{FE0F}\u{20E3} Swap: \`/swap TON USDT 10\`

Current chain: ${getChainEmoji(ctx.session.chainId)} *${getChainName(ctx.session.chainId)}*

\u{26A0}\u{FE0F} *Security Notice:*
We will NEVER DM you first. Always verify the bot username.
`;

  await ctx.reply(welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: mainMenu,
  });
}
