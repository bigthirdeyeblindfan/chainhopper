# Agent D: Telegram Bot

## 🏆 Competitive Context

**What market leaders do well:**
- **Trojan**: 5-tier referral system ($65.8M paid out), Simple + Advanced modes
- **BONKbot**: Dead-simple UX, 1% fee → BONK burn narrative
- **Banana Gun**: 92% snipe win rate, fastest execution
- **Axiom**: Web + Telegram hybrid, perpetuals via Hyperliquid

**What they do poorly (our opportunities):**
- No cross-chain portfolio tracking
- No profit/loss tracking per position
- No public API for automation
- Basic AI integration (67% of Gen Z want better)
- Phishing vulnerabilities (2000% increase in 2024)

**Our must-have features:**
1. Profit-share fee display ("You only pay if you profit!")
2. P&L tracking per position and overall
3. Cross-chain balance aggregation
4. Clear security warnings (no DM support, verify bot username)
5. Referral dashboard with tier progress

---

## Your Responsibilities

You own the Telegram bot interface:
- Grammy framework setup
- Command handlers
- Inline keyboards and menus
- Session management
- Notifications

---

## Task List

### I-002: Telegram Bot Core
**Priority**: 🔴 Critical  
**Estimated Time**: 6-8 hours  
**Dependencies**: F-003

Create `apps/bot/src/`:

**Framework**: Grammy (TypeScript-native Telegram bot framework)

```typescript
// apps/bot/src/index.ts
import { Bot, Context, session } from 'grammy';
import { Menu } from '@grammyjs/menu';
import { conversations } from '@grammyjs/conversations';

// Session type
interface SessionData {
  chainId: ChainId;
  walletAddress?: string;
  pendingSwap?: SwapQuote;
  step: 'idle' | 'awaiting_amount' | 'confirm_swap';
}

type BotContext = Context & { session: SessionData };

const bot = new Bot<BotContext>(process.env.BOT_TOKEN!);

// Middleware
bot.use(session({ initial: () => ({ chainId: 'ton', step: 'idle' }) }));
bot.use(conversations());

// Commands
bot.command('start', startHandler);
bot.command('help', helpHandler);
bot.command('chain', chainHandler);
bot.command('wallet', walletHandler);
bot.command('balance', balanceHandler);
bot.command('swap', swapHandler);
bot.command('history', historyHandler);
bot.command('settings', settingsHandler);

// Menus
bot.use(mainMenu);
bot.use(chainMenu);
bot.use(settingsMenu);

// Callback queries
bot.callbackQuery(/^confirm_swap:/, confirmSwapHandler);
bot.callbackQuery(/^cancel_swap/, cancelSwapHandler);
bot.callbackQuery(/^chain:/, switchChainHandler);

// Start
bot.start();
```

---

## Command Specifications

### `/start`
Welcome message with main menu.

```typescript
async function startHandler(ctx: BotContext) {
  const welcomeMessage = `
🚀 *Welcome to ChainHopper!*

Trade across multiple blockchains directly from Telegram.

*Supported Chains:*
💎 TON | 🦔 Sonic | 🔵 Kaia | 🌊 Sui | 🐻 Berachain

