import type { BotContext } from '../types.js';
import { api, ApiClientError } from '../lib/api.js';
import { formatUsd } from '../utils/formatting.js';
import { getChainEmoji } from '../utils/chains.js';

export async function confirmSwapHandler(ctx: BotContext): Promise<void> {
  const telegramId = ctx.from?.id;
  const quote = ctx.session.pendingSwap;

  if (!telegramId) {
    await ctx.answerCallbackQuery({ text: '\u{274C} User not identified' });
    return;
  }

  if (!quote) {
    await ctx.answerCallbackQuery({ text: '\u{274C} Quote expired' });
    return;
  }

  // Check if quote has expired
  if (Date.now() > quote.expiresAt) {
    ctx.session.pendingSwap = undefined;
    ctx.session.step = 'idle';
    await ctx.answerCallbackQuery({ text: '\u{274C} Quote expired' });
    await ctx.editMessageText(
      '\u{274C} Quote has expired. Please request a new quote with /swap.'
    );
    return;
  }

  await ctx.answerCallbackQuery({ text: '\u{23F3} Processing...' });
  await ctx.editMessageText('\u{23F3} Building transaction...');

  try {
    // Build the swap transaction
    const buildResponse = await api.buildSwap(telegramId, {
      quoteId: quote.id,
      recipient: ctx.session.walletAddress ?? '',
    });

    await ctx.editMessageText(
      `\u{23F3} *Transaction built!*\n\n` +
        `Please sign the transaction in your wallet.\n\n` +
        `*Details:*\n` +
        `\u{2022} Chain: ${getChainEmoji(ctx.session.chainId)}\n` +
        `\u{2022} Contract: \`${buildResponse.to.slice(0, 10)}...${buildResponse.to.slice(-8)}\`\n` +
        `\u{2022} Gas Limit: ${buildResponse.gasLimit}\n\n` +
        `\u{26A0}\u{FE0F} Waiting for transaction submission...`,
      { parse_mode: 'Markdown' }
    );

    // In a real implementation, the user would sign and submit the transaction
    // through their wallet (TON Connect, WalletConnect, etc.)
    // For now, we simulate waiting for the transaction
    // The frontend/wallet would call submitSwap after the user signs

    // Store the build response for potential use
    // In production, you'd integrate with wallet connectors here

    ctx.session.pendingSwap = undefined;
    ctx.session.step = 'idle';

    // Show completion message (in production, this would be triggered
    // by webhook or polling after tx confirmation)
    setTimeout(async () => {
      try {
        await ctx.editMessageText(
          `${getChainEmoji(ctx.session.chainId)} *Swap Ready*\n\n` +
            `*From:* ${quote.amountInFormatted} ${quote.tokenIn.symbol}\n` +
            `*To:* ~${quote.amountOutFormatted} ${quote.tokenOut.symbol}\n\n` +
            `\u{1F517} *Sign this transaction in your wallet to complete the swap.*\n\n` +
            `Transaction data has been prepared. Connect your wallet to proceed.\n\n` +
            `_This quote will expire soon. Request a new one if needed._`,
          { parse_mode: 'Markdown' }
        );
      } catch {
        // Message might have been deleted or edited
      }
    }, 2000);
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof ApiClientError) {
      errorMessage = error.message;
      if (error.code === 'QUOTE_EXPIRED') {
        errorMessage = 'Quote has expired. Please request a new quote.';
      } else if (error.code === 'UNAUTHORIZED') {
        ctx.session.isAuthenticated = false;
        errorMessage = 'Session expired. Use /start to login again.';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    ctx.session.pendingSwap = undefined;
    ctx.session.step = 'idle';
    await ctx.editMessageText(`\u{274C} Error: ${errorMessage}`);
  }
}

export async function cancelSwapHandler(ctx: BotContext): Promise<void> {
  ctx.session.pendingSwap = undefined;
  ctx.session.step = 'idle';

  await ctx.answerCallbackQuery({ text: 'Swap cancelled' });
  await ctx.editMessageText('\u{274C} Swap cancelled.');
}
