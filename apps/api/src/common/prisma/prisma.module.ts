import { Global, Module } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import {
  ManagedUnitOfWork,
  UNIT_OF_WORK,
  UnitOfWork,
} from '../../../../../libs/platform/database/unit-of-work';
import { PrismaTransactionDriver } from '../../../../../libs/platform/database/prisma-transaction-driver';

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: UNIT_OF_WORK,
      useFactory: (prisma: PrismaService): UnitOfWork => {
        const driver = new PrismaTransactionDriver<Prisma.TransactionClient>(prisma, {
          maxWait: 5_000,
          timeout: 10_000,
        });
        return new ManagedUnitOfWork<Prisma.TransactionClient>(driver);
      },
      inject: [PrismaService],
    },
  ],
  exports: [PrismaService, UNIT_OF_WORK],
})
export class PrismaModule {}
