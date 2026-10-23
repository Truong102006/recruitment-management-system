import { Inject, Injectable } from '@nestjs/common';
import { AuthToken, Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  ManagedUnitOfWork,
  TransactionContext,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';

@Injectable()
export class PrismaAuthTokenRepository {
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
      userId: string;
      purpose: string;
      tokenHash: string;
      expiresAt: Date;
    },
    tx: TransactionContext,
  ): Promise<AuthToken> {
    const client = this.uow.clientFor(tx);
    return client.authToken.create({
      data: {
        userId: data.userId,
        purpose: data.purpose,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findByHash(
    tokenHash: string,
    purpose: string,
    tx?: TransactionContext,
  ): Promise<AuthToken | null> {
    const client = this.getClient(tx);
    return client.authToken.findFirst({
      where: {
        tokenHash,
        purpose,
      },
    });
  }

  /**
   * Compare-and-Set (CAS) atomic consumption:
   * Only consumes if not yet consumed, not invalidated, and not expired.
   * Returns true if successfully consumed, false if already consumed or expired or invalidated.
   */
  async consumeAtomic(id: string, consumedAt: Date, tx: TransactionContext): Promise<boolean> {
    const client = this.uow.clientFor(tx);
    const count = await client.$executeRaw`
      UPDATE "auth_token"
      SET "consumed_at" = ${consumedAt}
      WHERE "id" = ${id}::uuid
        AND "consumed_at" IS NULL
        AND "invalidated_at" IS NULL
        AND "expires_at" > clock_timestamp()
    `;
    return count > 0;
  }

  async invalidateActiveForUser(
    userId: string,
    purpose: string,
    invalidatedAt: Date,
    tx: TransactionContext,
  ): Promise<number> {
    const client = this.uow.clientFor(tx);
    const result = await client.authToken.updateMany({
      where: {
        userId,
        purpose,
        consumedAt: null,
        invalidatedAt: null,
      },
      data: {
        invalidatedAt,
      },
    });
    return result.count;
  }
}
