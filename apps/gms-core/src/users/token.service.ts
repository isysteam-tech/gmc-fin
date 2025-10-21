import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

interface TokenPayload {
    userId: string;
    username: string;
    type: 'access' | 'refresh';
}

@Injectable()
export class TokenService {

    generateAccessToken(userId: string, username: string): string {
        const payload: TokenPayload = {
            userId,
            username,
            type: 'access',
        };

        return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
            expiresIn: '8m',
        });
    }

    generateRefreshToken(userId: string, username: string): string {
        const payload: TokenPayload = {
            userId,
            username,
            type: 'refresh',
        };

        return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || '!@#$%^&*()1234567890', {
            expiresIn: '8h',
        });
    }

    verifyAccessToken(token: string): TokenPayload {
        return jwt.verify(token, process.env.JWT_SECRET || '!@#$%^&*()') as TokenPayload;
    }

    verifyRefreshToken(token: string): TokenPayload {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET || '!@#$%^&*()1234567890') as TokenPayload;
    }
}