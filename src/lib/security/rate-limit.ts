// Pizza Harrison - Sliding Window In-Memory Rate Limiter
// Enforces abuse prevention on sensitive endpoints: login, signup, OTP send, checkout, and coupons.

interface RateLimitRecord {
  timestamps: number[];
}

export class InMemoryRateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();

  /**
   * Check and consume one token from the rate limit bucket.
   * @param key Unique identifier (e.g. `login:${ip}`, `otp:${phone}`)
   * @param limit Max allowed requests within window
   * @param windowMs Window duration in milliseconds
   * @returns { allowed: boolean, remaining: number, resetMs: number }
   */
  public check(key: string, limit: number, windowMs: number): {
    allowed: boolean;
    remaining: number;
    resetMs: number;
  } {
    const now = Date.now();
    const cutoff = now - windowMs;

    let record = this.records.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(key, record);
    }

    // Filter out expired timestamps
    record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

    if (record.timestamps.length >= limit) {
      const oldest = record.timestamps[0];
      const resetMs = Math.max(0, oldest + windowMs - now);
      return {
        allowed: false,
        remaining: 0,
        resetMs,
      };
    }

    record.timestamps.push(now);
    return {
      allowed: true,
      remaining: limit - record.timestamps.length,
      resetMs: windowMs,
    };
  }

  /**
   * Reset limits for a specific key (e.g. after successful login).
   */
  public reset(key: string): void {
    this.records.delete(key);
  }

  /**
   * Periodic garbage collection of stale keys.
   */
  public cleanup(maxAgeMs: number = 3600_000): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < maxAgeMs);
      if (record.timestamps.length === 0) {
        this.records.delete(key);
      }
    }
  }
}

export const RateLimiter = InMemoryRateLimiter;

// Global singleton instance
const globalForLimiter = globalThis as unknown as { rateLimiter: InMemoryRateLimiter };
export const rateLimiter = globalForLimiter.rateLimiter || new InMemoryRateLimiter();
if (process.env.NODE_ENV !== 'production') globalForLimiter.rateLimiter = rateLimiter;

// Helper constants for common rate limits
export const RATE_LIMITS = {
  LOGIN: { limit: 5, windowMs: 15 * 60 * 1000 },      // 5 attempts per 15 min
  OTP_SEND: { limit: 3, windowMs: 10 * 60 * 1000 },   // 3 OTP sends per 10 min
  ORDER_CREATE: { limit: 5, windowMs: 10 * 60 * 1000 }, // 5 orders per 10 min
  COUPON_VALIDATE: { limit: 12, windowMs: 60 * 1000 }, // 12 checks per minute
};
