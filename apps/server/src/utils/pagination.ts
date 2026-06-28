import { z } from 'zod';

/** Reusable query schema for list endpoints: page, pageSize, search, sort. */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

export function toSkipTake(query: ListQuery) {
  return { skip: (query.page - 1) * query.pageSize, take: query.pageSize };
}
