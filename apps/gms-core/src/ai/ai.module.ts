import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ApplicantsModule } from '../applicants/applicants.module';

@Module({
  imports: [ApplicantsModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
