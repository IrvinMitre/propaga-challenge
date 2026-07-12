import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import {
  DisbursementStatus,
  ErrorCode,
  type ApiErrorResponse,
  type ApiSuccess,
  type DisbursementDto,
  type ListDisbursementsResponse,
  type SeedDisbursementsResult,
} from '@propaga/contracts';
import type { Disbursement } from '../../domain';
import {
  ApproveDisbursementUseCase,
  GetDisbursementUseCase,
  ListDisbursementsUseCase,
  RejectDisbursementUseCase,
  SeedDisbursementsUseCase,
} from '../../application/use-cases';
import type { ListDisbursementsFilters } from '../../application/ports';
import { ListDisbursementsQueryDto, RejectDisbursementDto } from './dto';
import { DisbursementExceptionFilter } from './filters';

@Controller('disbursements')
@UseFilters(DisbursementExceptionFilter)
export class DisbursementsController {
  constructor(
    private readonly listDisbursementsUseCase: ListDisbursementsUseCase,
    private readonly getDisbursementUseCase: GetDisbursementUseCase,
    private readonly approveDisbursementUseCase: ApproveDisbursementUseCase,
    private readonly rejectDisbursementUseCase: RejectDisbursementUseCase,
    private readonly seedDisbursementsUseCase: SeedDisbursementsUseCase,
  ) {}

  @Get()
  async list(
    @Query() query: ListDisbursementsQueryDto,
  ): Promise<ApiSuccess<ListDisbursementsResponse>> {
    const result = await this.listDisbursementsUseCase.execute(
      this.toListFilters(query),
    );

    return {
      data: {
        items: result.items.map(toDisbursementDto),
        next_cursor: result.nextCursor,
      },
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<ApiSuccess<DisbursementDto>> {
    const disbursement = await this.getDisbursementUseCase.execute({ id });

    return {
      data: toDisbursementDto(disbursement),
    };
  }

  @Post('seed')
  async seed(): Promise<ApiSuccess<SeedDisbursementsResult>> {
    const result = await this.seedDisbursementsUseCase.execute();

    return {
      data: result,
    };
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Headers('x-actor-id') actorId: string | undefined,
  ): Promise<ApiSuccess<DisbursementDto>> {
    const disbursement = await this.approveDisbursementUseCase.execute({
      id,
      actorId: parseActorId(actorId),
    });

    return {
      data: toDisbursementDto(disbursement),
    };
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Headers('x-actor-id') actorId: string | undefined,
    @Body() body: RejectDisbursementDto | undefined,
  ): Promise<ApiSuccess<DisbursementDto>> {
    const disbursement = await this.rejectDisbursementUseCase.execute({
      id,
      actorId: parseActorId(actorId),
      rejectReason: body?.reason ?? '',
    });

    return {
      data: toDisbursementDto(disbursement),
    };
  }

  private toListFilters(
    query: ListDisbursementsQueryDto,
  ): ListDisbursementsFilters {
    const minAmountCents = parseOptionalInteger(query.min_amount, 'min_amount');
    const maxAmountCents = parseOptionalInteger(query.max_amount, 'max_amount');

    if (
      minAmountCents !== undefined &&
      maxAmountCents !== undefined &&
      minAmountCents > maxAmountCents
    ) {
      throwValidationError(
        'min_amount must be less than or equal to max_amount.',
      );
    }

    return {
      status: parseStatus(query.status),
      distribuidorId: query.distributor,
      minAmountCents,
      maxAmountCents,
      limit: parseLimit(query.limit),
      cursor: query.cursor,
    };
  }
}

function toDisbursementDto(disbursement: Disbursement): DisbursementDto {
  return {
    id: disbursement.id,
    tendero_id: disbursement.tenderoId,
    distribuidor_id: disbursement.distribuidorId,
    amount_cents: disbursement.amountCents,
    currency: disbursement.currency,
    status: disbursement.status,
    created_at: disbursement.createdAt.toISOString(),
    decided_at: disbursement.decidedAt?.toISOString() ?? null,
    decided_by: disbursement.decidedBy,
    reject_reason: disbursement.rejectReason,
  };
}

function parseActorId(actorId: string | undefined): string {
  const normalizedActorId = actorId?.trim();

  if (normalizedActorId === undefined || normalizedActorId.length === 0) {
    throwValidationError('x-actor-id header is required.');
  }

  return normalizedActorId;
}

function parseStatus(
  status: DisbursementStatus | undefined,
): DisbursementStatus | undefined {
  if (status === undefined) {
    return undefined;
  }

  if (Object.values(DisbursementStatus).includes(status)) {
    return status;
  }

  throwValidationError(`Invalid status "${status}".`);
}

function parseLimit(limit: string | undefined): number {
  const parsedLimit = parseOptionalInteger(limit, 'limit') ?? 50;

  if (parsedLimit < 1 || parsedLimit > 100) {
    throwValidationError('limit must be between 1 and 100.');
  }

  return parsedLimit;
}

function parseOptionalInteger(
  value: string | undefined,
  field: string,
): number | undefined {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue)) {
    throwValidationError(`${field} must be an integer.`);
  }

  if (parsedValue < 0) {
    throwValidationError(`${field} must be greater than or equal to 0.`);
  }

  return parsedValue;
}

function throwValidationError(message: string): never {
  const response: ApiErrorResponse = {
    error: {
      code: ErrorCode.ValidationError,
      message,
    },
  };

  throw new BadRequestException(response);
}
