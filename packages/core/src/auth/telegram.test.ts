import { describe, it, expect, beforeEach } from 'vitest';
import { createHmac } from 'crypto';
import {
  initTelegramAuth,
  parseInitData,
  verifyTelegramWebAppData,
  verifyBotUser,
  generateReferralCodeFromTelegram,
  extractReferralCode,
  createTelegramLoginUrl,
  getTelegramDisplayName,
  type TelegramUser,
} from './telegram.js';

describe('Telegram Authentication', () => {
  const testBotToken = 'test-bot-token-12345:ABCdefGHIjklMNOpqrSTUvwxYZ';

  beforeEach(() => {
    initTelegramAuth({
      botToken: testBotToken,
      authValiditySeconds: 86400,
    });
  });

  /**
   * Helper to create valid initData with correct hash
   */
  function createValidInitData(
    user: TelegramUser,
    authDate: number,
    extras: Record<string, string> = {}
  ): string {
    const userData = JSON.stringify(user);
    const params = new Map<string, string>([
      ['user', userData],
      ['auth_date', authDate.toString()],
      ...Object.entries(extras),
    ]);

    // Create data check string (sorted, without hash)
    const entries = Array.from(params.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

    // Calculate hash
    const secretKey = createHmac('sha256', 'WebAppData').update(testBotToken).digest();
    const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    // Build query string
    params.set('hash', hash);
    return new URLSearchParams(Object.fromEntries(params)).toString();
  }

  describe('parseInitData', () => {
    it('should parse valid initData string', () => {
      const user = { id: 123456, first_name: 'John' };
      const authDate = Math.floor(Date.now() / 1000);
      const initData = createValidInitData(user, authDate);

      const parsed = parseInitData(initData);

      expect(parsed).not.toBeNull();
      expect(parsed?.user?.id).toBe(123456);
      expect(parsed?.user?.first_name).toBe('John');
      expect(parsed?.auth_date).toBe(authDate);
    });

    it('should return null for invalid JSON in user field', () => {
      const params = new URLSearchParams({
        user: 'invalid-json',
        auth_date: '1234567890',
        hash: 'somehash',
      });

      const parsed = parseInitData(params.toString());

      expect(parsed).toBeNull();
    });

    it('should return null for missing auth_date', () => {
      const params = new URLSearchParams({
        user: JSON.stringify({ id: 123, first_name: 'Test' }),
        hash: 'somehash',
      });

      const parsed = parseInitData(params.toString());

      expect(parsed).toBeNull();
    });

    it('should return null for missing hash', () => {
      const params = new URLSearchParams({
        user: JSON.stringify({ id: 123, first_name: 'Test' }),
        auth_date: '1234567890',
      });

      const parsed = parseInitData(params.toString());

      expect(parsed).toBeNull();
    });
  });

  describe('verifyTelegramWebAppData', () => {
    it('should verify valid initData', () => {
      const user = { id: 123456, first_name: 'John', username: 'johndoe' };
      const authDate = Math.floor(Date.now() / 1000);
      const initData = createValidInitData(user, authDate);

      const result = verifyTelegramWebAppData(initData);

      expect(result.valid).toBe(true);
      expect(result.user?.id).toBe(123456);
      expect(result.user?.username).toBe('johndoe');
    });

    it('should reject empty initData', () => {
      const result = verifyTelegramWebAppData('');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Init data is required');
    });

    it('should reject expired initData', () => {
      const user = { id: 123456, first_name: 'John' };
      const authDate = Math.floor(Date.now() / 1000) - 100000; // >24h ago
      const initData = createValidInitData(user, authDate);

      const result = verifyTelegramWebAppData(initData);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Init data has expired');
    });

    it('should reject future auth_date', () => {
      const user = { id: 123456, first_name: 'John' };
      const authDate = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
      const initData = createValidInitData(user, authDate);

      const result = verifyTelegramWebAppData(initData);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid auth date (future timestamp)');
    });

    it('should reject tampered data (invalid hash)', () => {
      const user = { id: 123456, first_name: 'John' };
      const authDate = Math.floor(Date.now() / 1000);
      const initData = createValidInitData(user, authDate);

      // Tamper with the data
      const tampered = initData.replace('John', 'Jane');

      const result = verifyTelegramWebAppData(tampered);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid hash signature');
    });

    it('should reject when bot token not configured', () => {
      initTelegramAuth({ botToken: '' });

      const result = verifyTelegramWebAppData('user=test&auth_date=123&hash=abc');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Telegram bot token not configured');
    });
  });

  describe('verifyBotUser', () => {
    it('should verify valid user ID', () => {
      const result = verifyBotUser(123456789);

      expect(result).not.toBeNull();
      expect(result?.telegramId).toBe('123456789');
    });

    it('should include username when provided', () => {
      const result = verifyBotUser(123456789, 'johndoe');

      expect(result?.telegramUsername).toBe('johndoe');
    });

    it('should reject zero user ID', () => {
      const result = verifyBotUser(0);

      expect(result).toBeNull();
    });

    it('should reject negative user ID', () => {
      const result = verifyBotUser(-1);

      expect(result).toBeNull();
    });

    it('should reject invalid types', () => {
      const result = verifyBotUser('not-a-number' as any);

      expect(result).toBeNull();
    });
  });

  describe('generateReferralCodeFromTelegram', () => {
    it('should generate consistent codes', () => {
      const code1 = generateReferralCodeFromTelegram('123456');
      const code2 = generateReferralCodeFromTelegram('123456');

      expect(code1).toBe(code2);
    });

    it('should generate different codes for different users', () => {
      const code1 = generateReferralCodeFromTelegram('123456');
      const code2 = generateReferralCodeFromTelegram('789012');

      expect(code1).not.toBe(code2);
    });

    it('should generate codes with CH prefix', () => {
      const code = generateReferralCodeFromTelegram('123456');

      expect(code.startsWith('CH')).toBe(true);
    });

    it('should generate uppercase alphanumeric codes', () => {
      const code = generateReferralCodeFromTelegram('123456');

      expect(code).toMatch(/^CH[A-Z0-9_-]+$/);
    });
  });

  describe('extractReferralCode', () => {
    it('should extract valid referral code', () => {
      const result = extractReferralCode('CHABCD1234');

      expect(result).toBe('CHABCD1234');
    });

    it('should uppercase the code', () => {
      const result = extractReferralCode('chabcd1234');

      expect(result).toBe('CHABCD1234');
    });

    it('should return null for undefined', () => {
      const result = extractReferralCode(undefined);

      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = extractReferralCode('');

      expect(result).toBeNull();
    });

    it('should return null for too short codes', () => {
      const result = extractReferralCode('ABC');

      expect(result).toBeNull();
    });

    it('should return null for too long codes', () => {
      const result = extractReferralCode('ABCDEFGHIJKLMNOP');

      expect(result).toBeNull();
    });

    it('should return null for invalid characters', () => {
      const result = extractReferralCode('ABC@#$123');

      expect(result).toBeNull();
    });
  });

  describe('createTelegramLoginUrl', () => {
    it('should create basic login URL', () => {
      const url = createTelegramLoginUrl('mybot');

      expect(url).toBe('https://t.me/mybot');
    });

    it('should include start parameter', () => {
      const url = createTelegramLoginUrl('mybot', 'REFCODE123');

      expect(url).toBe('https://t.me/mybot?start=REFCODE123');
    });

    it('should encode special characters in start param', () => {
      const url = createTelegramLoginUrl('mybot', 'CODE WITH SPACE');

      expect(url).toContain('start=CODE%20WITH%20SPACE');
    });
  });

  describe('getTelegramDisplayName', () => {
    it('should return @username when available', () => {
      const user: TelegramUser = {
        id: 123,
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
      };

      const name = getTelegramDisplayName(user);

      expect(name).toBe('@johndoe');
    });

    it('should return full name when no username', () => {
      const user: TelegramUser = {
        id: 123,
        first_name: 'John',
        last_name: 'Doe',
      };

      const name = getTelegramDisplayName(user);

      expect(name).toBe('John Doe');
    });

    it('should return first name only when no username or last name', () => {
      const user: TelegramUser = {
        id: 123,
        first_name: 'John',
      };

      const name = getTelegramDisplayName(user);

      expect(name).toBe('John');
    });
  });
});
