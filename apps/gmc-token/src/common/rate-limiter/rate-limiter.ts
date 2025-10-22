export interface RateLimitWindow {
  minute: { count: number; resetTime: number };
  hour: { count: number; resetTime: number };
}

class RateLimiter {
  private window: RateLimitWindow = {
    minute: { count: 0, resetTime: Date.now() + 60000 },
    hour: { count: 0, resetTime: Date.now() + 3600000 },
  };

  private readonly limits = {
    minute: 20,  // max 20 requests per minute
    hour: 300,   // max 300 requests per hour
  };

  async check(): Promise<boolean> {
    const now = Date.now();

    // Reset windows
    if (now > this.window.minute.resetTime)
      this.window.minute = { count: 0, resetTime: now + 60000 };

    if (now > this.window.hour.resetTime)
      this.window.hour = { count: 0, resetTime: now + 3600000 };

    // Check limits
    if (
      this.window.minute.count >= this.limits.minute ||
      this.window.hour.count >= this.limits.hour
    ) {
      return false;
    }

    // Increment counters
    this.window.minute.count++;
    this.window.hour.count++;

    return true;
  }

  getRemainingRequests() {
    return {
      minute: Math.max(0, this.limits.minute - this.window.minute.count),
      hour: Math.max(0, this.limits.hour - this.window.hour.count),
      nextResetMinute: this.window.minute.resetTime,
      nextResetHour: this.window.hour.resetTime,
    };
  }
}

export const rateLimiter = new RateLimiter();
