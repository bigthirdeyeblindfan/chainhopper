import { InlineKeyboard } from 'grammy';
import type { BotContext } from '../types.js';
import { getChainEmoji, getChainName } from '../utils/chains.js';

export async function swapHandler(ctx: BotContext): Promise<void> {
  const match = ctx.match;
  const args = typeof match === 'string' ? match.trim().split(/\s+/) : [];

  if (args.length < 3 || !args[0]) {
    await ctx.reply(
      `*Usage:* \`/swap <tokenIn> <tokenOut> <amount>\`\n\n` +
        `*Examples:*\n` +
        `\`/swap TON USDT 10\`\n` +
        `\`/swap native USDC 0.5\`\n` +
        `\`/swap USDT TON 100\``,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  if (!ctx.session.walletAddress) {
    await ctx.reply(
      `\u{274C} No wallet set.\n\n` +
        `Set your wallet first: \`/wallet <address>\``,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const [tokenIn, tokenOut, amountStr] = args;
  const amount = parseFloat(amountStr ?? '0');

  if (isNaN(amount) || amount <= 0) {
    await ctx.reply('\u{274C} Invalid amount. Please provide a positive number.');
    return;
  }

  const loading = await ctx.reply('\u{23F3} Getting quote...');

  try {
    // TODO: Integrate with actual API to get quote
    // For now, return placeholder quote UI
    const quoteText = `
${getChainEmoji(ctx.session.chainId)} *Swap Quote*

*You Pay:* ${amount} ${tokenIn?.toUpperCase()}
*You Receive:* ~??? ${tokenOut?.toUpperCase()}
*Min Received:* ??? ${tokenOut?.toUpperCase()}

*Rate:* 1 ${tokenIn?.toUpperCase()} = ??? ${tokenOut?.toUpperCase()}
*Price Impact:* ???%
*DEX:* TBD

\u{26A0}\u{FE0F} *Quote fetching not yet implemented*

This will show actual quotes from DEXs on *${getChainName(ctx.session.chainId)}*.
`;

    const keyboard = new InlineKeyboard()
      .text('\u{2705} Confirm', 'confirm_swap:placeholder')
      .text('\u{274C} Cancel', 'cancel_swap');

    await ctx.api.editMessageText(ctx.chat!.id, loading.message_id, quoteText, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    await ctx.api.editMessageText(
      ctx.chat!.id,
      loading.message_id,
      `\u{274C} Error getting quote: ${errorMessage}`
    );
  }
}
