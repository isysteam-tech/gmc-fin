import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import Vault from 'node-vault';

@Injectable()
export class VaultService {
    private readonly logger = new Logger(VaultService.name);
    private readonly vaultClient: ReturnType<typeof Vault>;
    private client: AxiosInstance;

    constructor() {
        this.vaultClient = Vault({
            endpoint: process.env.VAULT_ADDR,
            token: process.env.VAULT_TOKEN,
        });
        this.client = axios.create({
            baseURL: process.env.VAULT_SERVICE_URL,
            timeout: 5000,
        });
    }

    // async createTransitKey(keyName: string): Promise<void> {
    //     try {
    //         await this.vaultClient.write(`transit/keys/${keyName}`, {
    //             type: 'aes256-gcm96',
    //             derived: true,
    //             convergent_encryption: false,
    //         });
    //         this.logger.log(`Transit key "${keyName}" created successfully.`);
    //     } catch (err: any) {
    //         if (err.response?.data?.errors?.includes('key already exists')) {
    //             this.logger.warn(`Transit key "${keyName}" already exists, skipping creation.`);
    //         } else {
    //             this.logger.error(`Failed to create transit key "${keyName}":`, err);
    //             throw new InternalServerErrorException(`Failed to create transit key "${keyName}".`);
    //         }
    //     }
    // }

    // async tokeniseOld(keyName: string, value: string): Promise<string> {
    //     try {
    //         // const context = Buffer.from('user-specific-context').toString('base64');
    //         // const response = await this.vaultClient.write(`transit/encrypt/${keyName}`, {
    //         //     plaintext: Buffer.from(value).toString('base64'),
    //         //     context,
    //         // });
    //         // return response.data.ciphertext;
    //         return value;
    //     } catch (err) {
    //         this.logger.error(`Failed to tokenize with key ${keyName}:`, err);
    //         throw new InternalServerErrorException(`Failed to tokenize data.`);
    //     }
    // }

    async tokenise(keyName: string, data: string): Promise<string> {
        try {
            const response = await this.client.post('/tokenise', {
                type: keyName,
                value: data,
                deterministic: true
            });
            return response.data.token;
        } catch (error) {
            console.error('Tokenization failed:', error.message);
            throw new Error(`Failed to tokenize data: ${error.message}`);
        }
    }
    async makeMask(type: string, value: string): Promise<string> {
        try {
            const response: any = await this.client.post('/mask', {
                type: type,
                value,
                mask_style: 'default'
            });
            return response?.data?.masked || ''
        } catch (error) {
            console.error('Mask failed:', error.message);
            throw new Error(`Failed to mask data: ${error.message}`);
        }
    }
    async detokenise(keyName: string, ciphertext: string): Promise<string> {
        try {
            // Use the same context that was used during tokenization
            // const context = Buffer.from('user-specific-context').toString('base64');

            // const response = await this.vaultClient.write(`transit/decrypt/${keyName}`, {
            //     ciphertext,
            //     context,
            // });

            // return Buffer.from(response.data.plaintext, 'base64').toString('utf8');
            return ciphertext;
        } catch (err) {
            this.logger.error(`Failed to detokenize with key ${keyName}:`, err);
            throw new InternalServerErrorException(`Failed to detokenize data.`);
        }
    }



    async createPolicy(policyName: string, rules: string): Promise<void> {
        try {
            await this.vaultClient.write(`sys/policies/acl/${policyName}`, { policy: rules });
            this.logger.log(`Policy ${policyName} created successfully.`);
        } catch (err: any) {
            if (!err.response?.statusCode || err.response.statusCode !== 400) {
                this.logger.error(`Failed to create policy ${policyName}:`, err);
            }
        }
    }

    async createRole(roleName: string, policies: string[]): Promise<void> {
        try {
            await this.vaultClient.write(`auth/token/roles/${roleName}`, {
                allowed_policies: policies,
                orphan: false,
                renewable: true,
                token_period: '24h',
                token_ttl: '24h',
                token_max_ttl: '72h',
            });
            this.logger.log(`Role ${roleName} created successfully.`);
        } catch (err: any) {
            this.logger.error(`Failed to create role ${roleName}:`, err);
        }
    }

    async createTokenWithRole(roleName: string, userId: string): Promise<{ token: string; ttl: number }> {
        try {
            const response = await this.vaultClient.write('auth/token/create', {
                role_name: roleName,
                meta: { user_id: userId, role: roleName },
                renewable: true,
                display_name: `${roleName}-${userId}`,
            });

            return {
                token: response.auth.client_token,
                ttl: response.auth.lease_duration,
            };
        } catch (err) {
            this.logger.error(`Failed to create token for role ${roleName}:`, err);
            throw err;
        }
    }

    async verifyToken(token: string): Promise<{ valid: boolean; data?: any; role?: string; userId?: string }> {
        try {
            const client = Vault({
                endpoint: process.env.VAULT_ADDR,
                token: token,
            });

            const response = await client.tokenLookupSelf();

            if (response.data) {
                const meta = response.data.meta || {};
                const role = meta.role || null;
                const userId = meta.user_id || null;

                return {
                    valid: true,
                    data: response.data,
                    role,
                    userId,
                };
            }

            return { valid: false };
        } catch (err: any) {
            this.logger.error('Token verification failed:', err.message);
            return { valid: false };
        }
    }

    async revokeToken(token: string): Promise<void> {
        try {
            await this.vaultClient.write('auth/token/revoke', { token });
            this.logger.log('Token revoked successfully.');
        } catch (err) {
            this.logger.error('Failed to revoke token:', err);
            throw err;
        }
    }

    async renewToken(token: string): Promise<{ ttl: number }> {
        try {
            const client = Vault({
                endpoint: process.env.VAULT_ADDR,
                token: token,
            });

            const response = await client.tokenRenewSelf({
                increment: '24h',
            });

            return { ttl: response.auth.lease_duration };
        } catch (err) {
            this.logger.error('Failed to renew token:', err);
            throw err;
        }
    }
}