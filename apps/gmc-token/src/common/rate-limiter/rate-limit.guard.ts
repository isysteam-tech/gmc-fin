import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { rateLimiter } from './rate-limiter';

@Injectable()
export class RateLimitGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowed = await rateLimiter.check();
    if (!allowed) {
      throw new BadRequestException('Rate limit exceeded. Try again later.');
    }
    return true;
  }
}
