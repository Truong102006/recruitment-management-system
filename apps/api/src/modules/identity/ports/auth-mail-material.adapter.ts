import { Injectable } from '@nestjs/common';
import { AuthMailMaterialPort } from '../../../../../../libs/contracts/backend';
import {
  TokenEncryption,
  EncryptedEnvelope,
  AadContext,
} from '../../../../../../libs/platform/crypto/token-encryption';
import { PrismaAuthTokenRepository } from '../repositories/prisma-auth-token.repository';
import { PrismaUserRepository } from '../repositories/prisma-user.repository';
import { NotFoundError } from '../../../../../../libs/platform/errors/domain.error';

@Injectable()
export class AuthMailMaterialAdapter implements AuthMailMaterialPort {
  private readonly encryption = new TokenEncryption();

  constructor(
    private readonly tokenRepo: PrismaAuthTokenRepository,
    private readonly userRepo: PrismaUserRepository,
  ) {}

  async decryptMaterial(encryptedEnvelope: string): Promise<{
    readonly token: string;
    readonly email: string;
    readonly purpose: 'VERIFY_EMAIL' | 'RESET_PASSWORD';
  }> {
    const envelope: EncryptedEnvelope = JSON.parse(encryptedEnvelope);
    const aadBuffer = Buffer.from(envelope.aad, 'hex');
    const aadContext: AadContext = JSON.parse(aadBuffer.toString('utf8'));

    const rawToken = this.encryption.decrypt(envelope, aadContext);
    const user = await this.userRepo.findById(aadContext.userId);
    if (!user) {
      throw new NotFoundError('User not found for material');
    }

    return {
      token: rawToken,
      email: user.email,
      purpose: aadContext.purpose as 'VERIFY_EMAIL' | 'RESET_PASSWORD',
    };
  }
}
