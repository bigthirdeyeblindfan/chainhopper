import type { BotContext } from '../types.js';

export async function helpHandler(ctx: BotContext): Promise<void> {
  const helpMessage = `
\u{2753} *ChainHopper Help*

*Commands:*
\`/start\` - Welcome message & main menu
\`/help\` - Show this help
\`/chain\` - Switch blockchain
\`/wallet <address>\` - Set your wallet address
\`/balance\` - Check wallet balance
\`/swap <in> <out> <amount>\` - Execute a swap
\`/history\` - View transaction history
\`/settings\` - Bot settings

*Swap Examples:*
\`/swap TON USDT 10\` - Swap 10 TON to USDT
\`/swap native USDC 0.5\` - Swap 0.5 native token to USDC

*Our Fee Model:*
\u{1F4B0} You only pay when you profit!
15% profit-share (Free tier)
10% profit-share (1,000 $HOPPER holders)
5% profit-share (10,000 veHOPPER stakers)

*Support:*
Join our community for help and updates.
`;

  await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
}