*Quick Start:*
1️⃣ Set wallet: \`/wallet <address>\`
2️⃣ Check balance: \`/balance\`
3️⃣ Swap: \`/swap TON USDT 10\`

Current chain: ${getChainEmoji(ctx.session.chainId)} *${getChainName(ctx.session.chainId)}*
`;

  await ctx.reply(welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: mainMenu,
  });
}
```

### `/wallet <address>`
Set or view wallet address.

```typescript
async function walletHandler(ctx: BotContext) {
  const address = ctx.match?.trim();
  
  if (!address) {
    if (ctx.session.walletAddress) {
      await ctx.reply(
        `Current wallet: \`${ctx.session.walletAddress}\`\n\nUse \`/wallet <address>\` to change.`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await ctx.reply('No wallet set. Use `/wallet <address>` to set one.');
    }
    return;
  }
  
  // Validate address
  const adapter = await getAdapter(ctx.session.chainId);
  if (!adapter.validateAddress(address)) {
    await ctx.reply(`❌ Invalid address for ${getChainName(ctx.session.chainId)}`);
    return;
  }
  
  ctx.session.walletAddress = address;
  await ctx.reply(`✅ Wallet set: \`${address}\``, { parse_mode: 'Markdown' });
}
```

### `/balance`
Show wallet balances.

```typescript
async function balanceHandler(ctx: BotContext) {
  if (!ctx.session.walletAddress) {
    await ctx.reply('Set your wallet first: `/wallet <address>`', { parse_mode: 'Markdown' });
    return;
  }
  
  const loading = await ctx.reply('⏳ Fetching balance...');
  
  try {
    const balance = await api.getBalance(ctx.session.chainId, ctx.session.walletAddress);
    
    let text = `*${getChainEmoji(ctx.session.chainId)} ${getChainName(ctx.session.chainId)} Balance*\n\n`;
    text += `*${balance.nativeToken}:* ${balance.nativeBalanceFormatted}`;
    if (balance.nativeValueUsd) {
      text += ` (~$${balance.nativeValueUsd.toFixed(2)})`;
    }
    
    if (balance.tokens.length > 0) {
      text += '\n\n*Tokens:*\n';
      for (const token of balance.tokens.slice(0, 10)) {
        text += `• *${token.symbol}:* ${token.balanceFormatted}`;
        if (token.valueUsd) text += ` (~$${token.valueUsd.toFixed(2)})`;
        text += '\n';
      }
    }
    
    if (balance.totalValueUsd) {
      text += `\n*Total:* ~$${balance.totalValueUsd.toFixed(2)}`;
    }
    
    await ctx.api.editMessageText(ctx.chat!.id, loading.message_id, text, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    await ctx.api.editMessageText(ctx.chat!.id, loading.message_id, '❌ Error fetching balance');
  }
}
```

### `/swap <tokenIn> <tokenOut> <amount>`
Execute a swap.

```typescript
async function swapHandler(ctx: BotContext) {
  const args = ctx.match?.trim().split(/\s+/);
  
  if (!args || args.length < 3) {
    await ctx.reply(
      '*Usage:* `/swap <tokenIn> <tokenOut> <amount>`\n\n' +
      '*Examples:*\n' +
      '`/swap TON USDT 10`\n' +
      '`/swap native USDC 0.5`',
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  if (!ctx.session.walletAddress) {
    await ctx.reply('Set your wallet first: `/wallet <address>`', { parse_mode: 'Markdown' });
    return;
  }
  
  const [tokenIn, tokenOut, amountStr] = args;
  const amount = parseFloat(amountStr);
  
  if (isNaN(amount) || amount <= 0) {
    await ctx.reply('❌ Invalid amount');
    return;
  }
  
  const loading = await ctx.reply('⏳ Getting quote...');
  
  try {
    const quote = await api.getQuote({
      chainId: ctx.session.chainId,
      tokenIn,
      tokenOut,
      amountIn: parseAmount(amount, await getDecimals(ctx.session.chainId, tokenIn)),
      slippageBps: 100,
    });
    
    ctx.session.pendingSwap = quote;
    
    const quoteText = `
*${getChainEmoji(ctx.session.chainId)} Swap Quote*

*You Pay:* ${quote.amountInFormatted} ${quote.tokenIn.symbol}
*You Receive:* ~${quote.amountOutFormatted} ${quote.tokenOut.symbol}
*Min Received:* ${formatAmount(quote.amountOutMin, quote.tokenOut.decimals)} ${quote.tokenOut.symbol}

*Rate:* 1 ${quote.tokenIn.symbol} = ${quote.rate.toFixed(6)} ${quote.tokenOut.symbol}
*Price Impact:* ${quote.priceImpact.toFixed(2)}%
*DEX:* ${quote.dexName}

⚠️ Quote expires in 60 seconds
`;
    
    await ctx.api.editMessageText(ctx.chat!.id, loading.message_id, quoteText, {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard()
        .text('✅ Confirm', `confirm_swap:${quote.id}`)
        .text('❌ Cancel', 'cancel_swap'),
    });
  } catch (error) {
    await ctx.api.editMessageText(
      ctx.chat!.id,
      loading.message_id,
      `❌ Error: ${error.message}`
    );
  }
}
```

---

## Menus

### Main Menu
```typescript
const mainMenu = new Menu<BotContext>('main-menu')
  .text('💰 Balance', (ctx) => balanceHandler(ctx))
  .text('🔄 Swap', (ctx) => ctx.reply('Use: `/swap <in> <out> <amount>`', { parse_mode: 'Markdown' }))
  .row()
  .submenu('⛓️ Chain', 'chain-menu')
  .text('⚙️ Settings', (ctx) => settingsHandler(ctx))
  .row()
  .text('📊 History', (ctx) => historyHandler(ctx))
  .text('❓ Help', (ctx) => helpHandler(ctx));
```

### Chain Menu
```typescript
const chainMenu = new Menu<BotContext>('chain-menu');

const chains = ['ton', 'sonic', 'kaia', 'sui', 'berachain', 'sei', 'linea', 'scroll'];

chains.forEach((chainId, i) => {
  chainMenu.text(
    (ctx) => `${getChainEmoji(chainId)} ${getChainName(chainId)}${ctx.session.chainId === chainId ? ' ✓' : ''}`,
    async (ctx) => {
      ctx.session.chainId = chainId;
      ctx.session.walletAddress = undefined;
      await ctx.editMessageText(`Switched to *${getChainName(chainId)}*\n\nSet wallet: \`/wallet <address>\``, {
        parse_mode: 'Markdown',
      });
    }
  );
  if ((i + 1) % 2 === 0) chainMenu.row();
});

chainMenu.row().back('« Back');
```

---

## Callback Query Handlers

### Confirm Swap
```typescript
async function confirmSwapHandler(ctx: BotContext) {
  const quote = ctx.session.pendingSwap;
  
  if (!quote) {
    await ctx.answerCallbackQuery({ text: '❌ Quote expired' });
    return;
  }
  
  await ctx.answerCallbackQuery({ text: '⏳ Processing...' });
  await ctx.editMessageText('⏳ Building transaction...');
  
  try {
    const { transaction } = await api.buildSwap({
      ...quote,
      walletAddress: ctx.session.walletAddress,
    });
    
    const signUrl = generateSignUrl(ctx.session.chainId, transaction);
    
    await ctx.editMessageText(
      '✅ Transaction ready!\n\n' +
      'Sign the transaction in your wallet to complete the swap.\n\n' +
      `[Open Wallet](${signUrl})`,
      { parse_mode: 'Markdown' }
    );
    
    ctx.session.pendingSwap = undefined;
  } catch (error) {
    await ctx.editMessageText(`❌ Error: ${error.message}`);
  }
}
```

---

## Notifications

### Swap Completion Notification
```typescript
export async function notifySwapComplete(
  bot: Bot,
  telegramId: string,
  swap: SwapResult
) {
  const text = `
✅ *Swap Complete!*

*Sold:* ${swap.amountInFormatted} ${swap.tokenIn.symbol}
*Received:* ${swap.amountOutFormatted} ${swap.tokenOut.symbol}

[View Transaction](${swap.explorerUrl})
`;

  await bot.api.sendMessage(telegramId, text, { parse_mode: 'Markdown' });
}

export async function notifySwapFailed(
  bot: Bot,
  telegramId: string,
  error: string
) {
  await bot.api.sendMessage(telegramId, `❌ Swap failed: ${error}`);
}

export async function notifyPriceAlert(
  bot: Bot,
  telegramId: string,
  alert: PriceAlert
) {
  const direction = alert.currentPrice > alert.targetPrice ? '📈' : '📉';
  const text = `
${direction} *Price Alert!*

*${alert.token.symbol}* reached $${alert.currentPrice.toFixed(4)}
Target: $${alert.targetPrice.toFixed(4)}
`;

  await bot.api.sendMessage(telegramId, text, { parse_mode: 'Markdown' });
}
```

### Background Notification Worker
```typescript
import { Queue, Worker } from 'bullmq';

const notificationQueue = new Queue('notifications', { connection: redis });

export async function queueNotification(
  type: 'swap_complete' | 'swap_failed' | 'price_alert',
  telegramId: string,
  data: any
) {
  await notificationQueue.add(type, { telegramId, data });
}

const worker = new Worker('notifications', async (job) => {
  const { telegramId, data } = job.data;
  
  switch (job.name) {
    case 'swap_complete':
      await notifySwapComplete(bot, telegramId, data);
      break;
    case 'swap_failed':
      await notifySwapFailed(bot, telegramId, data);
      break;
    case 'price_alert':
      await notifyPriceAlert(bot, telegramId, data);
      break;
  }
}, { connection: redis });
```

---

## Wallet Deep Links

### TON (Tonkeeper/TonHub)
```typescript
function generateTonSignUrl(transaction: TonTransaction): string {
  const payload = {
    version: '0',
    body: {
      type: 'sign-raw-payload',
      params: {
        messages: transaction.messages.map(m => ({
          address: m.address,
          amount: m.amount,
          payload: m.payload,
        })),
      },
    },
  };
  
  return `https://app.tonkeeper.com/transfer/${encodeURIComponent(JSON.stringify(payload))}`;
}
```

### EVM (WalletConnect / MetaMask)
```typescript
function generateEvmSignUrl(chainId: number, transaction: EvmTransaction): string {
  const params = new URLSearchParams({
    action: 'send',
    to: transaction.to,
    value: transaction.value || '0',
    data: transaction.data,
    chainId: chainId.toString(),
  });
  
  return `metamask://wc?uri=${encodeURIComponent(wcUri)}`;
}
```

---

## Mini App Integration

For enhanced UX, create a Telegram Mini App:

```typescript
bot.command('trade', async (ctx) => {
  await ctx.reply('Open the trading interface:', {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '🚀 Open Trading App',
          web_app: { url: process.env.WEBAPP_URL },
        },
      ]],
    },
  });
});

