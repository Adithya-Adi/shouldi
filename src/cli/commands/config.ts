import type { Command } from 'commander';
import { loadConfig, getConfigPath } from '../../config/load.js';
import { saveConfig } from '../../config/save.js';
import pc from 'picocolors';
import { existsSync, unlinkSync } from 'node:fs';

export function registerConfigCommand(program: Command) {
  const config = program
    .command('config')
    .description('Manage shouldi configuration');

  config
    .command('show', { isDefault: true })
    .description('Show current config')
    .action(() => {
      const path = getConfigPath();
      if (!existsSync(path)) {
        console.log(pc.dim('No config yet. Run shouldi <package> to set up.'));
        return;
      }
      const cfg = loadConfig();
      console.log(`Config: ${pc.dim(path)}\n`);
      console.log(`  ai: ${pc.bold(cfg.ai || '(not set)')}`);
      console.log(`  timeout: ${cfg.timeoutSeconds}s`);
      if (cfg.ollamaModel) console.log(`  ollamaModel: ${cfg.ollamaModel}`);
    });

  config
    .command('set <key> <value>')
    .description('Set a config value (e.g. set ai claude)')
    .action((key: string, value: string) => {
      const cfg = loadConfig();
      if (key === 'ai') {
        cfg.ai = value;
      } else if (key === 'timeout') {
        cfg.timeoutSeconds = parseInt(value, 10);
      } else if (key === 'ollamaModel') {
        cfg.ollamaModel = value;
      } else {
        console.error(pc.red(`Unknown config key: ${key}`));
        process.exit(1);
      }
      saveConfig(cfg);
      console.log(pc.green(`Set ${key} = ${value}`));
    });

  config
    .command('reset')
    .description('Wipe config and re-run first-time setup on next run')
    .action(() => {
      const path = getConfigPath();
      if (existsSync(path)) {
        unlinkSync(path);
        console.log(pc.green('Config reset. Run shouldi <package> to set up again.'));
      } else {
        console.log(pc.dim('No config to reset.'));
      }
    });
}
