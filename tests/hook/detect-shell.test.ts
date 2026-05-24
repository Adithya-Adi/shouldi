import { describe, it, expect, vi, afterEach } from 'vitest';
import { detectShell } from '../../src/hook/detect-shell.js';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('detectShell', () => {
  describe('hint override', () => {
    it('returns bash when hint is bash', () => {
      expect(detectShell('bash')).toBe('bash');
    });

    it('returns zsh when hint is zsh', () => {
      expect(detectShell('zsh')).toBe('zsh');
    });

    it('returns fish when hint is fish', () => {
      expect(detectShell('fish')).toBe('fish');
    });

    it('returns powershell when hint is powershell', () => {
      expect(detectShell('powershell')).toBe('powershell');
    });

    it('hint is case-insensitive', () => {
      expect(detectShell('ZSH')).toBe('zsh');
      expect(detectShell('Bash')).toBe('bash');
      expect(detectShell('PowerShell')).toBe('powershell');
    });

    it('ignores unrecognised hint and falls back to env detection', () => {
      vi.stubEnv('SHELL', '/bin/zsh');
      // 'ksh' is not a supported shell — should fall through to env detection
      const result = detectShell('ksh');
      expect(['bash', 'zsh', 'fish', 'powershell']).toContain(result);
    });
  });

  // These tests only apply on non-Windows; on win32 detectShell always returns
  // 'powershell' before checking $SHELL.
  const itPosix = it.skipIf(process.platform === 'win32');

  describe('SHELL env detection (non-Windows)', () => {
    itPosix('detects zsh from SHELL path', () => {
      vi.stubEnv('SHELL', '/bin/zsh');
      expect(detectShell()).toBe('zsh');
    });

    itPosix('detects fish from SHELL path', () => {
      vi.stubEnv('SHELL', '/usr/local/bin/fish');
      expect(detectShell()).toBe('fish');
    });

    itPosix('falls back to bash for unknown SHELL', () => {
      vi.stubEnv('SHELL', '/bin/sh');
      expect(detectShell()).toBe('bash');
    });

    itPosix('falls back to bash when SHELL is empty', () => {
      vi.stubEnv('SHELL', '');
      expect(detectShell()).toBe('bash');
    });
  });
});
