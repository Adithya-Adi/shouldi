import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, spawn: vi.fn(), execFileSync: vi.fn() };
});
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return { ...actual, readFileSync: vi.fn(), existsSync: vi.fn() };
});

import { spawn, execFileSync } from 'node:child_process';
import { ollamaAdapter } from '../../src/adapters/ollama.js';

function makeProc(stdout: string, exitCode = 0) {
  const proc = new EventEmitter() as NodeJS.EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    stdin: { write: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn> };
    kill: ReturnType<typeof vi.fn>;
  };
  proc.stdout = new EventEmitter();
  proc.stderr = new EventEmitter();
  proc.stdin = { write: vi.fn(), end: vi.fn() };
  proc.kill = vi.fn();
  setTimeout(() => {
    proc.stdout.emit('data', Buffer.from(stdout));
    proc.emit('close', exitCode);
  }, 0);
  return proc;
}

describe('ollamaAdapter', () => {
  beforeEach(() => {
    vi.mocked(spawn).mockReset();
    vi.mocked(execFileSync).mockImplementation(() => { throw new Error('not windows'); });
    delete process.env['OLLAMA_MODEL'];
  });

  it('detects ollama via --version', async () => {
    const proc = makeProc('', 0);
    vi.mocked(spawn).mockReturnValue(proc as unknown as ReturnType<typeof spawn>);
    expect(await ollamaAdapter.detect()).toBe(true);
  });

  it('uses OLLAMA_MODEL env var when set', async () => {
    process.env['OLLAMA_MODEL'] = 'llama3.1:8b';
    // list proc (for auto-detect, should not be called when env var set)
    const runProc = makeProc('response text');
    vi.mocked(spawn).mockReturnValue(runProc as unknown as ReturnType<typeof spawn>);
    await ollamaAdapter.invoke('prompt', {});
    expect(spawn).toHaveBeenCalledWith(
      'ollama',
      ['run', 'llama3.1:8b'],
      expect.anything(),
    );
  });

  it('auto-detects first model from ollama list when no env var', async () => {
    const listOutput = 'NAME                   ID        SIZE\nllama3:latest          abc123    4.7GB\n';
    const listProc = makeProc(listOutput, 0);
    const runProc = makeProc('{"decision":"yes"}');
    vi.mocked(spawn)
      .mockReturnValueOnce(listProc as unknown as ReturnType<typeof spawn>)
      .mockReturnValueOnce(runProc as unknown as ReturnType<typeof spawn>);
    await ollamaAdapter.invoke('prompt', {});
    expect(spawn).toHaveBeenLastCalledWith('ollama', ['run', 'llama3:latest'], expect.anything());
  });

  it('throws when no models available', async () => {
    const listProc = makeProc('NAME  ID  SIZE\n', 0);
    vi.mocked(spawn).mockReturnValue(listProc as unknown as ReturnType<typeof spawn>);
    await expect(ollamaAdapter.invoke('prompt', {})).rejects.toThrow('No ollama models');
  });
});
