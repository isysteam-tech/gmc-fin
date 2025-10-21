// vault.service.ts
import { Injectable } from '@nestjs/common';
import Vault from 'node-vault';


@Injectable()
export class VaultService {
    private readonly client;

    constructor() {
        this.client = Vault({
            apiVersion: 'v1',
            endpoint: "http://127.0.0.1:8200",
            token: "hvs.mlngqu1Yt8GgJviIdThK3fRZ",
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

    async rotateKeys() {
        const newAlphabetKey = Math.random().toString(36).slice(2, 18);
        const newNumericKey = Math.floor(Math.random() * 1e18).toString().slice(0, 10);

        const result = await this.client.write('secrets/data/fpe', {
        data: {
            alphabetKey: newAlphabetKey,
            numericKey: newNumericKey,
        },
        });

        return {
        message: 'Vault keys rotated successfully',
        version: result.data.version,
        alphabetKey: newAlphabetKey,
        numericKey: newNumericKey,
        };
    }
}
