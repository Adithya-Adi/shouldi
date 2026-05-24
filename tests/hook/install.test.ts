import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, readFileSync, unlinkSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { installHook, removeHook, isHookInstalled } from '../../src/hook/install.js';

const HOOK_START = '# >>> shouldi hook >>>';
const HOOK_END = '# <<< shouldi hook <<<';
const SAMPLE_HOOK = 'npm() { shouldi intercept -- "$@"; }';

let tmpFile: string;

beforeEach(() => {
  tmpFile = join(tmpdir(), `shouldi-test-${Date.now()}-${Math.random().toString(36).slice(2)}.sh`);
});

afterEach(() => {
  if (existsSync(tmpFile)) unlinkSync(tmpFile);
});

describe('isHookInstalled', () => {
  it('returns false when file does not exist', () => {
    expect(isHookInstalled(tmpFile)).toBe(false);
  });

  it('returns false when file exists but has no hook', () => {
    writeFileSync(tmpFile, 'export PATH="$HOME/bin:$PATH"\n', 'utf8');
    expect(isHookInstalled(tmpFile)).toBe(false);
  });

  it('returns true when hook block present', () => {
    writeFileSync(tmpFile, `${HOOK_START}\n${SAMPLE_HOOK}\n${HOOK_END}\n`, 'utf8');
    expect(isHookInstalled(tmpFile)).toBe(true);
  });
});

describe('installHook', () => {
  it('creates file if it does not exist', () => {
    installHook(tmpFile, SAMPLE_HOOK);
    expect(existsSync(tmpFile)).toBe(true);
  });

  it('writes hook block delimiters', () => {
    installHook(tmpFile, SAMPLE_HOOK);
    const content = readFileSync(tmpFile, 'utf8');
    expect(content).toContain(HOOK_START);
    expect(content).toContain(HOOK_END);
    expect(content).toContain(SAMPLE_HOOK);
  });

  it('preserves existing content before hook', () => {
    writeFileSync(tmpFile, 'export EDITOR=vim\n', 'utf8');
    installHook(tmpFile, SAMPLE_HOOK);
    const content = readFileSync(tmpFile, 'utf8');
    expect(content).toContain('export EDITOR=vim');
    expect(content).toContain(HOOK_START);
  });

  it('hook block appears after existing content', () => {
    writeFileSync(tmpFile, 'export EDITOR=vim\n', 'utf8');
    installHook(tmpFile, SAMPLE_HOOK);
    const content = readFileSync(tmpFile, 'utf8');
    expect(content.indexOf('export EDITOR=vim')).toBeLessThan(content.indexOf(HOOK_START));
  });

  it('replaces existing hook instead of duplicating', () => {
    installHook(tmpFile, SAMPLE_HOOK);
    installHook(tmpFile, 'npm() { echo updated; }');
    const content = readFileSync(tmpFile, 'utf8');
    const count = (content.match(new RegExp(HOOK_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;
    expect(count).toBe(1);
    expect(content).toContain('echo updated');
    expect(content).not.toContain(SAMPLE_HOOK);
  });

  it('creates parent directory if missing', () => {
    const subdir = join(tmpdir(), `shouldi-dir-${Date.now()}`);
    const nestedFile = join(subdir, 'config.fish');
    try {
      installHook(nestedFile, SAMPLE_HOOK);
      expect(existsSync(nestedFile)).toBe(true);
    } finally {
      if (existsSync(nestedFile)) unlinkSync(nestedFile);
      if (existsSync(subdir)) require('node:fs').rmdirSync(subdir);
    }
  });
});

describe('removeHook', () => {
  it('is a no-op when file does not exist', () => {
    expect(() => removeHook(tmpFile)).not.toThrow();
  });

  it('is a no-op when hook not present', () => {
    writeFileSync(tmpFile, 'export EDITOR=vim\n', 'utf8');
    removeHook(tmpFile);
    expect(readFileSync(tmpFile, 'utf8')).toContain('export EDITOR=vim');
  });

  it('removes hook block', () => {
    installHook(tmpFile, SAMPLE_HOOK);
    removeHook(tmpFile);
    const content = readFileSync(tmpFile, 'utf8');
    expect(content).not.toContain(HOOK_START);
    expect(content).not.toContain(HOOK_END);
    expect(content).not.toContain(SAMPLE_HOOK);
  });

  it('preserves content before hook after removal', () => {
    writeFileSync(tmpFile, 'export EDITOR=vim\n', 'utf8');
    installHook(tmpFile, SAMPLE_HOOK);
    removeHook(tmpFile);
    expect(readFileSync(tmpFile, 'utf8')).toContain('export EDITOR=vim');
  });

  it('preserves content after hook after removal', () => {
    writeFileSync(tmpFile, `${HOOK_START}\n${SAMPLE_HOOK}\n${HOOK_END}\nexport PAGER=less\n`, 'utf8');
    removeHook(tmpFile);
    const content = readFileSync(tmpFile, 'utf8');
    expect(content).toContain('export PAGER=less');
    expect(content).not.toContain(HOOK_START);
  });

  it('isHookInstalled returns false after removal', () => {
    installHook(tmpFile, SAMPLE_HOOK);
    removeHook(tmpFile);
    expect(isHookInstalled(tmpFile)).toBe(false);
  });
});
