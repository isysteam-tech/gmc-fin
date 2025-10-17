import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { VaultService } from '../fpe/fpe.vault.service';
import { TokenController } from './token.controller';
import { TokeniseRequestDto } from './token.interface';
import { FpeService } from '../fpe/fpe.service';
import * as XLSX from 'xlsx';
import { join } from 'path';
import fpe from 'node-fpe';

describe('TokenController - Excel PAN uniqueness (real FPE)', () => {
  let controller: TokenController;
  let service: TokenService;
  let fpeService: FpeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokenController],
      providers: [
        TokenService,
        FpeService,
        {
          provide: VaultService,
          useValue: {
            getKeys: jest.fn().mockResolvedValue({
              alphabetKey: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
              numericKey: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            }),
            rotateKeys: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TokenController>(TokenController);
    service = module.get<TokenService>(TokenService);
    fpeService = module.get<FpeService>(FpeService);

    // Initialize real FPE setup
    await fpeService.onModuleInit();
  });

  it('should tokenise all PANs from Excel and ensure uniqueness', async () => {
    const filePath = join(__dirname, '..', '..', 'pan.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const data: { pan_no: string }[] = XLSX.utils.sheet_to_json(sheet);

    const tokenSet = new Set<string>();

    for (const row of data) {
      if (!row.pan_no) throw new Error('Empty PAN found in Excel');
      // console.log(row.pan_no, 'before');

      const reqBody: TokeniseRequestDto = {
        type: 'nric',
        value: row.pan_no,
        deterministic: true,
      };

      const result = await controller.tokenise(reqBody);

      tokenSet.add(result.token.token);
      // console.log(result.token.token, 'after');
      // break
    }

    console.log(`PAN count: ${data.length}, Unique tokens: ${tokenSet.size}`);

    expect(tokenSet.size).toBe(data.length);
  });
});
