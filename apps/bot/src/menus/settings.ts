import { Menu } from '@grammyjs/menu';
import type { BotContext } from '../types.js';

const SLIPPAGE_OPTIONS = [50, 100, 200, 500];

export const settingsMenu = new Menu<BotContext>('settings-menu')
  .text(
    (ctx) =>
      `\u{1F4C9} Slippage: ${(ctx.session.settings.slippageBps / 100).toFixed(1)}%`,
    async (ctx) => {
      const currentIndex = SLIPPAGE_OPTIONS.indexOf(
        ctx.session.settings.slippageBps
      );
      const nextIndex = (currentIndex + 1) % SLIPPAGE_OPTIONS.length;
      ctx.session.settings.slippageBps = SLIPPAGE_OPTIONS[nextIndex] ?? 100;
      ctx.menu.update();
    }
  )
  .row()
  .text(
    (ctx) =>
      `${ctx.session.settings.notifications ? '\u{1F514}' : '\u{1F515}'} Notifications: ${ctx.session.settings.notifications ? 'ON' : 'OFF'}`,
    async (ctx) => {
      ctx.session.settings.notifications = !ctx.session.settings.notifications;
      ctx.menu.update();
    }
  )
  .row()
  .back('\u{00AB} Back');
