export interface RateLimitWindow {
  count: number;
  resetTime: number;
}

interface ModelLimit {
  limitPerMinute: number;
  limitPerHour: number;
}

class RateLimiter {
  // Track requests per model
  private modelWindows: Map<
    string,
    { minute: RateLimitWindow; hour: RateLimitWindow }
  > = new Map();

  // Define per-model rate limits
  private readonly modelLimits: Record<string, ModelLimit> = {
    chatgpt: { limitPerMinute: 20, limitPerHour: 300 },
    gemini: { limitPerMinute: 10, limitPerHour: 150 },
    claude: { limitPerMinute: 5, limitPerHour: 100 },
    default: { limitPerMinute: 15, limitPerHour: 200 },
  };

  private getWindows(model: string) {
    const now = Date.now();
    if (!this.modelWindows.has(model)) {
      this.modelWindows.set(model, {
        minute: { count: 0, resetTime: now + 60_000 },
        hour: { count: 0, resetTime: now + 3_600_000 },
      });
    }
    return this.modelWindows.get(model)!;
  }

  async check(model: string): Promise<boolean> {
    const now = Date.now();
    const limits = this.modelLimits[model] || this.modelLimits.default;
    const window = this.getWindows(model);

    // Reset windows when expired
    if (now > window.minute.resetTime) {
      window.minute = { count: 0, resetTime: now + 60_000 };
    }
    if (now > window.hour.resetTime) {
      window.hour = { count: 0, resetTime: now + 3_600_000 };
    }

    // Check limits
    if (
      window.minute.count >= limits.limitPerMinute ||
      window.hour.count >= limits.limitPerHour
    ) {
      return false;
    }

    // Increment usage
    window.minute.count++;
    window.hour.count++;

    return true;
  }

  getRemaining(model: string) {
    const limits = this.modelLimits[model] || this.modelLimits.default;
    const window = this.getWindows(model);
    return {
      remainingMinute: Math.max(0, limits.limitPerMinute - window.minute.count),
      remainingHour: Math.max(0, limits.limitPerHour - window.hour.count),
      nextResetMinute: window.minute.resetTime,
      nextResetHour: window.hour.resetTime,
    };
  }
}

export const rateLimiter = new RateLimiter();
