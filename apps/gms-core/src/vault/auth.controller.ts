import { Controller, Post, Body, Delete, Put, Headers, UnauthorizedException, Logger } from '@nestjs/common';
import { VaultService } from './vault.service';

@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private readonly vaultService: VaultService) { }

    @Post('setup')
    async setupRoles() {
        // Define policies for each role
        const rolePolicies = {
            'role-a': `
                path ${process.env.VAULT_MOUNT_PATH}/encrypt/*" {
                    capabilities = ["create", "update"]
                }
                path ${process.env.VAULT_MOUNT_PATH}/decrypt/*" {
                    capabilities = ["create", "update"]
                }
            `,
            'role-b': `
                path ${process.env.VAULT_MOUNT_PATH}/encrypt/*" {
                    capabilities = ["create", "update"]
                }
                path ${process.env.VAULT_MOUNT_PATH}/decrypt/*" {
                    capabilities = ["create", "update"]
                }
            `,
            'role-c': `
                path ${process.env.VAULT_MOUNT_PATH}/encrypt/*" {
                    capabilities = ["create", "update"]
                }
                path ${process.env.VAULT_MOUNT_PATH}/decrypt/*" {
                    capabilities = ["create", "update"]
                }
            `,
            'role-d': `
                path ${process.env.VAULT_MOUNT_PATH}/encrypt/*" {
                    capabilities = ["create", "update"]
                }
                path ${process.env.VAULT_MOUNT_PATH}/decrypt/*" {
                    capabilities = ["create", "update"]
                }
            `,
            'role-e': `
                path ${process.env.VAULT_MOUNT_PATH}/encrypt/*" {
                    capabilities = ["create", "update"]
                }
                path ${process.env.VAULT_MOUNT_PATH}/decrypt/*" {
                    capabilities = ["create", "update"]
                }
            `,
        };

        // Create policies and roles
        for (const [roleName, policy] of Object.entries(rolePolicies)) {
            await this.vaultService.createPolicy(`${roleName}-policy`, policy);
            await this.vaultService.createRole(roleName, [`${roleName}-policy`]);
        }

        this.logger.log('All roles and policies created successfully');
        return { message: 'Roles and policies setup completed' };
    }

    @Post('token')
    async createToken(@Body() body: { userId: string; role: string }) {
        const { userId, role } = body;

        // Validate role
        const validRoles = ['a', 'b', 'c', 'd', 'e'];
        if (!validRoles.includes(role)) {
            throw new UnauthorizedException(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
        }

        const roleName = `role-${role}`;

        try {
            const { token, ttl } = await this.vaultService.createTokenWithRole(roleName, userId);

            this.logger.log(`Token created for user ${userId} with role ${role}`);

            return {
                token,
                ttl,
                role,
                userId,
                expiresIn: `${ttl} seconds`,
            };
        } catch (err) {
            this.logger.error(`Failed to create token for user ${userId}:`, err);
            throw new UnauthorizedException('Failed to create token');
        }
    }

    @Delete('token')
    async revokeToken(@Headers('x-vault-token') token: string) {
        if (!token) {
            throw new UnauthorizedException('Token is required');
        }

        try {
            await this.vaultService.revokeToken(token);
            this.logger.log('Token revoked successfully');
            return { message: 'Token revoked successfully' };
        } catch (err) {
            this.logger.error('Failed to revoke token:', err);
            throw new UnauthorizedException('Failed to revoke token');
        }
    }

    @Put('token/renew')
    async renewToken(@Headers('x-vault-token') token: string) {
        if (!token) {
            throw new UnauthorizedException('Token is required');
        }

        try {
            const { ttl } = await this.vaultService.renewToken(token);
            this.logger.log('Token renewed successfully');
            return {
                message: 'Token renewed successfully',
                ttl,
                expiresIn: `${ttl} seconds`
            };
        } catch (err) {
            this.logger.error('Failed to renew token:', err);
            throw new UnauthorizedException('Failed to renew token');
        }
    }

    @Post('token/verify')
    async verifyToken(@Headers('x-vault-token') token: string) {
        if (!token) {
            throw new UnauthorizedException('Token is required');
        }

        const verification = await this.vaultService.verifyToken(token);

        if (!verification.valid) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        return {
            valid: true,
            userId: verification.userId,
            role: verification.role,
            tokenInfo: {
                displayName: verification.data?.display_name,
                creationTime: verification.data?.creation_time,
                ttl: verification.data?.ttl,
                renewable: verification.data?.renewable,
            }
        };
    }
}