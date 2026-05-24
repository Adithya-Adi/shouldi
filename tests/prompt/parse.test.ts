import { describe, it, expect } from 'vitest';
import { parseVerdict } from '../../src/prompt/parse.js';
import { VerdictParseError } from '../../src/lib/errors.js';

const VALID_VERDICT = JSON.stringify({
  decision: 'yes',
  headline: 'Solid, actively maintained package',
  reasons: ['Weekly downloads exceed 1M', 'MIT licensed, zero dependencies'],
  alternatives: [],
  confidence: 'high',
});

describe('parseVerdict', () => {
  it('parses clean JSON', () => {
    const v = parseVerdict(VALID_VERDICT, 'claude');
    expect(v.decision).toBe('yes');
    expect(v.confidence).toBe('high');
    expect(v.reasons).toHaveLength(2);
  });

  it('strips markdown fences', () => {
    const wrapped = '```json\n' + VALID_VERDICT + '\n```';
    const v = parseVerdict(wrapped, 'claude');
    expect(v.decision).toBe('yes');
  });

  it('extracts JSON from prose-wrapped response', () => {
    const prose = 'Here is my verdict:\n' + VALID_VERDICT + '\nHope that helps!';
    const v = parseVerdict(prose, 'claude');
    expect(v.decision).toBe('yes');
  });

  it('throws VerdictParseError on garbage input', () => {
    expect(() => parseVerdict('not json at all', 'claude')).toThrow(VerdictParseError);
  });

  it('throws VerdictParseError on invalid schema', () => {
    const bad = JSON.stringify({ decision: 'maybe', headline: 'x', reasons: [], alternatives: [], confidence: 'high' });
    expect(() => parseVerdict(bad, 'claude')).toThrow(VerdictParseError);
  });

  it('handles caution verdict with alternatives', () => {
    const raw = JSON.stringify({
      decision: 'caution',
      headline: 'Dormant but still widely used',
      reasons: ['No release in 2 years', '4 known vulns'],
      alternatives: [{ name: 'dayjs', why: '2KB, moment-compatible API' }],
      confidence: 'medium',
    });
    const v = parseVerdict(raw, 'ollama');
    expect(v.decision).toBe('caution');
    expect(v.alternatives[0]?.name).toBe('dayjs');
  });

  describe('alternative name normalization', () => {
    function verdictWithAlts(alts: Array<{ name: string; why: string }>) {
      return JSON.stringify({
        decision: 'no',
        headline: 'Avoid this package',
        reasons: ['Abandoned'],
        alternatives: alts,
        confidence: 'high',
      });
    }

    it('lowercases display-cased names', () => {
      const v = parseVerdict(verdictWithAlts([{ name: 'Day.js', why: 'Lightweight' }]), 'codex');
      expect(v.alternatives[0]?.name).toBe('day.js');
    });

    it('lowercases title-cased names like Luxon', () => {
      const v = parseVerdict(verdictWithAlts([{ name: 'Luxon', why: 'Modern Intl-based API' }]), 'codex');
      expect(v.alternatives[0]?.name).toBe('luxon');
    });

    it('trims surrounding whitespace', () => {
      const v = parseVerdict(verdictWithAlts([{ name: '  date-fns  ', why: 'Modular' }]), 'claude');
      expect(v.alternatives[0]?.name).toBe('date-fns');
    });

    it('normalizes multiple alternatives independently', () => {
      const v = parseVerdict(
        verdictWithAlts([
          { name: 'Date-Fns', why: 'Tree-shakeable' },
          { name: 'Luxon', why: 'Intl-based' },
          { name: 'Day.JS', why: 'Tiny' },
        ]),
        'gemini',
      );
      expect(v.alternatives.map((a) => a.name)).toEqual(['date-fns', 'luxon', 'day.js']);
    });

    it('leaves already-correct lowercase names unchanged', () => {
      const v = parseVerdict(
        verdictWithAlts([{ name: 'date-fns', why: 'Modular' }]),
        'claude',
      );
      expect(v.alternatives[0]?.name).toBe('date-fns');
    });
  });
});
