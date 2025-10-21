import { Module, Global } from '@nestjs/common';
import { VaultService } from './vault.service';
import { VaultTokenGuard } from './vault-token.guard';
import { AuthController } from './auth.controller';

@Global()
@Module({
    providers: [VaultService, VaultTokenGuard],
    controllers: [AuthController],
    exports: [VaultService, VaultTokenGuard],
})
export class VaultModule { }