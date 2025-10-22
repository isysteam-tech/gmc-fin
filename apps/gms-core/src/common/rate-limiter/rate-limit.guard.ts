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
    const request = context.switchToHttp().getRequest();

    const model = request.params.model || request.body.model || 'default';

    const allowed = await rateLimiter.check(model);

    if (!allowed) {
      throw new BadRequestException(
        `Rate limit exceeded for model "${model}". Try again later.`,
      );
    }

    return true;
  }
}
