import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { TokenService } from './token.service';
import { TokeniseRequestDto, DetokeniseRequestDto, MaskRequestDto } from './token.interface';
import { VaultService } from '../fpe/fpe.vault.service';
import { RateLimitGuard } from '../common/rate-limiter/rate-limit.guard';

@Controller('token')
export class TokenController {
    constructor(
        private readonly tokenService: TokenService,
        private readonly vault: VaultService
    ) {}

    @Post('tokenise')
    @UseGuards(RateLimitGuard)
    async tokenise(@Body() body: TokeniseRequestDto) {
        const deterministic = !!body.deterministic;
        const token = await this.tokenService.tokenise(body.type, body.value, deterministic);
        return {
            token,
            metadata: {
                type: body.type,
                deterministic: body.deterministic,
            },
        };
    }

    @Post('detokenise')
    async detokenise(@Body() body: DetokeniseRequestDto) {
        return this.tokenService.forwardDetokeniseRequest(body);
    }

    @Post('mask')
    async mask(@Body() body: MaskRequestDto) {
        const masked = this.tokenService.maskByRole(body.type, body.value, body.mask_style);
        return masked;
    }

    @Post('vault/rotate-key')
    async rotateKey() {
        return this.vault.rotateKeys();
    }

}
