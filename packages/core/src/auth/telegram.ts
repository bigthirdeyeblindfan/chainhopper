/**
 * Telegram User Verification
 *
 * Handles authentication for:
 * 1. Telegram Web App (Mini App) - validates initData
 * 2. Telegram Bot - validates user from update context
 *
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */

import { createHmac } from 'crypto';

// Telegram user data from Web App initData
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

// Parsed initData from Telegram Web App
export interface TelegramInitData {
  query_id?: string;
  user?: TelegramUser;
  auth_date: number;
  hash: string;
  start_param?: string;
  chat_type?: 'private' | 'group' | 'supergroup' | 'channel';
  chat_instance?: string;
}

// Verification result
export interface TelegramVerifyResult {
  valid: boolean;
  user?: TelegramUser;
  error?: string;
  authDate?: Date;
}

// Configuration
export interface TelegramAuthConfig {
  botToken: string;
  authValiditySeconds: number; // How long initData is valid (default: 86400 = 24h)
}

let config: TelegramAuthConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  authValiditySeconds: 86400, // 24 hours
};

/**
 * Initialize Telegram auth with custom configuration
 */
export function initTelegramAuth(customConfig: Partial<TelegramAuthConfig>): void {
  config = { ...config, ...customConfig };
}

/**
 * Parse the initData string from Telegram Web App
 *
 * @param initData - The raw initData string from Telegram
 * @returns Parsed init data object
 */
export function parseInitData(initData: string): TelegramInitData | null {
  try {
    const params = new URLSearchParams(initData);
    const result: Record<string, unknown> = {};

    for (const [key, value] of params.entries()) {
      if (key === 'user') {
        try {
          result.user = JSON.parse(value) as TelegramUser;
        } catch {
          return null;
        }
      } else if (key === 'auth_date') {
        result.auth_date = parseInt(value, 10);
      } else {
        result[key] = value;
      }
    }

    // Validate required fields
    if (typeof result.auth_date !== 'number' || typeof result.hash !== 'string') {
      return null;
    }

    return result as unknown as TelegramInitData;
  } catch {
    return null;
  }
}

/**
 * Create the data check string for validation
 *
 * @param initData - The raw initData string
 * @returns Sorted key=value pairs joined by newline
 */
function createDataCheckString(initData: string): string {
  const params = new URLSearchParams(initData);
  const entries: Array<[string, string]> = [];

  for (const [key, value] of params.entries()) {
    if (key !== 'hash') {
      entries.push([key, value]);
    }
  }

  // Sort alphabetically by key
  entries.sort((a, b) => a[0].localeCompare(b[0]));

  return entries.map(([key, value]) => `${key}=${value}`).join('\n');
}

/**
 * Validate Telegram Web App initData
 *
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * @param initData - The raw initData string from Telegram Web App
 * @returns Verification result with user data if valid
 */
export function verifyTelegramWebAppData(initData: string): TelegramVerifyResult {
  if (!config.botToken) {
    return {
      valid: false,
      error: 'Telegram bot token not configured',
    };
  }

  if (!initData) {
    return {
      valid: false,
      error: 'Init data is required',
    };
  }

  // Parse the init data
  const parsed = parseInitData(initData);
  if (!parsed) {
    return {
      valid: false,
      error: 'Invalid init data format',
    };
  }

  // Check auth_date is within validity period
  const now = Math.floor(Date.now() / 1000);
  const authAge = now - parsed.auth_date;

  if (authAge > config.authValiditySeconds) {
    return {
      valid: false,
      error: 'Init data has expired',
    };
  }

  if (authAge < 0) {
    return {
      valid: false,
      error: 'Invalid auth date (future timestamp)',
    };
  }

  // Create data check string
  const dataCheckString = createDataCheckString(initData);

  // Calculate secret key: HMAC-SHA256 of bot token with "WebAppData"
  const secretKey = createHmac('sha256', 'WebAppData')
    .update(config.botToken)
    .digest();

  // Calculate hash: HMAC-SHA256 of data check string with secret key
  const calculatedHash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Compare hashes (constant-time)
  if (!constantTimeCompare(calculatedHash, parsed.hash)) {
    return {
      valid: false,
      error: 'Invalid hash signature',
    };
  }

  return {
    valid: true,
    user: parsed.user,
    authDate: new Date(parsed.auth_date * 1000),
  };
}

/**
 * Verify a Telegram user ID from bot update context
 *
 * This is used when the bot receives a message/callback and we need to
 * create a session for the user. The bot framework (Grammy) handles
 * signature verification, so we just validate the user data.
 *
 * @param userId - Telegram user ID
 * @param username - Optional username
 * @returns User data for database
 */
export function verifyBotUser(
  userId: number,
  username?: string
): { telegramId: string; telegramUsername?: string } | null {
  if (!userId || typeof userId !== 'number' || userId <= 0) {
    return null;
  }

  return {
    telegramId: userId.toString(),
    telegramUsername: username,
  };
}

/**
 * Generate a unique referral code from Telegram user ID
 *
 * @param telegramId - The Telegram user ID
 * @returns A short referral code
 */
export function generateReferralCodeFromTelegram(telegramId: string): string {
  // Create a deterministic but non-obvious code
  const hash = createHmac('sha256', 'chainhopper-referral')
    .update(telegramId)
    .digest('base64url')
    .slice(0, 8)
    .toUpperCase();

  return `CH${hash}`;
}

/**
 * Extract start parameter (referral code) from deep link
 *
 * Telegram deep links: https://t.me/botname?start=REFERRAL_CODE
 *
 * @param startParam - The start parameter from Telegram
 * @returns The referral code or null
 */
export function extractReferralCode(startParam: string | undefined): string | null {
  if (!startParam) {
    return null;
  }

  // Validate format (alphanumeric, 6-12 chars)
  const trimmed = startParam.trim().toUpperCase();
  if (/^[A-Z0-9]{6,12}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Create a login URL for Telegram Web App
 *
 * @param botUsername - The bot's username (without @)
 * @param startParam - Optional start parameter (referral code)
 * @returns The Telegram deep link URL
 */
export function createTelegramLoginUrl(
  botUsername: string,
  startParam?: string
): string {
  const baseUrl = `https://t.me/${botUsername}`;

  if (startParam) {
    return `${baseUrl}?start=${encodeURIComponent(startParam)}`;
  }

  return baseUrl;
}

/**
 * Get display name for a Telegram user
 */
export function getTelegramDisplayName(user: TelegramUser): string {
  if (user.username) {
    return `@${user.username}`;
  }

  if (user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }

  return user.first_name;
}
