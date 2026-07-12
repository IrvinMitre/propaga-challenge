import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import {
  DISBURSEMENT_REPOSITORY,
  type DisbursementRepository,
} from './application/ports';
import {
  ApproveDisbursementUseCase,
  GetDisbursementUseCase,
  ListDisbursementsUseCase,
  RejectDisbursementUseCase,
  SeedDisbursementsUseCase,
} from './application/use-cases';
import { DisbursementsController } from './infrastructure/http';
import { PrismaDisbursementRepository } from './infrastructure/persistence/prisma';

@Module({
  imports: [PrismaModule],
  controllers: [DisbursementsController],
  providers: [
    PrismaDisbursementRepository,
    {
      provide: DISBURSEMENT_REPOSITORY,
      useExisting: PrismaDisbursementRepository,
    },
    {
      provide: ApproveDisbursementUseCase,
      useFactory: (repository: DisbursementRepository) =>
        new ApproveDisbursementUseCase(repository),
      inject: [DISBURSEMENT_REPOSITORY],
    },
    {
      provide: RejectDisbursementUseCase,
      useFactory: (repository: DisbursementRepository) =>
        new RejectDisbursementUseCase(repository),
      inject: [DISBURSEMENT_REPOSITORY],
    },
    {
      provide: GetDisbursementUseCase,
      useFactory: (repository: DisbursementRepository) =>
        new GetDisbursementUseCase(repository),
      inject: [DISBURSEMENT_REPOSITORY],
    },
    {
      provide: ListDisbursementsUseCase,
      useFactory: (repository: DisbursementRepository) =>
        new ListDisbursementsUseCase(repository),
      inject: [DISBURSEMENT_REPOSITORY],
    },
    {
      provide: SeedDisbursementsUseCase,
      useFactory: (repository: DisbursementRepository) =>
        new SeedDisbursementsUseCase(repository),
      inject: [DISBURSEMENT_REPOSITORY],
    },
  ],
})
export class DisbursementsModule {}
