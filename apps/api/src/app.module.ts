import { Module } from '@nestjs/common';
import { DisbursementsModule } from './disbursements/disbursements.module';

@Module({
  imports: [DisbursementsModule],
})
export class AppModule {}
