import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { LocalStorageService } from './local-storage.service';

@Module({
  controllers: [AiController],
  providers: [AiService, LocalStorageService],
  exports: [LocalStorageService],
})
export class AiModule {}
