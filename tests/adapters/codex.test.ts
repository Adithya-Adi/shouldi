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
import { codexAdapter } from '../../src/adapters/codex.js';

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

describe('codexAdapter', () => {
  beforeEach(() => {
    vi.mocked(spawn).mockReset();
    vi.mocked(execFileSync).mockImplementation(() => { throw new Error('not windows'); });
    delete process.env['CODEX_MODEL'];
  });

  it('detects codex via --version', async () => {
    const proc = makeProc('', 0);
    vi.mocked(spawn).mockReturnValue(proc as unknown as ReturnType<typeof spawn>);
    expect(await codexAdapter.detect()).toBe(true);
    expect(spawn).toHaveBeenCalledWith('codex', ['--version'], expect.anything());
  });

  it('invokes codex exec with stdin and required flags', async () => {
    const proc = makeProc('{"decision":"yes"}');
    vi.mocked(spawn).mockReturnValue(proc as unknown as ReturnType<typeof spawn>);
    await codexAdapter.invoke('test', {});
    expect(spawn).toHaveBeenCalledWith(
      'codex',
      ['exec', '-', '--skip-git-repo-check', '--sandbox', 'read-only'],
      expect.objectContaining({ stdio: ['pipe', 'pipe', 'pipe'] }),
    );
    expect(proc.stdin.write).toHaveBeenCalledWith('test', 'utf8');
  });

  it('appends --model when CODEX_MODEL env set', async () => {
    process.env['CODEX_MODEL'] = 'o4-mini';
    const proc = makeProc('{}');
    vi.mocked(spawn).mockReturnValue(proc as unknown as ReturnType<typeof spawn>);
    await codexAdapter.invoke('test', {}).catch(() => {});
    expect(spawn).toHaveBeenCalledWith(
      'codex',
      ['exec', '-', '--skip-git-repo-check', '--sandbox', 'read-only', '--model', 'o4-mini'],
      expect.anything(),
    );
  });
});
