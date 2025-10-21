import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const apiKey = request.headers['admin-api-key'];

        if (!apiKey) {
            throw new UnauthorizedException('API key is required in x-api-key header');
        }

        const validApiKey = process.env.ADMIN_API_KEY;
        if (apiKey !== validApiKey) {
            throw new UnauthorizedException('Invalid API key');
        }

        return true;
    }
}