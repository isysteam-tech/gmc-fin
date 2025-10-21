import { Injectable } from '@nestjs/common';
import { DetokeniseRequestDto } from './token.interface';
import { FpeService } from '../fpe/fpe.service';
// import { VaultService } from '../fpe/fpe.vault.service';
import * as maskConfig from '../config/masking.config.json';


@Injectable()
export class TokenService {
    constructor(
        private readonly fpeService: FpeService,
        // private readonly vaultService: VaultService
    ) {}

    async tokenise(type: string, value: string, deterministic: boolean) {
        if (!value) throw new Error('No value provided');
        // console.log('Forwarding tokenise request:', value);

        if (!deterministic) {
        throw new Error('Only deterministic tokenisation supported for now');
        }
       
        const getConfig = maskConfig[type]
        // console.log(getConfig, 'getConfig');
        

        // 🔐 Perform deterministic tokenisation using FPE
        const token = this.fpeService.encrypt(value, getConfig.prefix, getConfig.suffix);
        // console.log(token, 'tokentokentoken');
        

        return {
            token,
            metadata: {
                type,
                deterministic,
                algorithm: 'FPE-FF3',
            },
        };
    }

    async forwardDetokeniseRequest(dto: DetokeniseRequestDto) {
        console.log('Forwarding detokenise request:', dto);

        const getConfig = maskConfig[dto.purpose]
        // console.log(getConfig, 'getConfig');

        // 🔄 Here we just simulate calling a detokenisation module
        const decrypted = this.fpeService.decrypt(dto.token, getConfig.prefix, getConfig.suffix);

        return {
            message: 'De-tokenisation simulated locally',
            payload: {
                type: dto,
                value: decrypted,
            },
            status: 'success',
        };

    }

    async maskByRole(type: string, value: string, mask_style: string) {
        if (!value) throw new Error('No value provided');
        if (!mask_style) throw new Error('No mask_style provided');
        // console.log('Forwarding tokenise request:', value); 
        
        const getConfig = maskConfig[type]
        // console.log(getConfig, 'getConfig');
        
        
        // 🔐 Perform deterministic tokenisation using FPE
        const token = this.fpeService.mask(value, getConfig.prefix, getConfig.suffix);
        console.log(token, 'tokentokentoken');
        

        return { "masked": token };
    }
}