bot.on('web_app_data', async (ctx) => {
  const data = JSON.parse(ctx.webAppData.data);
  
  if (data.type === 'swap_request') {
    await processSwapRequest(ctx, data);
  }
});
```

---

## File Structure

```
apps/bot/
├── src/
│   ├── index.ts              # Entry point
│   ├── bot.ts                # Bot instance & middleware
│   ├── commands/
│   │   ├── start.ts
│   │   ├── help.ts
│   │   ├── wallet.ts
│   │   ├── balance.ts
│   │   ├── swap.ts
│   │   ├── chain.ts
│   │   ├── history.ts
│   │   └── settings.ts
│   ├── menus/
│   │   ├── main.ts
│   │   ├── chain.ts
│   │   └── settings.ts
│   ├── callbacks/
│   │   ├── swap.ts
│   │   └── settings.ts
│   ├── notifications/
│   │   └── index.ts
│   ├── workers/
│   │   └── notifications.ts
│   ├── utils/
│   │   ├── formatting.ts
│   │   ├── deeplinks.ts
│   │   └── validation.ts
│   └── lib/
│       └── api.ts
├── tests/
│   └── commands/
└── locales/
    ├── en.json
    └── ru.json
```

---

## Integration Points

### From Agent B (API)
- Call REST API for all data operations
- Use same auth system (Telegram auth)

### To Agent E (Web)
- Mini App embeds web panel
- Shared user session

### WebSocket Integration
```typescript
const ws = new WebSocket(process.env.WS_URL);

