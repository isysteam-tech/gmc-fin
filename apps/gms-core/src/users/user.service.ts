import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { TokenService } from './token.service';
import * as bcrypt from 'bcryptjs';

interface CreateUserResponse {
    id: string;
    username: string;
    role: string;
    accessToken: string;
    refreshToken: string;
    createdAt: Date;
}

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private tokenService: TokenService,
    ) { }

    async createUser(username: string, role: string, password: string): Promise<CreateUserResponse> {
        // Check if user already exists
        const existingUser = await this.usersRepository.findOneBy({ username });
        if (existingUser) {
            throw new BadRequestException('User already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save new user
        const newUser = this.usersRepository.create({ username, role, password: hashedPassword });
        const savedUser = await this.usersRepository.save(newUser);

        // Generate tokens
        const accessToken = this.tokenService.generateAccessToken(savedUser.id, savedUser.username);
        const refreshToken = this.tokenService.generateRefreshToken(savedUser.id, savedUser.username);

        return {
            id: savedUser.id,
            username: savedUser.username,
            role: savedUser.role,
            accessToken,
            refreshToken,
            createdAt: savedUser.createdAt,
        };
    }

    async verifyAccessToken(token: string): Promise<any> {
        return this.tokenService.verifyAccessToken(token);
    }

    async verifyRefreshToken(token: string): Promise<any> {
        return this.tokenService.verifyRefreshToken(token);
    }

    async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
        const decoded = this.tokenService.verifyRefreshToken(refreshToken);
        const user = await this.usersRepository.findOneBy({ id: decoded.userId });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        const newAccessToken = this.tokenService.generateAccessToken(user.id, user.username);

        return {
            accessToken: newAccessToken,
        };
    }
}