import { Command } from 'commander';
import { setVerbose } from '../lib/logger.js';
import { ShouldIError } from '../lib/errors.js';
import { registerCheckCommand } from './commands/check.js';
import { registerAuditCommand } from './commands/audit.js';
import { registerWhyCommand } from './commands/why.js';
import { registerConfigCommand } from './commands/config.js';
import { registerAdaptersCommand } from './commands/adapters.js';
import pc from 'picocolors';

const VERSION = '0.1.0';

const program = new Command();

program
  .name('shouldi')
  .description('AI-powered verdict on whether to install an npm package')
  .version(VERSION, '-V, --version')
  .option('--with <adapter>', 'Override AI adapter for this run')
  .option('--json', 'Output verdict as JSON')
  .option('--no-color', 'Disable colored output')
  .option('--timeout <seconds>', 'Adapter timeout in seconds', '60')
  .option('-v, --verbose', 'Show what is happening under the hood')
  .hook('preAction', (_thisCommand, actionCommand) => {
    const opts = actionCommand.optsWithGlobals() as { verbose?: boolean; color?: boolean };
    if (opts.verbose) setVerbose(true);
    // picocolors respects NO_COLOR env var automatically
    if (opts.color === false) process.env['NO_COLOR'] = '1';
  });

registerCheckCommand(program);
registerAuditCommand(program);
registerWhyCommand(program);
registerConfigCommand(program);
registerAdaptersCommand(program);

// Top-level unhandled error — show clean message, never a stack trace to users
process.on('uncaughtException', (err) => {
  if (err instanceof ShouldIError) {
    console.error(pc.red(`Error: ${err.message}`));
    process.exit(err.exitCode);
  }
  if (process.env['DEBUG']?.includes('shouldi') || process.env['VERBOSE']) {
    console.error(err);
  } else {
    console.error(pc.red(`Unexpected error: ${err.message}`));
    console.error(pc.dim('Re-run with --verbose for details.'));
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  if (reason instanceof ShouldIError) {
    console.error(pc.red(`Error: ${reason.message}`));
    process.exit(reason.exitCode);
  }
  if (process.env['DEBUG']?.includes('shouldi') || process.env['VERBOSE']) {
    console.error(reason);
  } else {
    const msg = reason instanceof Error ? reason.message : String(reason);
    console.error(pc.red(`Unexpected error: ${msg}`));
    console.error(pc.dim('Re-run with --verbose for details.'));
  }
  process.exit(1);
});

program.parse(process.argv);
