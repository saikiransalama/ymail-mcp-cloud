import { z } from "zod";

export function CursorPage<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().optional(),
    total: z.number().int().optional(),
  });
}

export type CursorPageType<T> = {
  items: T[];
  nextCursor?: string;
  total?: number;
};
