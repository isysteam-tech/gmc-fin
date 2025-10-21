import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

/**
 * Common request contract interfaces
 */
export interface ITokeniseRequest {
  type: 'nric' | 'bank' | 'email' | 'phone';
  value: string;
  deterministic?: boolean;
}

export interface IDetokeniseRequest {
  token: string;
  purpose: string;
}

export interface IMaskRequest {
  type: 'nric' | 'bank' | 'email' | 'phone';
  value: string;
  mask_style?: 'default' | 'strict';
}

export interface IMaskRequest {
  type: 'nric' | 'bank' | 'email' | 'phone';
  value: string;
  mask_style?: 'default' | 'strict';
  role?: 'Admin' | 'Moderator' | 'User';
}

/**
 * Validation DTOs (using class-validator)
 * These extend interfaces — usable in Nest controllers directly
 */
export class TokeniseRequestDto implements ITokeniseRequest {
  @IsString()
  @IsNotEmpty()
  type: 'nric' | 'bank' | 'email' | 'phone';

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsOptional()
  @IsBoolean()
  deterministic?: boolean;
}

export class DetokeniseRequestDto implements IDetokeniseRequest {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  purpose: string;
}

export class MaskRequestDto implements IMaskRequest {
  @IsString()
  @IsNotEmpty()
  type: 'nric' | 'bank' | 'email' | 'phone';

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsNotEmpty()
  mask_style: 'default' | 'strict';

  @IsOptional()
  @IsString()
  role?: 'Admin' | 'Moderator' | 'User';
}
