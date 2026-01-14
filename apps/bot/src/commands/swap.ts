import { InlineKeyboard } from 'grammy';
import type { BotContext } from '../types.js';
import { getChainEmoji, getChainName } from '../utils/chains.js';
import { formatUsd, formatPercentage } from '../utils/formatting.js';
import { api, ApiClientError } from '../lib/api.js';

export async function swapHandler(ctx: BotContext): Promise<void> {
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

  const [tokenIn, tokenOut, amountStr] = args;
  const amount = parseFloat(amountStr ?? '0');

  if (isNaN(amount) || amount <= 0) {
    await ctx.reply('\u{274C} Invalid amount. Please provide a positive number.');
    return;
  }

  const loading = await ctx.reply('\u{23F3} Getting quote...');

  try {
    // Get quote from API
    const quote = await api.getQuote({
      chainId: ctx.session.chainId,
      tokenIn: tokenIn!,
      tokenOut: tokenOut!,
      amountIn: amount.toString(),
      slippage: (ctx.session.settings.slippageBps / 100).toString(),
    });

    // Calculate rate
    const amountInNum = parseFloat(quote.amountIn);
    const amountOutNum = parseFloat(quote.amountOut);
    const rate = amountOutNum / amountInNum;

    // Store pending swap in session
    ctx.session.pendingSwap = {
      id: quote.id,
      tokenIn: {
        address: quote.tokenIn.address,
        symbol: quote.tokenIn.symbol,
        decimals: quote.tokenIn.decimals,
        name: quote.tokenIn.name,
      },
      tokenOut: {
        address: quote.tokenOut.address,
        symbol: quote.tokenOut.symbol,
        decimals: quote.tokenOut.decimals,
        name: quote.tokenOut.name,
      },
      amountIn: quote.amountIn,
      amountInFormatted: amount.toString(),
      amountOut: quote.amountOut,
      amountOutFormatted: amountOutNum.toFixed(6),
      amountOutMin: quote.amountOutMin,
      rate,
      priceImpact: quote.priceImpact,
      dexName: quote.dexAggregator,
      expiresAt: new Date(quote.expiresAt).getTime(),
    };
    ctx.session.step = 'confirm_swap';

    // Format route info
    const routeInfo = quote.route.length > 1
      ? `\n*Route:* ${quote.route.map(r => r.dex).join(' → ')}`
      : '';

    const quoteText = `
${getChainEmoji(ctx.session.chainId)} *Swap Quote*

*You Pay:* ${amount} ${quote.tokenIn.symbol}
*You Receive:* ~${amountOutNum.toFixed(6)} ${quote.tokenOut.symbol}
*Min Received:* ${parseFloat(quote.amountOutMin).toFixed(6)} ${quote.tokenOut.symbol}

*Rate:* 1 ${quote.tokenIn.symbol} = ${rate.toFixed(6)} ${quote.tokenOut.symbol}
*Price Impact:* ${formatPercentage(quote.priceImpact)}
*DEX:* ${quote.dexAggregator}${routeInfo}

*Fees:*
\u{2022} Network: ${formatUsd(quote.fee.networkFeeUsd)}
\u{2022} Protocol: ${formatUsd(quote.fee.protocolFeeUsd)}
\u{2022} Total: ${formatUsd(quote.fee.totalFeeUsd)}

\u{26A0}\u{FE0F} Quote expires in 60 seconds
`;

    const keyboard = new InlineKeyboard()
      .text('\u{2705} Confirm Swap', `confirm_swap:${quote.id}`)
      .text('\u{274C} Cancel', 'cancel_swap');

    await ctx.api.editMessageText(ctx.chat!.id, loading.message_id, quoteText, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
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
      `\u{274C} Error getting quote: ${errorMessage}`
    );
  }
}
