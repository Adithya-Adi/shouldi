import type { AIAdapter } from './types.js';
import { claudeAdapter } from './claude.js';
import { codexAdapter } from './codex.js';
import { ollamaAdapter } from './ollama.js';
import { geminiAdapter } from './gemini.js';
import { cursorAdapter } from './cursor.js';
import { aiderAdapter } from './aider.js';

export const ALL_ADAPTERS: AIAdapter[] = [
  claudeAdapter,
  codexAdapter,
  ollamaAdapter,
  geminiAdapter,
  cursorAdapter,
  aiderAdapter,
];

export function getAdapter(id: string): AIAdapter | undefined {
  return ALL_ADAPTERS.find((a) => a.id === id);
}

export async function detectAdapters(): Promise<AIAdapter[]> {
  const results = await Promise.all(
    ALL_ADAPTERS.map(async (a) => ({ adapter: a, found: await a.detect() })),
  );
  return results.filter((r) => r.found).map((r) => r.adapter);
}
