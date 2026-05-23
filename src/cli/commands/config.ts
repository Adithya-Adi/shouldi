import type { Command } from 'commander';

export function registerConfigCommand(program: Command) {
  const config = program
    .command('config')
    .description('Manage shouldi configuration');

  config
    .command('show', { isDefault: true })
    .description('Show current config')
    .action(async () => {
      console.error('not implemented: config show');
      process.exit(1);
    });

  config
    .command('set <key> <value>')
    .description('Set a config value (e.g. set ai claude)')
    .action(async (key: string, value: string) => {
      console.error('not implemented: config set', key, value);
      process.exit(1);
    });

  config
    .command('reset')
    .description('Wipe config and re-run first-time setup')
    .action(async () => {
      console.error('not implemented: config reset');
      process.exit(1);
    });
}
