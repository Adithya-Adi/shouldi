import type { Command } from 'commander';

export function registerAuditCommand(program: Command) {
  program
    .command('audit')
    .description('Scan all deps in current package.json')
    .action(async () => {
      console.error('not implemented: audit');
      process.exit(1);
    });
}
