import type { Command } from 'commander';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
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
  dev?: boolean;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const CONCURRENCY = 3;

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<Array<{ ok: true; value: T } | { ok: false; error: unknown }>> {
  const results: Array<{ ok: true; value: T } | { ok: false; error: unknown }> = [];
  const queue = [...tasks];
  let running = 0;

  return new Promise((resolve) => {
    function next() {
      while (running < limit && queue.length > 0) {
        const task = queue.shift()!;
        running++;
        task()
          .then((value) => {
            results.push({ ok: true, value });
          })
          .catch((error: unknown) => {
            results.push({ ok: false, error });
          })
          .finally(() => {
            running--;
            if (queue.length === 0 && running === 0) {
              resolve(results);
            } else {
              next();
            }
          });
      }
    }
    next();
    if (queue.length === 0) resolve(results);
  });
}

export function registerAuditCommand(program: Command) {
  program
    .command('audit')
    .description('Scan all deps in current package.json')
    .option('--dev', 'Include devDependencies')
    .action(async (cmdOpts: { dev?: boolean }, cmd: Command) => {
      const globals = cmd.optsWithGlobals() as GlobalOpts;
      const pkgPath = join(process.cwd(), 'package.json');

      if (!existsSync(pkgPath)) {
        console.error(pc.red('No package.json found in current directory.'));
        process.exit(1);
      }

      let pkgJson: PackageJson;
      try {
        pkgJson = JSON.parse(readFileSync(pkgPath, 'utf8')) as PackageJson;
      } catch {
        console.error(pc.red('Failed to parse package.json.'));
        process.exit(1);
      }

      const deps = Object.keys(pkgJson.dependencies ?? {});
      const devDeps = cmdOpts.dev ? Object.keys(pkgJson.devDependencies ?? {}) : [];
      const allPkgs = [...new Set([...deps, ...devDeps])];

      if (allPkgs.length === 0) {
        console.log(pc.dim('No dependencies found.'));
        return;
      }

      console.log(
        pc.bold(`\nAuditing ${allPkgs.length} package${allPkgs.length !== 1 ? 's' : ''}`) +
          pc.dim(` (concurrency: ${CONCURRENCY})\n`),
      );

      const timeoutMs = parseInt(globals.timeout ?? '60', 10) * 1000;
      const counts = { yes: 0, caution: 0, no: 0, error: 0 };

      const tasks = allPkgs.map((pkg) => async () => {
        console.log(pc.dim(`  → ${pkg}`));
        try {
          const result = await runVerdict(pkg, {
            with: globals.with,
            timeoutMs,
            verbose: globals.verbose,
          });
          counts[result.verdict.decision]++;
          if (globals.json) {
            renderJson(result);
          } else {
            renderVerdict(result);
          }
        } catch (err) {
          counts.error++;
          if (err instanceof ShouldIError) {
            console.error(pc.red(`  ✗ ${pkg}: ${err.message}\n`));
          } else {
            console.error(pc.red(`  ✗ ${pkg}: unexpected error\n`));
          }
        }
      });

      await runWithConcurrency(tasks, CONCURRENCY);

      if (!globals.json) {
        console.log(pc.bold('─'.repeat(50)));
        console.log(
          `Audit complete: ` +
            pc.green(`${counts.yes} ok`) +
            ` · ` +
            pc.yellow(`${counts.caution} caution`) +
            ` · ` +
            pc.red(`${counts.no} avoid`) +
            (counts.error > 0 ? ` · ${pc.dim(`${counts.error} error`)}` : ''),
        );
      }

      if (counts.no > 0 || counts.error > 0) process.exit(1);
    });
}
