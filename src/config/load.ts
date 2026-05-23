import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import TOML from '@iarna/toml';

export interface Config {
  ai: string;
  timeoutSeconds: number;
  ollamaModel?: string;
}

const CONFIG_PATH = join(homedir(), '.shouldirc');

const DEFAULTS: Config = {
  ai: '',
  timeoutSeconds: 60,
};

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function configExists(): boolean {
  return existsSync(CONFIG_PATH);
}

export function loadConfig(): Config {
  if (!existsSync(CONFIG_PATH)) return { ...DEFAULTS };

  try {
    const raw = readFileSync(CONFIG_PATH, 'utf8');
    const parsed = TOML.parse(raw) as Partial<Config>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}
