import { loadConfig, configExists } from '../config/load.js';
import { runFirstRun } from '../config/firstRun.js';
import { getAdapter } from '../adapters/registry.js';
import { collectAll } from '../collectors/index.js';
import { reduceToSignals } from '../signals/reduce.js';
import { buildPrompt } from '../prompt/build.js';
import { parseVerdict, RETRY_SUFFIX } from '../prompt/parse.js';
import { NoAdapterError, AdapterNotOnPathError, VerdictParseError } from '../lib/errors.js';
import { log } from '../lib/logger.js';
import type { Verdict } from '../prompt/schema.js';
import type { Signals } from '../signals/types.js';

export interface RunOpts {
  with?: string;
  timeoutMs?: number;
  verbose?: boolean;
}

export interface VerdictResult {
  verdict: Verdict;
  signals: Signals;
  adapterId: string;
}

async function parseWithRetry(
  text: string,
  prompt: string,
  adapterId: string,
  invoker: (p: string) => Promise<string>,
): Promise<Verdict> {
  try {
    return parseVerdict(text, adapterId);
  } catch {
    log('First parse failed, retrying with clarification prompt...');
    const retryPrompt = prompt + RETRY_SUFFIX;
    const retryText = await invoker(retryPrompt);
    return parseVerdict(retryText, adapterId);
  }
}

export async function runVerdict(pkg: string, opts: RunOpts = {}): Promise<VerdictResult> {
  // Resolve adapter ID
  let aiId = opts.with;
  if (!aiId) {
    if (!configExists()) {
      aiId = await runFirstRun();
    } else {
      const config = loadConfig();
      aiId = config.ai;
    }
  }

  if (!aiId) {
    throw new NoAdapterError();
  }

  const adapter = getAdapter(aiId);
  if (!adapter) {
    throw new NoAdapterError();
  }

  const isAvailable = await adapter.detect();
  if (!isAvailable) {
    throw new AdapterNotOnPathError(aiId);
  }

  log(`Collecting signals for ${pkg}...`);
  const raw = await collectAll(pkg);
  const signals = reduceToSignals(raw);

  if (signals.meta.collectorsFailed.length > 0) {
    log(`Some collectors failed: ${signals.meta.collectorsFailed.join(', ')}`);
  }

  const prompt = buildPrompt(signals);
  log(`Invoking ${aiId} adapter...`);

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    (opts.timeoutMs ?? 60_000),
  );

  try {
    const text = await adapter.invoke(prompt, { signal: controller.signal });
    log(`Raw adapter response (${text.length} chars)`);

    const verdict = await parseWithRetry(text, prompt, aiId, (p) =>
      adapter.invoke(p, { signal: controller.signal }),
    );

    return { verdict, signals, adapterId: aiId };
  } finally {
    clearTimeout(timer);
  }
}