ws.on('message', (data) => {
  const message = JSON.parse(data);
  
  if (message.type === 'swap_status') {
    const { swapId, status, telegramId } = message.data;
    
    if (status === 'confirmed') {
      queueNotification('swap_complete', telegramId, message.data);
    } else if (status === 'failed') {
      queueNotification('swap_failed', telegramId, message.data);
    }
  }
});
```

---

## Error Handling

```typescript
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error for ${ctx.update.update_id}:`, err.error);
  
  ctx.reply('❌ Something went wrong. Please try again.').catch(() => {});
  
  logError(err.error, { updateId: ctx.update.update_id });
});

process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());
```

---

## Rate Limiting

```typescript
import { limit } from '@grammyjs/ratelimiter';

bot.use(limit({
  timeFrame: 2000,
  limit: 3,
  onLimitExceeded: async (ctx) => {
    await ctx.reply('Please slow down!');
  },
}));
```

---

## Environment Variables

```env
BOT_TOKEN=your_telegram_bot_token
WEBAPP_URL=https://yourdomain.com/app
API_URL=http://localhost:3000
WS_URL=ws://localhost:3000
REDIS_URL=redis://localhost:6379
```

---

## Testing

```bash
npm test
BOT_TOKEN=test_token npm run test:integration
```

**Test Scenarios**:
1. Command parsing
2. Wallet validation per chain
3. Quote flow
4. Error handling
5. Menu navigation

---

## Handoff Notes

When complete:
1. Update ORCHESTRATION.md
2. Provide bot username to team
3. Document any Telegram API limitations
4. Note rate limits encountered
