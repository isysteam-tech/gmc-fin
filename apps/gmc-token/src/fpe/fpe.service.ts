import { Injectable } from '@nestjs/common';
import fpe from 'node-fpe';
import { VaultService } from './fpe.vault.service';

@Injectable()
export class FpeService {
  private alphabetFpe: ReturnType<typeof fpe>;
  private numericFpe: ReturnType<typeof fpe>;

  constructor(private readonly vault: VaultService) {}

  async onModuleInit() {
      
      const keys = await this.vault.getKeys();        
      
      this.alphabetFpe = fpe({ 
          secret: keys.alphabetKey,
          domain: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
      });

      this.numericFpe = fpe({
          secret: keys.numericKey,
          domain: '0123456789'.split(''),
      });
  }

  private async initFpe(k: boolean) {
    const keys = (k) ? await this.vault.getKeys() : await this.vault.getOldKeys()
    return {
      alphabetFpe: fpe({ secret: keys.alphabetKey, domain: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') }),
      numericFpe: fpe({ secret: keys.numericKey, domain: '0123456789'.split('') }),
    };
  }


  async encrypt(value: string, prefixLength: number, suffixLength: number): Promise<string> {
    if (!value) throw new Error('No input provided');

    const { alphabetFpe, numericFpe } = await this.initFpe(true);

    const prefix = value.slice(0, prefixLength);
    const suffix = value.slice(value.length - suffixLength);
    const middle = value.slice(prefixLength, value.length - suffixLength);
    

    let encrypted = '';
    for (const ch of middle) {
      if (/[A-Z]/i.test(ch)) {
        // encrypted += this.alphabetFpe.encrypt(ch.toUpperCase());
        encrypted += alphabetFpe.encrypt(ch.toUpperCase());
      } else if (/[0-9]/.test(ch)) {
        // encrypted += this.numericFpe.encrypt(ch);
        encrypted += numericFpe.encrypt(ch);
      } else {
        encrypted += ch;
      }
    }

    return prefix + encrypted + suffix;
  }

  async decrypt(value: string, prefixLength: number, suffixLength: number): Promise<string> {
    let newKey = true
    const { alphabetFpe, numericFpe } = await this.initFpe(newKey);
    const prefix = value.slice(0, prefixLength);
    const suffix = value.slice(value.length - suffixLength);
    const middle = value.slice(prefixLength, value.length - suffixLength);

    let decrypted = '';
    for (const ch of middle) {
      if (/[A-Z]/i.test(ch)) {
        // decrypted += this.alphabetFpe.decrypt(ch);
        decrypted += alphabetFpe.decrypt(ch);
      } else if (/[0-9]/.test(ch)) {
        // decrypted += this.numericFpe.decrypt(ch);
        decrypted += numericFpe.decrypt(ch);
      } else {
        decrypted += ch;
      }
    }

    return prefix + decrypted + suffix;
  }


  mask(value: string, prefixLength: number, suffixLength: number, maskChar = '*'): string {
    if (!value) throw new Error('No input provided');

    const prefix = value.slice(0, prefixLength);
    const suffix = value.slice(value.length - suffixLength);
    const middleLength = value.length - (prefixLength + suffixLength);
    console.log(middleLength, 'middleLength');
    

    const masked = maskChar.repeat(Math.max(0, middleLength));
    return prefix + masked + suffix;
  }

}
