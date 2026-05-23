import { z } from 'zod';

export const VerdictSchema = z.object({
  decision: z.enum(['yes', 'caution', 'no']),
  headline: z.string().max(100),
  reasons: z.array(z.string().max(120)).min(1).max(4),
  alternatives: z
    .array(
      z.object({
        name: z.string(),
        why: z.string().max(80),
      }),
    )
    .max(3),
  confidence: z.enum(['low', 'medium', 'high']),
});

export type Verdict = z.infer<typeof VerdictSchema>;
