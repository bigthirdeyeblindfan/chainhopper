// @ts-nocheck
/**
 * JWT Token Generation and Verification
 *
 * Uses jose library for JWT operations (works in all JS environments)
 */

import * as jose from 'jose';

// JWT configuration
export interface JWTConfig {
  secret: string;
  issuer: string;
  audience: string;
  accessTokenExpiry: string; // e.g., '15m', '1h', '7d'
  refreshTokenExpiry: string;
}

// Token payload structure
export interface TokenPayload {
  sub: string; // user ID
  tier: string; // user tier
  type: 'access' | 'refresh';
}

// Decoded token with standard claims
export interface DecodedToken extends TokenPayload {
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

// Result types
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expires
}

export interface VerifyResult {
  valid: true;
  payload: DecodedToken;
}

export interface VerifyError {
  valid: false;
  error: 'expired' | 'invalid' | 'malformed';
  message: string;
}

export type VerifyTokenResult = VerifyResult | VerifyError;

// Default configuration
const DEFAULT_CONFIG: JWTConfig = {
  secret: process.env.JWT_SECRET || 'chainhopper-dev-secret-change-in-production',
  issuer: 'chainhopper',
  audience: 'chainhopper-api',
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
};

let config: JWTConfig = DEFAULT_CONFIG;
let secretKey: Uint8Array;

/**
 * Initialize JWT with custom configuration
 */
export function initJWT(customConfig: Partial<JWTConfig>): void {
  config = { ...DEFAULT_CONFIG, ...customConfig };
  secretKey = new TextEncoder().encode(config.secret);
}

/**
 * Get the secret key, initializing if needed
 */
function getSecretKey(): Uint8Array {
  if (!secretKey) {
    secretKey = new TextEncoder().encode(config.secret);
  }
  return secretKey;
}

/**
 * Parse expiry string to seconds
 */
function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      throw new Error(`Invalid expiry unit: ${unit}`);
  }
}

/**
 * Generate a JWT token pair (access + refresh)
 */
export async function generateTokens(
  userId: string,
  userTier: string
): Promise<TokenPair> {
  const secret = getSecretKey();
  const now = Math.floor(Date.now() / 1000);
  const accessExpiresIn = parseExpiry(config.accessTokenExpiry);

  // Generate access token
  const accessToken = await new jose.SignJWT({
    sub: userId,
    tier: userTier,
    type: 'access',
  } satisfies TokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(config.issuer)
    .setAudience(config.audience)
    .setIssuedAt(now)
    .setExpirationTime(`${config.accessTokenExpiry}`)
    .sign(secret);

  // Generate refresh token
  const refreshToken = await new jose.SignJWT({
    sub: userId,
    tier: userTier,
    type: 'refresh',
  } satisfies TokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(config.issuer)
    .setAudience(config.audience)
    .setIssuedAt(now)
    .setExpirationTime(`${config.refreshTokenExpiry}`)
    .sign(secret);

  return {
    accessToken,
    refreshToken,
    expiresIn: accessExpiresIn,
  };
}

/**
 * Generate only an access token (for token refresh)
 */
export async function generateAccessToken(
  userId: string,
  userTier: string
): Promise<{ token: string; expiresIn: number }> {
  const secret = getSecretKey();
  const expiresIn = parseExpiry(config.accessTokenExpiry);

  const token = await new jose.SignJWT({
    sub: userId,
    tier: userTier,
    type: 'access',
  } satisfies TokenPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(config.issuer)
    .setAudience(config.audience)
    .setIssuedAt()
    .setExpirationTime(`${config.accessTokenExpiry}`)
    .sign(secret);

  return { token, expiresIn };
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<VerifyTokenResult> {
  try {
    const secret = getSecretKey();

    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: config.issuer,
      audience: config.audience,
    });

    return {
      valid: true,
      payload: {
        sub: payload.sub as string,
        tier: payload.tier as string,
        type: payload.type as 'access' | 'refresh',
        iss: payload.iss as string,
        aud: payload.aud as string,
        exp: payload.exp as number,
        iat: payload.iat as number,
      },
    };
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      return {
        valid: false,
        error: 'expired',
        message: 'Token has expired',
      };
    }

    if (error instanceof jose.errors.JWTClaimValidationFailed) {
      return {
        valid: false,
        error: 'invalid',
        message: 'Token claims validation failed',
      };
    }

    return {
      valid: false,
      error: 'malformed',
      message: 'Token is malformed or invalid',
    };
  }
}

/**
 * Refresh tokens using a valid refresh token
 */
export async function refreshTokens(refreshToken: string): Promise<TokenPair | null> {
  const result = await verifyToken(refreshToken);

  if (!result.valid) {
    return null;
  }

  if (result.payload.type !== 'refresh') {
    return null;
  }

  return generateTokens(result.payload.sub, result.payload.tier);
}

/**
 * Decode token without verification (for debugging/logging)
 * WARNING: Do not trust this data for authorization
 */
export function decodeTokenUnsafe(token: string): TokenPayload | null {
  try {
    const decoded = jose.decodeJwt(token);
    return {
      sub: decoded.sub as string,
      tier: decoded.tier as string,
      type: decoded.type as 'access' | 'refresh',
    };
  } catch {
    return null;
  }
}
