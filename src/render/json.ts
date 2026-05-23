import type { VerdictResult } from '../verdict/run.js';

export function renderJson(result: VerdictResult, full = false): void {
  const output = full
    ? { ...result.verdict, signals: result.signals, adapter: result.adapterId }
    : { ...result.verdict, adapter: result.adapterId };
  console.log(JSON.stringify(output, null, 2));
}
