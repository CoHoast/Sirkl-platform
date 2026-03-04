/**
 * Simple in-memory rate limiter
 * For production, use Redis-based rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Auth endpoints - strict
  'auth': { windowMs: 60 * 1000, maxRequests: 10 },  // 10 per minute
  'auth-login': { windowMs: 15 * 60 * 1000, maxRequests: 5 },  // 5 per 15 min (brute force protection)
  
  // API endpoints - moderate
  'api': { windowMs: 60 * 1000, maxRequests: 100 },  // 100 per minute
  
  // Webhook endpoints - permissive
  'webhook': { windowMs: 60 * 1000, maxRequests: 500 },  // 500 per minute
  
  // Default
  'default': { windowMs: 60 * 1000, maxRequests: 200 },
};

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS = 'default'
): RateLimitResult {
  const config = RATE_LIMITS[limitType] || RATE_LIMITS.default;
  const key = `${limitType}:${identifier}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  // Create new entry or reset if window expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }
  
  entry.count++;
  rateLimitStore.set(key, entry);
  
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const success = entry.count <= config.maxRequests;
  
  return {
    success,
    remaining,
    resetTime: entry.resetTime,
    limit: config.maxRequests,
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };
}

/**
 * Extract identifier from request (IP or API key)
 */
export function getIdentifier(request: Request): string {
  // Try to get API key from header
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey) return `apikey:${apiKey}`;
  
  // Fall back to IP
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'unknown';
  return `ip:${ip}`;
}
