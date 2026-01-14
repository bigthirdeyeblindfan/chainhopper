import type { BotContext } from '../types.js';
import { getChainName } from '../utils/chains.js';
import { truncateAddress } from '../utils/formatting.js';

export async function walletHandler(ctx: BotContext): Promise<void> {
  const match = ctx.match;
  const address = typeof match === 'string' ? match.trim() : '';

  if (!address) {
    if (ctx.session.walletAddress) {
      await ctx.reply(
        `\u{1F4B3} *Current Wallet*\n\n` +
          `Chain: *${getChainName(ctx.session.chainId)}*\n` +
          `Address: \`${ctx.session.walletAddress}\`\n\n` +
          `Use \`/wallet <address>\` to change.`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await ctx.reply(
        `\u{274C} No wallet set.\n\n` +
          `Use \`/wallet <address>\` to set one for *${getChainName(ctx.session.chainId)}*.`,
        { parse_mode: 'Markdown' }
      );
    }
    return;
  }

  // TODO: Add proper address validation per chain via adapter
  // For now, basic length validation
  if (address.length < 20) {
    await ctx.reply(
      `\u{274C} Invalid address for ${getChainName(ctx.session.chainId)}.\n\n` +
        `Please provide a valid wallet address.`
    );
    return;
  }

  ctx.session.walletAddress = address;
  await ctx.reply(
    `\u{2705} Wallet set!\n\n` +
      `Chain: *${getChainName(ctx.session.chainId)}*\n` +
      `Address: \`${truncateAddress(address)}\`\n\n` +
      `Use \`/balance\` to check your balance.`,
    { parse_mode: 'Markdown' }
  );
}
