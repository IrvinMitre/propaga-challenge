import { z } from 'zod';

export const RejectDisbursementRequestSchema = z.object({
  reason: z.string().trim().min(1),
});
