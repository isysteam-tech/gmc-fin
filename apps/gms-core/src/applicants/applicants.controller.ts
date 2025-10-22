import { Body, Controller, Get, Param, Post, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { ApplicantsService } from './applicants.service';
// import { VaultTokenGuard, Roles } from '../vault/vault-token.guard';
import { Request } from 'express';
import { MaskRequestDto } from '../dto/mask-request.dto';
import { JwtAuthGuard, Roles } from 'src/users/jwt-auth.guard';
// Extend Express Request to include Vault user info
interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    tokenData: any;
  };
  userRole?: string;
  userId?: string;
}

@Controller('applicants')
// @UseGuards(JwtAuthGuard)
// @UseGuards(VaultTokenGuard) // Protect all routes in this controller
export class ApplicantsController {
  constructor(private readonly applicantsService: ApplicantsService) { }

  // Create applicant - All authenticated roles can create
  @Post()
  async createApplicantProfile(@Body() body: MaskRequestDto, @Req() req: AuthRequest) {
    return this.applicantsService.createApplicant(body, req.userId);
  }

  @Get('key-rotate')
  async dummy(@Req() req: AuthRequest) {
    return this.applicantsService.rotateKeysAndRetokenize();
  }
  
  // Get applicant by ID - All authenticated roles can view basic profile
  @Get(':id')
  // @Roles('b', 'c', 'd', 'e')
  async getApplicantProfile(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.applicantsService.getApplicantById(id, req.userRole, req.userId);
  }


}