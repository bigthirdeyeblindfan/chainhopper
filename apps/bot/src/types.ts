import type { Context, SessionFlavor } from 'grammy';
import type { ConversationFlavor } from '@grammyjs/conversations';
import type { MenuFlavor } from '@grammyjs/menu';

export type ChainId =
  | 'ton'
  | 'sonic'
  | 'kaia'
  | 'sui'
  | 'berachain'
  | 'sei'
  | 'linea'
  | 'scroll';

export type SessionStep =
  | 'idle'
  | 'awaiting_amount'
  | 'awaiting_token'
  | 'confirm_swap';

export interface SwapQuote {
  id: string;
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  amountIn: string;
  amountInFormatted: string;
  amountOut: string;
  amountOutFormatted: string;
  amountOutMin: string;
  rate: number;
  priceImpact: number;
  dexName: string;
  expiresAt: number;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  name?: string;
}

export interface SessionData {
  chainId: ChainId;
  walletAddress?: string;
  pendingSwap?: SwapQuote;
  step: SessionStep;
  settings: UserSettings;
}

export interface UserSettings {
  slippageBps: number;
  notifications: boolean;
  language: string;
}

export type BotContext = Context &
  SessionFlavor<SessionData> &
  ConversationFlavor &
  MenuFlavor;
