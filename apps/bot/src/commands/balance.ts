import type { BotContext } from '../types.js';
import { getChainEmoji, getChainName } from '../utils/chains.js';
import { formatUsd, truncateAddress } from '../utils/formatting.js';
import { api, ApiClientError } from '../lib/api.js';

export async function balanceHandler(ctx: BotContext): Promise<void> {
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

  const loading = await ctx.reply('\u{23F3} Fetching balance...');

  try {
    const response = await api.getBalances(telegramId, ctx.session.chainId);

    if (response.balances.length === 0) {
      await ctx.api.editMessageText(
        ctx.chat!.id,
        loading.message_id,
        `${getChainEmoji(ctx.session.chainId)} *${getChainName(ctx.session.chainId)} Balance*\n\n` +
          `\u{1F4B3} No tokens found on this chain.\n\n` +
          `Use /chain to switch chains or deposit funds to your wallet.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Format balance list
    const balanceLines = response.balances.map((b) => {
      const priceChange = b.priceChange24h
        ? b.priceChange24h >= 0
          ? `\u{1F7E2} +${b.priceChange24h.toFixed(2)}%`
          : `\u{1F534} ${b.priceChange24h.toFixed(2)}%`
        : '';
      return `*${b.token.symbol}*: ${b.balanceFormatted} (${formatUsd(b.valueUsd)}) ${priceChange}`;
    });

    const balanceText = `
${getChainEmoji(ctx.session.chainId)} *${getChainName(ctx.session.chainId)} Balance*

${ctx.session.walletAddress ? `\u{1F4B3} Wallet: \`${truncateAddress(ctx.session.walletAddress)}\`\n` : ''}
\u{1F4B0} *Total Value:* ${formatUsd(response.totalValueUsd)}

*Holdings:*
${balanceLines.join('\n')}
`;

    await ctx.api.editMessageText(ctx.chat!.id, loading.message_id, balanceText, {
      parse_mode: 'Markdown',
    });
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
      `\u{274C} Error fetching balance: ${errorMessage}`
    );
  }
}
