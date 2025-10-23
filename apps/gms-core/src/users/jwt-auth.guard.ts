import { ForbiddenException, Injectable, Logger, SetMetadata, UnauthorizedException } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { UsersService } from './user.service';
import { Reflector } from '@nestjs/core';

export const ROLE_KEY = 'role';
export const Roles = (...role: string[]) => SetMetadata(ROLE_KEY, role);

@Injectable()
export class JwtAuthGuard implements CanActivate {
    private readonly logger = new Logger(JwtAuthGuard.name);

    constructor(private usersService: UsersService, private reflector: Reflector,) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        if (!authHeader) throw new UnauthorizedException('Authorization header missing');

        const token = authHeader.split(' ')[1];
        if (!token) throw new UnauthorizedException('Token is missing');

        try {
            const decoded = await this.usersService.verifyAccessToken(token);
            if (!decoded) throw new UnauthorizedException('Invalid access token');

            request.user = decoded;

            const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLE_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);
            if (!requiredRoles || requiredRoles.length === 0) return true;

            if (!decoded.role) throw new ForbiddenException('User role not found');
            if (!requiredRoles.includes(decoded.role))
                throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);

            return true;
        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedException('Access token expired. Use refresh token to get a new one');
            }
            throw new UnauthorizedException('Invalid access token');
        }
    }
}