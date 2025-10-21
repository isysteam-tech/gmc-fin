import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicantsService } from './applicants.service';
import { ApplicantsController } from './applicants.controller';
import { PersonIdentity } from './person-identity.entity';
import { ApplicantProfile } from './applicants.entity';
import { SecurityAudit } from './securityAudit.entity';
import { VaultModule } from 'src/vault/vault.module';
import { Project } from './project.entity';
import { Company } from './company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicantProfile, PersonIdentity, SecurityAudit, Project, Company]),
    VaultModule,
  ],
  controllers: [ApplicantsController],
  providers: [ApplicantsService],
  exports: [ApplicantsService],
})
export class ApplicantsModule { }
