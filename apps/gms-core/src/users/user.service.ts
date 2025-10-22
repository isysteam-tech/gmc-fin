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
    // accessToken: string;
    // refreshToken: string;
    createdAt: Date;
}

interface LoginResponse {
    id: string;
    username: string;
    role: string;
    accessToken: string;
    refreshToken: string;
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
        // const accessToken = this.tokenService.generateAccessToken(savedUser.username, role);
        // const refreshToken = this.tokenService.generateRefreshToken(savedUser.username, role);

        return {
            id: savedUser.id,
            username: savedUser.username,
            role: savedUser.role,
            // accessToken,
            // refreshToken,
            createdAt: savedUser.createdAt,
        };
    }

    async validateAndLogin(username: string, password: string): Promise<LoginResponse | null> {
        const user = await this.usersRepository.findOneBy({ username });
        if (!user) {
            return null;
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return null;
        }
        // Generate tokens
        const accessToken = this.tokenService.generateAccessToken(user.username, user.role);
        const refreshToken = this.tokenService.generateRefreshToken(user.username, user.role);

        return {
            id: user.id,
            username: user.username,
            role: user.role,
            accessToken,
            refreshToken,
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
        if (!decoded) {
            throw new BadRequestException('Invalid or expired refresh token');
        }
        const user = await this.usersRepository.findOneBy({ username: decoded.username });
        if (!user) {
            throw new BadRequestException('User not found');
        }
        const newAccessToken = this.tokenService.generateAccessToken(user.username, user.role);
        return { accessToken: newAccessToken };
    }

}