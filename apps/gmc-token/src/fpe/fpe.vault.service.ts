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
            token: "hvs.TIIw6ufRYOSF0eYRmwQr31gw",
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

    async getOldKeys(): Promise<{ alphabetKey: string; numericKey: string }> {
        const res = await this.client.read('secrets/data/old_fpe');

        return {
            alphabetKey: res.data.data.alphabetKey,
            numericKey: res.data.data.numericKey,
        };
    }

    async rotateKeys() {
        const currentKeys = await this.client.read('secrets/data/fpe');
        if (currentKeys?.data?.data) {
            await this.client.write('secrets/data/old_fpe', {
                data: currentKeys.data.data, // store existing keys in old_fpe
            });
        }

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
