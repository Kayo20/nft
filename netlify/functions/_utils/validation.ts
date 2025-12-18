import { z } from "zod";

export const NonceRequestSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
});

export const VerifySchema = z.object({
  message: z.string().min(1, "Message required"),
  signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/, "Invalid signature format"),
});

export const FuseRequestSchema = z.object({
  nftIds: z.array(z.number().int().positive()).min(3, "Need 3 NFTs").max(3, "Max 3 NFTs"),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid tx hash').optional(),
});

export const OpenChestSchema = z.object({
  type: z.enum(["standard", "premium"]).default("standard"),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid tx hash').optional(),
});

export const PurchaseRequestSchema = z.object({
  itemId: z.string().min(1, "itemId required"),
  qty: z.number().int().positive("qty must be positive"),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid tx hash').optional(),
});

export function validateRequest<T>(schema: z.ZodSchema<T>, data: any): { valid: boolean; data?: T; error?: string } {
  try {
    const result = schema.parse(data);
    return { valid: true, data: result };
  } catch (err) {
    const message = err instanceof z.ZodError ? err.errors.map(e => e.message).join(", ") : String(err);
    return { valid: false, error: message };
  }
}
