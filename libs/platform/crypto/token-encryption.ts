import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export interface EncryptedEnvelope {
  readonly keyId: string;
  readonly iv: string;
  readonly ciphertext: string;
  readonly tag: string;
  readonly aad: string;
}

export interface AadContext {
  readonly tokenId: string;
  readonly userId: string;
  readonly purpose: string;
  readonly eventId: string;
}

export class TokenEncryption {
  private readonly key: Buffer;
  private readonly keyId = 'v1';

  constructor(encryptionKeyHexOrRaw?: string) {
    if (
      process.env.NODE_ENV === 'production' &&
      !encryptionKeyHexOrRaw &&
      !process.env.AUTH_TOKEN_ENCRYPTION_KEY
    ) {
      throw new Error('AUTH_TOKEN_ENCRYPTION_KEY is required in production');
    }
    const rawKey =
      encryptionKeyHexOrRaw ||
      process.env.AUTH_TOKEN_ENCRYPTION_KEY ||
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
      this.key = Buffer.from(rawKey, 'hex');
    } else {
      const buf = Buffer.from(rawKey, 'utf8');
      if (buf.length !== 32)
        throw new Error('Encryption key must be 32 UTF-8 bytes or 64 hexadecimal characters');
      this.key = buf;
    }
  }

  encrypt(plainText: string, context: AadContext): EncryptedEnvelope {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);

    const aadString = JSON.stringify({
      eventId: context.eventId,
      purpose: context.purpose,
      tokenId: context.tokenId,
      userId: context.userId,
    });
    cipher.setAAD(Buffer.from(aadString, 'utf8'));

    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      keyId: this.keyId,
      iv: iv.toString('hex'),
      ciphertext: encrypted.toString('hex'),
      tag: tag.toString('hex'),
      aad: Buffer.from(aadString, 'utf8').toString('hex'),
    };
  }

  decrypt(envelope: EncryptedEnvelope, expectedContext: AadContext): string {
    if (envelope.keyId !== this.keyId) {
      throw new Error(`ENCRYPTION_KEY_ID_MISMATCH: expected ${this.keyId}, got ${envelope.keyId}`);
    }

    const aadBuffer = Buffer.from(envelope.aad, 'hex');
    const aadParsed = JSON.parse(aadBuffer.toString('utf8'));

    if (
      aadParsed.tokenId !== expectedContext.tokenId ||
      aadParsed.userId !== expectedContext.userId ||
      aadParsed.purpose !== expectedContext.purpose ||
      aadParsed.eventId !== expectedContext.eventId
    ) {
      throw new Error('ENCRYPTION_AAD_MISMATCH: envelope was bound to different context');
    }

    const iv = Buffer.from(envelope.iv, 'hex');
    const tag = Buffer.from(envelope.tag, 'hex');
    const ciphertext = Buffer.from(envelope.ciphertext, 'hex');

    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAAD(aadBuffer);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  }
}
