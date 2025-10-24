import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ApplicantsModule } from '../applicants/applicants.module';
import { LocalStorageService } from './local-storage.service';

@Module({
  imports: [ApplicantsModule],
  controllers: [AiController],
  providers: [AiService, LocalStorageService],
  exports: [LocalStorageService],
})
export class AiModule {}
