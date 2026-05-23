import type { Command } from 'commander';

export function registerCheckCommand(program: Command) {
  program
    .argument('[package]', 'Package name (e.g. lodash or lodash@4.17.21)')
    .action(async (pkg: string | undefined, _opts: unknown, cmd: Command) => {
      if (!pkg) {
        cmd.help();
        return;
      }
      console.error('not implemented: check', pkg);
      process.exit(1);
    });

  program
    .command('install <package>')
    .description('Check a package (alias matching npm muscle memory)')
    .action(async (pkg: string) => {
      console.error('not implemented: install', pkg);
      process.exit(1);
    });
}
