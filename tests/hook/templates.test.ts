import { describe, it, expect } from 'vitest';
import { getHookContent } from '../../src/hook/templates.js';
import type { SupportedShell } from '../../src/hook/detect-shell.js';

const SHELLS: SupportedShell[] = ['bash', 'zsh', 'fish', 'powershell'];

describe('getHookContent', () => {
  for (const shell of SHELLS) {
    describe(shell, () => {
      it('returns non-empty string', () => {
        expect(getHookContent(shell).trim().length).toBeGreaterThan(0);
      });

      it('calls shouldi intercept', () => {
        expect(getHookContent(shell)).toContain('shouldi intercept');
      });

      it('handles both install and i subcommands', () => {
        const content = getHookContent(shell);
        expect(content).toContain('install');
        expect(content).toContain(' i');
      });

      it('passes args through to shouldi intercept', () => {
        // hook must forward the rest args so shouldi sees the package names
        const content = getHookContent(shell);
        expect(content).toMatch(/intercept/);
      });
    });
  }

  it('bash and zsh share identical template', () => {
    expect(getHookContent('bash')).toBe(getHookContent('zsh'));
  });

  it('bash template wraps npm as a shell function', () => {
    expect(getHookContent('bash')).toMatch(/^npm\(\)/m);
  });

  it('fish template wraps npm as a function', () => {
    expect(getHookContent('fish')).toMatch(/^function npm/m);
  });

  it('powershell template wraps npm as a function', () => {
    expect(getHookContent('powershell')).toMatch(/^function npm/m);
  });

  it('powershell template calls npm.cmd for real installs', () => {
    expect(getHookContent('powershell')).toContain('npm.cmd');
  });

  it('bash template uses `command npm` to avoid recursion', () => {
    expect(getHookContent('bash')).toContain('command npm');
  });

  it('fish template uses `command npm` to avoid recursion', () => {
    expect(getHookContent('fish')).toContain('command npm');
  });
});
