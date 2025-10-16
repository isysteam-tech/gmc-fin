// vault.service.ts
import { Injectable } from '@nestjs/common';
import Vault from 'node-vault';


console.log(process.env.VAULT_ADDR, '---');


@Injectable()
export class VaultService {
    private readonly client;

    constructor() {
        this.client = Vault({
        apiVersion: 'v1',
        endpoint: process.env?.VAULT_ADDR || 'http://127.0.0.1:8200',
        token: process.env?.VAULT_TOKEN || 'hvs.kAmAefIo51JZJG6hxzRrCqLC',
        });
    }

    // Store FPE keys in Vault
    async storeKeys(alphabetKey: string, numericKey: string) {
        return this.client.write('secrets/data/fpe', {
            data: { alphabetKey, numericKey },
        });
    }

    // Retrieve FPE keys from Vault
    async getKeys(): Promise<{ alphabetKey: string; numericKey: string }> {
        const res = await this.client.read('secrets/data/fpe');
        return {
            alphabetKey: res.data.data.alphabetKey,
            numericKey: res.data.data.numericKey,
        };
    }
}
