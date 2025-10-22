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

        if (!authHeader) {
            throw new UnauthorizedException('Authorization header is missing');
        }

        const token = authHeader.split(' ')[1]; // Bearer <token>
        if (!token) {
            throw new UnauthorizedException('Token is missing');
        }

        try {
            let decoded = await this.usersService.verifyAccessToken(token);
            if (!decoded) {
                decoded = await this.usersService.verifyRefreshToken(token);
            }
            request.user = decoded; // Attach user to request
            // Check role-based access
            const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLE_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);
            if (!requiredRoles || requiredRoles.length === 0) {
                // No specific roles required, just valid token needed
                return true;
            }

            if (!decoded.role) {
                this.logger.warn(`No role found for user ${decoded.username}`);
                throw new ForbiddenException('User role not found');
            }

            const hasRole = requiredRoles.includes(decoded.role);
            if (!hasRole) {
                this.logger.warn(
                    `Access denied for user ${decoded.username} with role ${decoded.role}. Required roles: ${requiredRoles.join(', ')}`
                );
                throw new ForbiddenException(
                    `Access denied. Required roles: ${requiredRoles.join(', ')}`
                );
            }

            this.logger.log(`Access granted for user ${decoded.username} with role ${decoded.role}`);
            return true;
        } catch (error) {
            if (error.message.includes('jwt expired')) {
                throw new UnauthorizedException('Access token expired. Use refresh token to get a new one');
            }
            throw new UnauthorizedException('Invalid access token');
        }
    }
}