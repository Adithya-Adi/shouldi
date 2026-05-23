import type { Command } from 'commander';
import { runVerdict } from '../../verdict/run.js';
import { renderVerdict } from '../../render/verdict.js';
import { renderJson } from '../../render/json.js';
import { ShouldIError } from '../../lib/errors.js';
import pc from 'picocolors';

interface GlobalOpts {
  with?: string;
  json?: boolean;
  timeout?: string;
  verbose?: boolean;
}

export function registerWhyCommand(program: Command) {
  program
    .command('why <package>')
    .description('Verbose verdict with full reasoning and signals dump')
    .action(async (pkg: string, _opts: unknown, cmd: Command) => {
      const globals = cmd.optsWithGlobals() as GlobalOpts;
      const timeoutMs = parseInt(globals.timeout ?? '60', 10) * 1000;
      console.log(pc.dim(`Analyzing ${pkg}...`));

      try {
        const result = await runVerdict(pkg, {
          with: globals.with,
          timeoutMs,
          verbose: globals.verbose,
        });

        if (globals.json) {
          renderJson(result, true);
        } else {
          renderVerdict(result, true);
        }
      } catch (err) {
        if (err instanceof ShouldIError) {
          console.error(pc.red(`Error: ${err.message}`));
          process.exit(err.exitCode);
        }
        throw err;
      }
    });
}
