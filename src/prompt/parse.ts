import { VerdictSchema, type Verdict } from './schema.js';
import { VerdictParseError } from '../lib/errors.js';

export function parseVerdict(raw: string, adapterId: string): Verdict {
  const stripped = raw
    .replace(/^```(?:json)?\s*/gm, '')
    .replace(/```\s*$/gm, '')
    .trim();

  // Extract first JSON object if there's surrounding text
  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new VerdictParseError(adapterId);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new VerdictParseError(adapterId);
  }

  const result = VerdictSchema.safeParse(parsed);
  if (!result.success) {
    throw new VerdictParseError(adapterId);
  }

  return result.data;
}

export const RETRY_SUFFIX =
  '\n\nYour previous response could not be parsed. Return ONLY valid JSON matching the schema. No commentary, no markdown.';
