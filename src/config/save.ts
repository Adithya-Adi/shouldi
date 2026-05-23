import { writeFileSync } from 'node:fs';
import TOML from '@iarna/toml';
import { getConfigPath, type Config } from './load.js';

export function saveConfig(config: Config): void {
  const toml = TOML.stringify(config as unknown as TOML.JsonMap);
  writeFileSync(getConfigPath(), toml, 'utf8');
}
