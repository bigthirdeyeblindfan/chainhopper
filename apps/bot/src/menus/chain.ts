import { Menu } from '@grammyjs/menu';
import type { BotContext, ChainId } from '../types.js';
import { SUPPORTED_CHAINS, getChainEmoji, getChainName } from '../utils/chains.js';

export const chainMenu = new Menu<BotContext>('chain-menu');

SUPPORTED_CHAINS.forEach((chainId, index) => {
  chainMenu.text(
    (ctx) => {
      const isSelected = ctx.session.chainId === chainId;
      return `${getChainEmoji(chainId)} ${getChainName(chainId)}${isSelected ? ' \u{2713}' : ''}`;
    },
    async (ctx) => {
      const oldChain = ctx.session.chainId;
      ctx.session.chainId = chainId as ChainId;
      ctx.session.walletAddress = undefined;

      await ctx.editMessageText(
        `\u{2705} Switched from *${getChainName(oldChain)}* to *${getChainName(chainId)}*\n\n` +
          `Set wallet: \`/wallet <address>\``,
        { parse_mode: 'Markdown' }
      );
    }
  );

  if ((index + 1) % 2 === 0) {
    chainMenu.row();
  }
});

chainMenu.row().back('\u{00AB} Back');
