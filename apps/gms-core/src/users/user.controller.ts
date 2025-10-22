import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, BadRequestException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './user.service';
import { ApiKeyGuard } from './api-key.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

interface CreateUserDto {
    username: string;
    role: string;
    password: string
}

interface LoginDto {
    username: string;
    password: string;
}

interface RefreshTokenDto {
    refreshToken: string;
}

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post('register')
    @UseGuards(ApiKeyGuard)
    @HttpCode(HttpStatus.CREATED)
    async createUser(@Body() body: CreateUserDto): Promise<any> {
        try {
            const { username, role, password } = body;

            if (!username || !role || !password) {
                throw new BadRequestException({
                    message: 'Validation failed',
                    missingFields: ['username', 'role', 'password'],
                });

            }

            return this.usersService.createUser(username, role, password);
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to create user');
        }
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() body: LoginDto): Promise<any> {
        try {
            const { username, password } = body;

            if (!username || !password) {
                throw new BadRequestException({
                    message: 'Validation failed',
                    missingFields: !username && !password ? ['username', 'password'] : !username ? ['username'] : ['password'],
                });
            }

            const result = await this.usersService.validateAndLogin(username, password);

            if (!result) {
                throw new UnauthorizedException('Invalid username or password');
            }

            return result;
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to login');
        }
    }

    @Post('refresh-token')
    @HttpCode(HttpStatus.OK)

    async refreshToken(@Body() body: RefreshTokenDto): Promise<any> {
        try {
            if (!body.refreshToken) {
                throw new BadRequestException('Refresh token is required');
            }

            return await this.usersService.refreshAccessToken(body.refreshToken);
        } catch (error) {
            if (error.message === 'User not found') {
                throw new BadRequestException(error.message);
            }
            if (error.message.includes('jwt')) {
                throw new BadRequestException('Invalid or expired refresh token');
            }
            throw new InternalServerErrorException('Failed to refresh token');
        }
    }
}