import type { BotContext } from '../types.js';
import { getChainEmoji, getChainName } from '../utils/chains.js';

export async function balanceHandler(ctx: BotContext): Promise<void> {
  if (!ctx.session.walletAddress) {
    await ctx.reply(
      `\u{274C} No wallet set.\n\n` +
        `Set your wallet first: \`/wallet <address>\``,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const loading = await ctx.reply('\u{23F3} Fetching balance...');

  try {
    // TODO: Integrate with actual API to fetch balance
    // For now, return placeholder message
    const balanceText = `
${getChainEmoji(ctx.session.chainId)} *${getChainName(ctx.session.chainId)} Balance*

\u{1F4B3} Wallet: \`${ctx.session.walletAddress.slice(0, 10)}...${ctx.session.walletAddress.slice(-6)}\`

\u{23F3} *Balance fetching not yet implemented*

This will show:
\u{2022} Native token balance
\u{2022} Token holdings
\u{2022} USD valuations
\u{2022} Total portfolio value
`;

    await ctx.api.editMessageText(ctx.chat!.id, loading.message_id, balanceText, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    await ctx.api.editMessageText(
      ctx.chat!.id,
      loading.message_id,
      `\u{274C} Error fetching balance: ${errorMessage}`
    );
  }
}
