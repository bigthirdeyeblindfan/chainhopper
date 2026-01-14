import type { BotContext } from '../types.js';

export async function confirmSwapHandler(ctx: BotContext): Promise<void> {
  const quote = ctx.session.pendingSwap;

  if (!quote) {
    await ctx.answerCallbackQuery({ text: '\u{274C} Quote expired' });
    return;
  }

  await ctx.answerCallbackQuery({ text: '\u{23F3} Processing...' });
  await ctx.editMessageText('\u{23F3} Building transaction...');

  try {
    // TODO: Integrate with actual API to build and execute swap
    // For now, return placeholder message
    await ctx.editMessageText(
      '\u{23F3} *Swap execution not yet implemented*\n\n' +
        'When implemented, this will:\n' +
        '\u{2022} Build the swap transaction\n' +
        '\u{2022} Generate a signing link\n' +
        '\u{2022} Wait for confirmation\n' +
        '\u{2022} Notify on completion',
      { parse_mode: 'Markdown' }
    );

    ctx.session.pendingSwap = undefined;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    await ctx.editMessageText(`\u{274C} Error: ${errorMessage}`);
  }
}

export async function cancelSwapHandler(ctx: BotContext): Promise<void> {
  ctx.session.pendingSwap = undefined;
  ctx.session.step = 'idle';

  await ctx.answerCallbackQuery({ text: 'Swap cancelled' });
  await ctx.editMessageText('\u{274C} Swap cancelled.');
}
