import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const HOOK_START = '# >>> shouldi hook >>>';
const HOOK_END = '# <<< shouldi hook <<<';

export function installHook(profilePath: string, hookContent: string): void {
  const dir = dirname(profilePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  let content = existsSync(profilePath) ? readFileSync(profilePath, 'utf8') : '';
  content = removeHookFromContent(content);

  const block = `\n${HOOK_START}\n${hookContent}\n${HOOK_END}\n`;
  content = content.trimEnd() + '\n' + block;

  writeFileSync(profilePath, content, 'utf8');
}

export function removeHook(profilePath: string): void {
  if (!existsSync(profilePath)) return;
  const content = readFileSync(profilePath, 'utf8');
  writeFileSync(profilePath, removeHookFromContent(content), 'utf8');
}

function removeHookFromContent(content: string): string {
  const start = content.indexOf(HOOK_START);
  const end = content.indexOf(HOOK_END);
  if (start === -1 || end === -1) return content;
  const before = content.slice(0, start).trimEnd();
  const after = content.slice(end + HOOK_END.length);
  return before + (after.startsWith('\n') ? after : '\n' + after);
}

export function isHookInstalled(profilePath: string): boolean {
  if (!existsSync(profilePath)) return false;
  return readFileSync(profilePath, 'utf8').includes(HOOK_START);
}
