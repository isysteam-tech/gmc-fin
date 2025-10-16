import { Injectable } from '@nestjs/common';
import { DetokeniseRequestDto } from './token.interface';
import { FpeService } from '../fpe/fpe.service';
// import { VaultService } from '../fpe/fpe.vault.service';

@Injectable()
export class TokenService {
    constructor(
        private readonly fpeService: FpeService,
        // private readonly vaultService: VaultService
    ) {}

    async tokenise(type: string, value: string, deterministic: boolean) {
        if (!value) throw new Error('No value provided');
        console.log('Forwarding tokenise request:', value);

        if (!deterministic) {
        throw new Error('Only deterministic tokenisation supported for now');
        }

        // 🔐 Perform deterministic tokenisation using FPE
        const token = this.fpeService.encrypt(value, 4, 1);

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

        // 🔄 Here we just simulate calling a detokenisation module
        const decrypted = this.fpeService.decrypt(dto.token, 4, 1);

        return {
            message: 'De-tokenisation simulated locally',
            payload: {
                type: dto,
                value: decrypted,
            },
            status: 'success',
        };

    }

    maskByRole(value: string, role = 'User', type = 'nric'): string {
        if (!value) return '';

        switch (type) {
        case 'nric':
        case 'bank':
            return this.maskNRICorBank(value, role);

        case 'email':
            return this.maskEmail(value, role);

        case 'phone':
            return this.maskPhone(value, role);

        default:
            return '****';
        }
    }

    private maskNRICorBank(value: string, role: string): string {
        if (role === 'Admin') {
            // Example: AWAA****4L
            return value.slice(0, 4) + '****' + value.slice(-2);
        } else if (role === 'Moderator') {
            // Example: ****234L
            return '****' + value.slice(-4);
        } else {
            // Default: ****
            return '****';
        }
    }

    private maskEmail(email: string, role: string): string {
        const [user, domain] = email.split('@');
        if (role === 'Admin') return `${user.slice(0, 3)}***@${domain}`;
        if (role === 'Moderator') return `***@${domain}`;
        return '****';
    }

    private maskPhone(phone: string, role: string): string {
        if (role === 'Admin') return phone.slice(0, 3) + '****' + phone.slice(-2);
        if (role === 'Moderator') return '****' + phone.slice(-3);
        return '****';
    }
}
