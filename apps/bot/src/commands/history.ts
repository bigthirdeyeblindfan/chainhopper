import type { BotContext } from '../types.js';
import { getChainEmoji, getChainName } from '../utils/chains.js';

export async function historyHandler(ctx: BotContext): Promise<void> {
  if (!ctx.session.walletAddress) {
    await ctx.reply(
      `\u{274C} No wallet set.\n\n` +
        `Set your wallet first: \`/wallet <address>\``,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const loading = await ctx.reply('\u{23F3} Fetching history...');

  try {
    // TODO: Integrate with actual API to fetch transaction history
    const historyText = `
${getChainEmoji(ctx.session.chainId)} *Transaction History*

Chain: *${getChainName(ctx.session.chainId)}*

\u{23F3} *History fetching not yet implemented*

This will show:
\u{2022} Recent swaps
\u{2022} P&L per trade
\u{2022} Transaction links
\u{2022} Fees paid
`;

    await ctx.api.editMessageText(
      ctx.chat!.id,
      loading.message_id,
      historyText,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    await ctx.api.editMessageText(
      ctx.chat!.id,
      loading.message_id,
      `\u{274C} Error fetching history: ${errorMessage}`
    );
  }
}
