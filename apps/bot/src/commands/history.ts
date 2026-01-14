import type { BotContext } from '../types.js';
import { getChainEmoji, getChainName } from '../utils/chains.js';
import { formatUsd, formatPercentage } from '../utils/formatting.js';
import { api, ApiClientError } from '../lib/api.js';

export async function historyHandler(ctx: BotContext): Promise<void> {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    await ctx.reply('\u{274C} Unable to identify user.');
    return;
  }

  if (!ctx.session.isAuthenticated) {
    await ctx.reply(
      `\u{274C} Not logged in.\n\n` +
        `Use /start to authenticate first.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const loading = await ctx.reply('\u{23F3} Fetching history...');

  try {
    const response = await api.getHistory(telegramId, {
      chainId: ctx.session.chainId,
      limit: 10,
    });

    if (response.trades.length === 0) {
      await ctx.api.editMessageText(
        ctx.chat!.id,
        loading.message_id,
        `${getChainEmoji(ctx.session.chainId)} *Transaction History*\n\n` +
          `Chain: *${getChainName(ctx.session.chainId)}*\n\n` +
          `No trades found. Start trading with /swap!`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Format trade history
    const tradeLines = response.trades.map((trade) => {
      const pnlEmoji = trade.profit !== undefined
        ? trade.profit >= 0 ? '\u{1F7E2}' : '\u{1F534}'
        : '\u{26AA}';
      const pnlText = trade.profit !== undefined
        ? ` ${pnlEmoji} ${trade.profit >= 0 ? '+' : ''}${formatUsd(trade.profit)} (${formatPercentage(trade.profitPercent ?? 0)})`
        : '';
      const date = new Date(trade.executedAt).toLocaleDateString();
      const typeEmoji = trade.type === 'buy' ? '\u{1F4C8}' : '\u{1F4C9}';

      return `${typeEmoji} *${trade.tokenIn.symbol}* → *${trade.tokenOut.symbol}*\n` +
        `   ${trade.tokenIn.amount} → ${trade.tokenOut.amount}${pnlText}\n` +
        `   Fee: ${formatUsd(trade.fee)} | ${date}`;
    });

    const historyText = `
${getChainEmoji(ctx.session.chainId)} *Transaction History*

Chain: *${getChainName(ctx.session.chainId)}*
Total Trades: ${response.total}

${tradeLines.join('\n\n')}
${response.total > 10 ? `\n_Showing 10 of ${response.total} trades_` : ''}
`;

    await ctx.api.editMessageText(
      ctx.chat!.id,
      loading.message_id,
      historyText,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof ApiClientError) {
      errorMessage = error.message;
      if (error.code === 'UNAUTHORIZED') {
        ctx.session.isAuthenticated = false;
        errorMessage = 'Session expired. Use /start to login again.';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    await ctx.api.editMessageText(
      ctx.chat!.id,
      loading.message_id,
      `\u{274C} Error fetching history: ${errorMessage}`
    );
  }
}
