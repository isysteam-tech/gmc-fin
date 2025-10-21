import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicantsModule } from './applicants/applicants.module';
import { User } from './users/user.entity';
import { ApplicantProfile } from './applicants/applicants.entity';
import { PersonIdentity } from './applicants/person-identity.entity';
import { SecurityAudit } from './applicants/securityAudit.entity';
import { UsersModule } from './users/user.module';
import { Company } from './applicants/company.entity';
import { Project } from './applicants/project.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,        // makes ConfigService available in all modules
      envFilePath: '.env',   // explicitly points to .env
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST'),
        port: Number(config.get('POSTGRES_PORT')),
        username: config.get<string>('POSTGRES_USER'),
        password: config.get<string>('POSTGRES_PASSWORD'),
        database: config.get<string>('POSTGRES_DB'),
        entities: [User, ApplicantProfile, PersonIdentity, SecurityAudit, Company, Project],
        synchronize: true,   // dev only
      }),
    }),
    ApplicantsModule,
    UsersModule
  ],
})
export class AppModule { }
