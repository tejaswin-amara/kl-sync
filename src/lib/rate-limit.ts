export class RateLimiter {
  private ipMap = new Map<string, { count: number; resetTime: number }>();
  private windowMs: number;
  private maxLimit: number;

  constructor(windowMs = 60000, maxLimit = 10) {
    this.windowMs = windowMs;
    this.maxLimit = maxLimit;
  }

  public check(ip: string): {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  } {
    const now = Date.now();
    let record = this.ipMap.get(ip);

    if (!record) {
      record = { count: 0, resetTime: now + this.windowMs };
      this.ipMap.set(ip, record);
    }

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + this.windowMs;
    }

    record.count++;

    // Clean up old entries occasionally to prevent memory leaks
    if (Math.random() < 0.01) this.cleanup(now);

    return {
      success: record.count <= this.maxLimit,
      limit: this.maxLimit,
      remaining: Math.max(0, this.maxLimit - record.count),
      reset: record.resetTime,
    };
  }

  private cleanup(now: number) {
    for (const [ip, record] of this.ipMap.entries()) {
      if (now > record.resetTime) {
        this.ipMap.delete(ip);
      }
    }
  }
}

// 10 requests per minute for login and captcha
export const authRateLimiter = new RateLimiter(60 * 1000, 10);
