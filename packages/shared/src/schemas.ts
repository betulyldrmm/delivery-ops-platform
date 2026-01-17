import { z } from "zod";

export const orderSchema = z.object({
  id: z.string(),
  status: z.string(),
  promisedEta: z.number(),
  currentEta: z.number(),
  etaDeltaMinutes: z.number(),
  riskScore: z.number(),
  paymentStatus: z.string(),
  refundStatus: z.string()
});

export const alertSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  type: z.string(),
  severity: z.string(),
  isNew: z.boolean()
});
