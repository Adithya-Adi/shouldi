import { Command } from 'commander';
import { setVerbose } from '../lib/logger.js';
import { registerCheckCommand } from './commands/check.js';
import { registerAuditCommand } from './commands/audit.js';
import { registerWhyCommand } from './commands/why.js';
import { registerConfigCommand } from './commands/config.js';
import { registerAdaptersCommand } from './commands/adapters.js';

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
    const opts = actionCommand.optsWithGlobals() as { verbose?: boolean };
    if (opts.verbose) setVerbose(true);
  });

registerCheckCommand(program);
registerAuditCommand(program);
registerWhyCommand(program);
registerConfigCommand(program);
registerAdaptersCommand(program);

program.parse(process.argv);
