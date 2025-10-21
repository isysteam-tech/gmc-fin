import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { UsersService } from './user.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private usersService: UsersService) { }

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
            const decoded = await this.usersService.verifyAccessToken(token);
            request.user = decoded; // Attach user to request
            return true;
        } catch (error) {
            if (error.message.includes('jwt expired')) {
                throw new UnauthorizedException('Access token expired. Use refresh token to get a new one');
            }
            throw new UnauthorizedException('Invalid access token');
        }
    }
}