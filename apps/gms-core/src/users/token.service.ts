import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

interface TokenPayload {
    username: string;
    role: string;
    type: 'access' | 'refresh';
}

@Injectable()
export class TokenService {

    generateAccessToken(username: string, role: string): string {
        const payload: TokenPayload = {
            username,
            role,
            type: 'access',
        };

        return jwt.sign(payload, process.env.JWT_SECRET || '!@#$%^&*()', {
            expiresIn: '8m',
        });
    }

    generateRefreshToken(username: string, role: string): string {
        const payload: TokenPayload = {
            username,
            role,
            type: 'refresh',
        };

        return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || '!@#$%^&*()1234567890', {
            expiresIn: '8h',
        });
    }

    verifyAccessToken(token: string): TokenPayload | null {
        try {
            return jwt.verify(token, process.env.JWT_SECRET || '!@#$%^&*()') as TokenPayload;
        } catch (error) {
            console.error('Invalid or expired token:', error.message);
            return null;
        }
    }


    verifyRefreshToken(token: string): TokenPayload | null {
        try {
            return jwt.verify(token, process.env.JWT_REFRESH_SECRET || '!@#$%^&*()1234567890') as TokenPayload;
        } catch (error) {
            console.error('Invalid or expired token:', error.message);
            return null;
        }
    }
}