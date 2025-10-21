import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { VaultService } from './vault.service';
import { SetMetadata } from '@nestjs/common';

export const ROLE_KEY = 'role';
export const Roles = (...role: string[]) => SetMetadata(ROLE_KEY, role);

@Injectable()
export class VaultTokenGuard implements CanActivate {
    private readonly logger = new Logger(VaultTokenGuard.name);

    constructor(
        private readonly vaultService: VaultService,
        private reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // Extract token from header
        const token = request.headers['x-vault-token'];

        if (!token) {
            this.logger.warn('No vault token provided in request');
            throw new UnauthorizedException('Vault token is required');
        }

        // Verify token with Vault
        const verification = await this.vaultService.verifyToken(token);
        if (!verification.valid) {
            this.logger.warn('Invalid vault token provided');
            throw new UnauthorizedException('Invalid or expired vault token');
        }
        verification.role = verification.role?.split('-')[1]; // Extract role before underscore
        // Attach user info to request
        request.user = {
            userId: verification.userId,
            role: verification.role,
            tokenData: verification.data,
        };
        request.userRole = verification.role;
        request.userId = verification.userId;

        this.logger.log(`User ${verification.userId} with role ${verification.role} accessing ${request.path}`);

        // Check role-based access
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            // No specific roles required, just valid token needed
            return true;
        }

        if (!verification.role) {
            this.logger.warn(`No role found for user ${verification.userId}`);
            throw new ForbiddenException('User role not found');
        }

        const hasRole = requiredRoles.includes(verification.role);

        if (!hasRole) {
            this.logger.warn(
                `Access denied for user ${verification.userId} with role ${verification.role}. Required roles: ${requiredRoles.join(', ')}`
            );
            throw new ForbiddenException(
                `Access denied. Required roles: ${requiredRoles.join(', ')}`
            );
        }

        this.logger.log(`Access granted for user ${verification.userId} with role ${verification.role}`);
        return true;
    }
}