import {
    IsNotEmpty,
    IsString,
    IsEmail,
    IsNumber,
    IsOptional,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MaskField } from '../validators/mask-field.validator';

export class CompanyDto {
    @IsNotEmpty()
    @IsString()
    company_name: string;

    @IsNotEmpty()
    @IsString()
    uen: string;

    @IsNotEmpty()
    @IsString()
    reg_address: string;

    @IsNotEmpty()
    @IsString()
    business_sector: string;

    @IsOptional()
    @IsNumber()
    employee_count?: number;
}

export class ProjectDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    desc?: string;

    @IsOptional()
    @IsString()
    timeline?: string;

    @IsNotEmpty()
    @IsNumber()
    total_cost: number;

    @IsNotEmpty()
    @IsNumber()
    funding_amount: number;
}

export class MaskRequestDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsEmail()
    @MaskField('email')
    email: string;

    @IsNotEmpty()
    @IsString()
    @MaskField('phone')
    phone: string;

    @IsNotEmpty()
    @IsString()
    @MaskField('nric')
    nric: string;

    @IsNotEmpty()
    @IsString()
    @MaskField('bank')
    bank_acc: string;

    @IsNotEmpty()
    @IsString()
    bank_code: string;

    @IsNotEmpty()
    @IsNumber()
    salary: number;

    @IsOptional()
    @IsString()
    designation?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => CompanyDto)
    company?: CompanyDto;

    @IsOptional()
    @ValidateNested()
    @Type(() => ProjectDto)
    project?: ProjectDto;
}
