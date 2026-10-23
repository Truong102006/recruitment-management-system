export type MailContent =
  | {
      kind: 'public';
      templateCode: string;
      recipient: string;
      subject: string;
      variables: Record<string, string | number>;
    }
  | {
      kind: 'auth';
      purpose: 'VERIFY' | 'RESET';
      recipient: string;
      tokenMaterial: { token: string; email: string };
    };

export interface SendMailInput {
  deliveryId: string;
  recipient: string;
  content: MailContent;
}

export interface MailPort {
  send(input: SendMailInput): Promise<{ providerMessageId?: string }>;
}

export const MAIL_PORT = Symbol.for('rms.MailPort.v1');
