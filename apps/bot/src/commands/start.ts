import type { BotContext } from '../types.js';
import { mainMenu } from '../menus/index.js';
import { getChainEmoji, getChainName } from '../utils/chains.js';
import { api } from '../lib/api.js';

export async function startHandler(ctx: BotContext): Promise<void> {
  const telegramUser = ctx.from;

  if (!telegramUser) {
    await ctx.reply('\u{274C} Unable to identify user.');
    return;
  }

  // Check for referral code in start parameter (deep link)
  const match = ctx.match;
  const referralCode = typeof match === 'string' && match.startsWith('ref_')
    ? match.slice(4)
    : undefined;

  // Authenticate user with the API
  try {
    const authData = {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
      auth_date: Math.floor(Date.now() / 1000),
      hash: '', // Hash will be computed server-side for bot-initiated auth
    };

    const tokens = await api.authenticateTelegram(telegramUser.id, authData);

    // Store auth state in session
    ctx.session.auth = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    };
    ctx.session.isAuthenticated = true;

    // Try to get user profile to fetch settings
    try {
      const profile = await api.getProfile(telegramUser.id);
      ctx.session.chainId = profile.settings.defaultChain;
      ctx.session.settings.slippageBps = profile.settings.defaultSlippage * 100;
      ctx.session.settings.notifications = profile.settings.notifications.tradeConfirmations;
    } catch {
      // Use defaults if profile fetch fails
    }

    const welcomeMessage = `
\u{1F680} *Welcome to ChainHopper!*

Trade across multiple blockchains directly from Telegram.
${referralCode ? `\n\u{1F381} Referral code applied: \`${referralCode}\`\n` : ''}
*Supported Chains:*
\u{1F48E} TON | \u{1F994} Sonic | \u{1F535} Kaia | \u{1F30A} Sui | \u{1F43B} Berachain

*Quick Start:*
1\u{FE0F}\u{20E3} Set wallet: \`/wallet <address>\`
2\u{FE0F}\u{20E3} Check balance: \`/balance\`
3\u{FE0F}\u{20E3} Swap: \`/swap TON USDT 10\`

Current chain: ${getChainEmoji(ctx.session.chainId)} *${getChainName(ctx.session.chainId)}*

\u{2705} *You are logged in!*

\u{26A0}\u{FE0F} *Security Notice:*
We will NEVER DM you first. Always verify the bot username.
`;

    await ctx.reply(welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: mainMenu,
    });
  } catch (error) {
    // If auth fails, still show welcome but note the user isn't logged in
    ctx.session.isAuthenticated = false;

    const welcomeMessage = `
\u{1F680} *Welcome to ChainHopper!*

Trade across multiple blockchains directly from Telegram.

*Supported Chains:*
\u{1F48E} TON | \u{1F994} Sonic | \u{1F535} Kaia | \u{1F30A} Sui | \u{1F43B} Berachain

*Quick Start:*
1\u{FE0F}\u{20E3} Set wallet: \`/wallet <address>\`
2\u{FE0F}\u{20E3} Check balance: \`/balance\`
3\u{FE0F}\u{20E3} Swap: \`/swap TON USDT 10\`

Current chain: ${getChainEmoji(ctx.session.chainId)} *${getChainName(ctx.session.chainId)}*

\u{26A0}\u{FE0F} *Connection issue - some features may be limited.*
Try again later or contact support.

\u{26A0}\u{FE0F} *Security Notice:*
We will NEVER DM you first. Always verify the bot username.
`;

    await ctx.reply(welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: mainMenu,
    });
  }
}
