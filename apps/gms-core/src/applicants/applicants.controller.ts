import { Body, Controller, Get, Param, Post, UseGuards, Req, UnauthorizedException, Res, BadRequestException, Query, InternalServerErrorException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApplicantsService } from './applicants.service';
// import { VaultTokenGuard, Roles } from '../vault/vault-token.guard';
import express from 'express';
import { MaskRequestDto } from '../dto/mask-request.dto';
import { JwtAuthGuard, Roles } from 'src/users/jwt-auth.guard';
import { saveAsCSV } from 'src/common/exportCSV';
import * as Excel from 'exceljs';
import { FileInterceptor } from '@nestjs/platform-express';
// Extend Express Request to include Vault user info
interface AuthRequest extends express.Request {
  user?: {
    id: string;
    role: string;
    tokenData: any;
  };
  userRole?: string;
  userId?: string;
}

@Controller('applicants')
// @UseGuards(VaultTokenGuard) // Protect all routes in this controller
export class ApplicantsController {
  constructor(private readonly applicantsService: ApplicantsService) { }

  // Create applicant - All authenticated roles can create
  @Post()
  async createApplicantProfile(@Body() body: MaskRequestDto, @Req() req: AuthRequest) {
    const userId = (req as any).user?.id || (req as any).user?.sub || null;
    const userRole = (req as any).user?.role || 'unknown';
    return this.applicantsService.createApplicant(body, userRole, userId);
  }

  @Get('key-rotate')
  async dummy(@Req() req: AuthRequest) {
    return this.applicantsService.rotateKeysAndRetokenize();
  }

  // Get applicant by ID - All authenticated roles can view basic profile
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'operations', 'finance')
  async getApplicantProfile(@Param('id') id: string, @Req() req: AuthRequest) {
    const userId = (req as any).user?.id || (req as any).user?.sub || null;
    const userRole = (req as any).user?.role || 'unknown';
    return this.applicantsService.getApplicantById(id, userRole, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles('admin', 'operations', 'finance')
  async getApplicantsList(@Query('limit') limit = 10, @Query('skip') skip = 0, @Req() req: AuthRequest,) {
    try {
      const parsedLimit = Number(limit) || 10;
      const parsedSkip = Number(skip) || 0;

      const userId = (req as any).user?.id || (req as any).user?.sub || null;
      const userRole = (req as any).user?.role || 'unknown';

      return await this.applicantsService.getIdentityList(parsedLimit, parsedSkip, userRole, userId);
    } catch (error) {
      console.error('Error fetching applicant list:', error);
      throw new InternalServerErrorException('Failed to fetch applicant list');
    }
  }

  @Post('finance-export')
  @UseGuards(JwtAuthGuard)
  @Roles('finance')
  @UseInterceptors(FileInterceptor('file'))
  async exportFinance(@Req() req: express.Request, @Res() res: express.Response, @UploadedFile() file: Express.Multer.File, @Body() body: { purpose: boolean }) {
    try {
      if (!file) {
        return res.status(400).json({ message: 'Excel file missing' });
      }
      const applicant_ids: string[] = [];

      const dataRows = await this.applicantsService.parseExcel(file.buffer)
      for (const row of dataRows) {
        applicant_ids.push(row['Applicants Ids'])
      }
      if (!applicant_ids.length) {
        return res.status(400).json({ message: 'No applicant IDs found in file' });
      }
      const { purpose } = body;
      if (!applicant_ids || !Array.isArray(applicant_ids) || applicant_ids.length === 0) {
        return res.status(400).json({
          message: 'Validation failed',
          missingFields: 'applicant_ids in array',
        });
      }

      const userId = (req as any).user?.id || (req as any).user?.sub || null;
      const userRole = (req as any).user?.role || 'unknown';

      const rows = await this.applicantsService.getFinanceExports(applicant_ids, purpose, userRole, userId,);
      const tableData = {
        title: 'Finance Export',
        columns: ['SI', 'ID', 'NAME', 'PHONE', 'EMAIL', 'SALARY BAND', 'COMPANY NAME', 'TITLE', 'TIMELINE', 'TOTAL COST', 'FUNDING AMOUNT', 'NRIC', 'BANK ACC', 'BANK CODE'],
        rows,
        fileName: purpose ? `finance_purpose_export_${Date.now()}` : `finance_export_${Date.now()}`,
      };
      await saveAsCSV(req, res, () => { }, tableData);
    } catch (error) {
      console.error('Export failed:', error);
      res.status(500).json({ message: 'Export service unavailable.' });
    }
  }

}