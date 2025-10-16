import { Injectable } from '@nestjs/common';
import { DetokeniseRequestDto } from './token.interface';
// import { VaultService } from '../vault/vault.service';

@Injectable()
export class TokenService {
    // constructor(private readonly vault: VaultService) {}

    async tokenise(type: string, value: string, deterministic: boolean) {
        console.log('Forwarding tokenise request:', value);
        // if (!value) throw new Error('No value provided');
        // const token = deterministic
        // ? await this.vault.encryptDeterministic(value)
        // : await this.vault.encrypt(value);

        // return {
        //     token,
        //     metadata: { type, deterministic },
        // };
    }

    async forwardDetokeniseRequest(dto: DetokeniseRequestDto) {
        console.log('Forwarding detokenise request:', dto);

        return {
            message: 'Request forwarded to detokenisation module',
            payload: dto,
            status: 'pending',
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
