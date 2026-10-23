import { TokenEncryption } from './token-encryption';

describe('TokenEncryption (A09)', () => {
  const encryption = new TokenEncryption(
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  );
  const context = {
    tokenId: 'tok-123',
    userId: 'usr-456',
    purpose: 'VERIFY_EMAIL',
    eventId: 'evt-789',
  };

  it('encrypts and successfully decrypts with exact matching AAD context', () => {
    const rawToken = 'super_secret_raw_token_xyz_1234567890';
    const envelope = encryption.encrypt(rawToken, context);

    expect(envelope.keyId).toBe('v1');
    expect(envelope.iv).toHaveLength(24); // 12 bytes = 24 hex
    expect(envelope.tag).toHaveLength(32); // 16 bytes = 32 hex
    expect(envelope.ciphertext).not.toBe(rawToken);

    const decrypted = encryption.decrypt(envelope, context);
    expect(decrypted).toBe(rawToken);
  });

  it('rejects decryption when ciphertext is tampered', () => {
    const envelope = encryption.encrypt('token_secret', context);
    const tampered = {
      ...envelope,
      ciphertext: envelope.ciphertext.slice(0, -2) + 'aa',
    };

    expect(() => encryption.decrypt(tampered, context)).toThrow();
  });

  it('rejects decryption when AAD context is modified or swapped between events', () => {
    const envelope = encryption.encrypt('token_secret', context);
    const differentContext = {
      ...context,
      purpose: 'RESET_PASSWORD',
    };

    expect(() => encryption.decrypt(envelope, differentContext)).toThrow(/ENCRYPTION_AAD_MISMATCH/);
  });
});

describe('TokenEncryption key validation', () => {
  it.each(['short', 'x'.repeat(64), 'x'.repeat(33)])(
    'rejects malformed keys without padding or truncating',
    (key) => {
      expect(() => new TokenEncryption(key)).toThrow();
    },
  );
  it('accepts exactly 32 raw UTF-8 bytes', () => {
    expect(() => new TokenEncryption('x'.repeat(32))).not.toThrow();
  });
});
