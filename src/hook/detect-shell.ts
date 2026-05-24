import { platform, homedir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

export type SupportedShell = 'bash' | 'zsh' | 'fish' | 'powershell';

export function detectShell(hint?: string): SupportedShell {
  if (hint) {
    const h = hint.toLowerCase();
    if (h === 'bash' || h === 'zsh' || h === 'fish' || h === 'powershell') {
      return h as SupportedShell;
    }
  }
  if (platform() === 'win32') return 'powershell';
  const shell = process.env['SHELL'] ?? '';
  if (shell.endsWith('zsh')) return 'zsh';
  if (shell.endsWith('fish')) return 'fish';
  return 'bash';
}

function getPowerShellProfile(): string {
  try {
    const raw = execSync('powershell -NoProfile -NonInteractive -Command "$PROFILE"', {
      encoding: 'utf8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    if (raw && raw.length > 0) return raw;
  } catch {
    // fall through to default
  }
  const home = homedir();
  // PowerShell 7+ default
  return join(home, 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1');
}

export function getProfileFile(shell: SupportedShell): string {
  const home = homedir();
  switch (shell) {
    case 'bash':
      return join(home, '.bashrc');
    case 'zsh':
      return join(home, '.zshrc');
    case 'fish':
      return join(home, '.config', 'fish', 'config.fish');
    case 'powershell':
      return getPowerShellProfile();
  }
}
