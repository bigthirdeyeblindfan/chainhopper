/**
 * Authentication Module
 *
 * Provides JWT, API Key, and Telegram authentication for ChainHopper
 */

// JWT authentication
export {
  initJWT,
  generateTokens,
  generateAccessToken,
  verifyToken,
  refreshTokens,
  decodeTokenUnsafe,
  type JWTConfig,
  type TokenPayload,
  type DecodedToken,
  type TokenPair,
  type VerifyResult,
  type VerifyError,
  type VerifyTokenResult,
} from './jwt.js';

// API Key authentication
export {
  generateApiKey,
  hashApiKey,
  validateApiKeyFormat,
  verifyApiKey,
  extractApiKeyFromHeader,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getDefaultPermissions,
  getAllPermissions,
  API_PERMISSIONS,
  type ApiKeyPermission,
  type GeneratedApiKey,
  type ApiKeyValidation,
} from './apiKey.js';

// Telegram authentication
export {
  initTelegramAuth,
  parseInitData,
  verifyTelegramWebAppData,
  verifyBotUser,
  generateReferralCodeFromTelegram,
  extractReferralCode,
  createTelegramLoginUrl,
  getTelegramDisplayName,
  type TelegramUser,
  type TelegramInitData,
  type TelegramVerifyResult,
  type TelegramAuthConfig,
} from './telegram.js';

// Middleware
export {
  initAuthMiddleware,
  jwtAuth,
  apiKeyAuth,
  telegramAuth,
  combinedAuth,
  optionalAuth,
  requirePermission,
  requireTier,
  rateLimit,
  type AuthLookupFunctions,
} from './middleware.js';
