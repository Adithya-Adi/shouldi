import type { Command } from 'commander';
import { detectAdapters, ALL_ADAPTERS } from '../../adapters/registry.js';
import pc from 'picocolors';

export function registerAdaptersCommand(program: Command) {
  program
    .command('adapters')
    .description('List detected and supported AI CLIs')
    .action(async () => {
      console.log('Detecting installed AI CLIs...\n');

      const detected = new Set((await detectAdapters()).map((a) => a.id));

      for (const adapter of ALL_ADAPTERS) {
        const found = detected.has(adapter.id);
        const mark = found ? pc.green('✓') : pc.dim('✗');
        const name = found ? pc.bold(adapter.id.padEnd(10)) : pc.dim(adapter.id.padEnd(10));
        const label = found ? adapter.displayName : pc.dim(adapter.displayName + ' (not installed)');
        console.log(`  ${mark} ${name} ${label}`);
      }

      console.log('');
    });
}
