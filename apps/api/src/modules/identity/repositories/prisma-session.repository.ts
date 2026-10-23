import { Inject, Injectable } from '@nestjs/common';
import { AuthSession, Prisma, UserAccount, UserRole } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ManagedUnitOfWork,
  TransactionContext,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';

export type SessionWithUser = AuthSession & {
  user: UserAccount & { roles: UserRole[] };
};

@Injectable()
export class PrismaSessionRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(UNIT_OF_WORK)
    private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
  ) {}

  private getClient(tx?: TransactionContext): Prisma.TransactionClient | PrismaService {
    return tx ? this.uow.clientFor(tx) : this.prisma;
  }

  async create(
    data: {
      id?: string;
      userId: string;
      tokenHash: string;
      csrfHash: string;
      expiresAt: Date;
      lastSeenAt: Date;
    },
    tx?: TransactionContext,
  ): Promise<AuthSession> {
    const client = this.getClient(tx);
    return client.authSession.create({
      data: {
        id: data.id,
        userId: data.userId,
        tokenHash: data.tokenHash,
        csrfHash: data.csrfHash,
        expiresAt: data.expiresAt,
        lastSeenAt: data.lastSeenAt,
      },
    });
  }

  async findByTokenHash(
    tokenHash: string,
    tx?: TransactionContext,
  ): Promise<SessionWithUser | null> {
    const client = this.getClient(tx);
    return client.authSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: { roles: true },
        },
      },
    });
  }

  async updateLastSeen(
    id: string,
    lastSeenAt: Date,
    tx?: TransactionContext,
  ): Promise<AuthSession> {
    const client = this.getClient(tx);
    return client.authSession.update({
      where: { id },
      data: { lastSeenAt },
    });
  }

  async revokeById(
    id: string,
    revokedAt: Date = new Date(),
    tx?: TransactionContext,
  ): Promise<AuthSession> {
    const client = this.getClient(tx);
    return client.authSession.update({
      where: { id },
      data: { revokedAt },
    });
  }

  async revokeAllForUser(
    userId: string,
    revokedAt: Date = new Date(),
    tx?: TransactionContext,
  ): Promise<number> {
    const client = this.getClient(tx);
    const result = await client.authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt },
    });
    return result.count;
  }
}
