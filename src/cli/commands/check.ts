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

async function check(pkg: string, opts: GlobalOpts) {
  const timeoutMs = parseInt(opts.timeout ?? '60', 10) * 1000;
  console.log(pc.dim(`Analyzing ${pkg}...`));

  try {
    const result = await runVerdict(pkg, {
      with: opts.with,
      timeoutMs,
      verbose: opts.verbose,
    });

    if (opts.json) {
      renderJson(result);
    } else {
      renderVerdict(result);
    }
  } catch (err) {
    if (err instanceof ShouldIError) {
      console.error(pc.red(`Error: ${err.message}`));
      process.exit(err.exitCode);
    }
    throw err;
  }
}

export function registerCheckCommand(program: Command) {
  program
    .argument('[package]', 'Package name (e.g. lodash or lodash@4.17.21)')
    .action(async (pkg: string | undefined, _opts: unknown, cmd: Command) => {
      if (!pkg) {
        cmd.help();
        return;
      }
      const globals = cmd.optsWithGlobals() as GlobalOpts;
      await check(pkg, globals);
    });

  program
    .command('install <package>')
    .description('Check a package (alias matching npm muscle memory)')
    .action(async (pkg: string, _opts: unknown, cmd: Command) => {
      const globals = cmd.optsWithGlobals() as GlobalOpts;
      await check(pkg, globals);
    });
}
