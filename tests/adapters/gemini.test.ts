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
import { geminiAdapter } from '../../src/adapters/gemini.js';

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

describe('geminiAdapter', () => {
  beforeEach(() => {
    vi.mocked(spawn).mockReset();
    vi.mocked(execFileSync).mockImplementation(() => { throw new Error('not windows'); });
  });

  it('detects via --version exit 0', async () => {
    vi.mocked(spawn).mockReturnValue(makeProc('', 0) as unknown as ReturnType<typeof spawn>);
    expect(await geminiAdapter.detect()).toBe(true);
    expect(spawn).toHaveBeenCalledWith('gemini', ['--version'], expect.anything());
  });

  it('returns false when not installed', async () => {
    vi.mocked(spawn).mockReturnValue(makeProc('', 1) as unknown as ReturnType<typeof spawn>);
    expect(await geminiAdapter.detect()).toBe(false);
  });

  it('invokes gemini -p with prompt as argument', async () => {
    const proc = makeProc('{"decision":"yes"}');
    vi.mocked(spawn).mockReturnValue(proc as unknown as ReturnType<typeof spawn>);
    const result = await geminiAdapter.invoke('test prompt', {});
    // gemini -p takes prompt as positional argument (not stdin)
    expect(spawn).toHaveBeenCalledWith(
      'gemini',
      ['-p', 'test prompt'],
      expect.objectContaining({ stdio: ['pipe', 'pipe', 'pipe'] }),
    );
    expect(result).toBe('{"decision":"yes"}');
  });
});
