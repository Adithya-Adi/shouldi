import { spawn } from 'node:child_process';
import { runDetect, runCapture } from './_shared.js';
import type { AIAdapter } from './types.js';

async function detectFirstModel(): Promise<string | null> {
  return new Promise((resolve) => {
    const proc = spawn('ollama', ['list'], {
      stdio: ['ignore', 'pipe', 'ignore'],
      shell: false,
    });
    let output = '';
    proc.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    proc.on('error', () => resolve(null));
    proc.on('close', () => {
      const lines = output.trim().split('\n').slice(1); // skip header
      const first = lines[0]?.split(/\s+/)[0]?.trim();
      resolve(first ?? null);
    });
  });
}

export const ollamaAdapter: AIAdapter = {
  id: 'ollama',
  displayName: 'Ollama (local models)',
  note: 'Runs locally — no cloud, no API key',

  detect() {
    return runDetect('ollama', ['--version']);
  },

  async invoke(prompt, { signal }) {
    const model = process.env['OLLAMA_MODEL'] ?? (await detectFirstModel());
    if (!model) {
      throw new Error('No ollama models found. Run: ollama pull llama3.1:8b');
    }
    // ollama run reads from stdin when no prompt positional arg given
    return runCapture('ollama', ['run', model], {
      signal,
      adapterId: 'ollama',
      stdin: prompt,
    });
  },
};
