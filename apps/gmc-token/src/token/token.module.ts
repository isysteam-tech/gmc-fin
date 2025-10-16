import { Module } from '@nestjs/common';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import { FpeService } from '../fpe/fpe.service';
import { VaultService } from '../fpe/fpe.vault.service';

@Module({
  controllers: [TokenController],
  providers: [TokenService, FpeService, VaultService],
  exports: [TokenService],
})
export class TokenModule {}
