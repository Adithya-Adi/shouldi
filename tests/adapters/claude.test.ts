import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';

// Mock child_process before importing the adapter
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, spawn: vi.fn(), execFileSync: vi.fn() };
});
// Mock fs to skip Windows-specific resolveCmd
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return { ...actual, readFileSync: vi.fn(), existsSync: vi.fn() };
});

import { spawn, execFileSync } from 'node:child_process';
import { claudeAdapter } from '../../src/adapters/claude.js';

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
  // Emit stdout and close asynchronously
  setTimeout(() => {
    proc.stdout.emit('data', Buffer.from(stdout));
    proc.emit('close', exitCode);
  }, 0);
  return proc;
}

describe('claudeAdapter', () => {
  beforeEach(() => {
    vi.mocked(execFileSync).mockImplementation(() => {
      throw new Error('not on Windows');
    });
  });

  it('detects claude via --version exit 0', async () => {
    const proc = makeProc('', 0);
    vi.mocked(spawn).mockReturnValue(proc as unknown as ReturnType<typeof spawn>);
    const found = await claudeAdapter.detect();
    expect(found).toBe(true);
    expect(spawn).toHaveBeenCalledWith('claude', ['--version'], expect.objectContaining({ stdio: 'ignore' }));
  });

  it('returns false when claude exits non-zero', async () => {
    const proc = makeProc('', 1);
    vi.mocked(spawn).mockReturnValue(proc as unknown as ReturnType<typeof spawn>);
    const found = await claudeAdapter.detect();
    expect(found).toBe(false);
  });

  it('invokes claude -p with prompt via stdin', async () => {
    const proc = makeProc('{"decision":"yes"}');
    vi.mocked(spawn).mockReturnValue(proc as unknown as ReturnType<typeof spawn>);
    const result = await claudeAdapter.invoke('test prompt', {});
    expect(spawn).toHaveBeenCalledWith(
      'claude',
      ['-p'],
      expect.objectContaining({ stdio: ['pipe', 'pipe', 'pipe'] }),
    );
    expect(proc.stdin.write).toHaveBeenCalledWith('test prompt', 'utf8');
    expect(result).toBe('{"decision":"yes"}');
  });

  it('rejects when claude exits non-zero', async () => {
    const proc = makeProc('', 1);
    vi.mocked(spawn).mockReturnValue(proc as unknown as ReturnType<typeof spawn>);
    await expect(claudeAdapter.invoke('test', {})).rejects.toThrow();
  });
});
