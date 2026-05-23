import type { Command } from 'commander';

export function registerWhyCommand(program: Command) {
  program
    .command('why <package>')
    .description('Verbose verdict with full reasoning and signals dump')
    .action(async (pkg: string) => {
      console.error('not implemented: why', pkg);
      process.exit(1);
    });
}
