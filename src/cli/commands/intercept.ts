import type { Command } from 'commander';
import { runVerdict, type VerdictResult } from '../../verdict/run.js';
import { renderVerdict } from '../../render/verdict.js';
import * as p from '@clack/prompts';
import { spawnSync } from 'node:child_process';
import pc from 'picocolors';

// Exit codes consumed by the shell hook:
//   0 → shell should run original `npm install`
//   1 → user cancelled — shell should abort
//   2 → shouldi already ran npm (alternative chosen) — shell must NOT re-run

interface GlobalOpts {
  with?: string;
  timeout?: string;
  verbose?: boolean;
}

export function registerInterceptCommand(program: Command) {
  program
    .command('intercept')
    .argument('[args...]', 'npm install args passed from shell hook (packages + flags)')
    .description('Internal: check packages before npm install (called by shell hook)')
    .action(async (args: string[], _opts: unknown, cmd: Command) => {
      const globals = cmd.optsWithGlobals() as GlobalOpts;
      await runIntercept(args, globals);
    });
}

async function runIntercept(args: string[], opts: GlobalOpts) {
  // Strip '--' separator that shells pass
  const cleanArgs = args.filter((a) => a !== '--');
  const pkgs = cleanArgs.filter((a) => !a.startsWith('-'));
  const flags = cleanArgs.filter((a) => a.startsWith('-'));

  if (pkgs.length === 0) {
    // `npm install` with no packages restores from lock — pass through
    process.exit(0);
  }

  const timeoutMs = parseInt(opts.timeout ?? '60', 10) * 1000;
  const isInteractive = Boolean(process.stdout.isTTY && process.stdin.isTTY);

  console.log(pc.dim(`\nshouldI: checking ${pkgs.join(', ')}...\n`));

  const settled = await Promise.allSettled(
    pkgs.map((pkg) => runVerdict(pkg, { with: opts.with, timeoutMs, verbose: opts.verbose })),
  );

  type PkgResult = { pkg: string; result: VerdictResult | null; error?: string };
  const verdicts: PkgResult[] = settled.map((r, i) => ({
    pkg: pkgs[i]!,
    result: r.status === 'fulfilled' ? r.value : null,
    error: r.status === 'rejected' ? String((r as PromiseRejectedResult).reason) : undefined,
  }));

  // Warn about collector errors but don't block
  for (const v of verdicts.filter((v) => !v.result)) {
    console.log(pc.yellow(`  ⚠ Could not check ${v.pkg}: ${v.error}`));
  }

  const flagged = verdicts.filter(
    (v) => v.result && (v.result.verdict.decision === 'caution' || v.result.verdict.decision === 'no'),
  );
  const safe = verdicts.filter((v) => v.result?.verdict.decision === 'yes');

  if (flagged.length === 0) {
    if (safe.length > 0) {
      const names = safe.map((v) => v.pkg).join(', ');
      console.log(pc.green(`✓ ${names} ${safe.length === 1 ? 'looks' : 'look'} good\n`));
    }
    process.exit(0);
  }

  // Render verdict for each flagged package
  for (const { result } of flagged) {
    if (result) renderVerdict(result);
  }

  // CI / non-interactive: warn but never block
  if (!isInteractive) {
    console.log(pc.yellow('shouldi: non-interactive mode — proceeding despite warnings'));
    process.exit(0);
  }

  // Single-package path: offer alternatives
  if (pkgs.length === 1 && flagged.length === 1) {
    const { result } = flagged[0]!;
    if (!result) { process.exit(0); return; }

    const alternatives = result.verdict.alternatives;
    const options: Array<{ value: string; label: string; hint?: string }> = [
      { value: 'proceed', label: `Install ${pkgs[0]} anyway` },
      ...alternatives.map((alt) => ({
        value: `alt:${alt.name}`,
        label: `Install ${alt.name} instead`,
        hint: alt.why,
      })),
      { value: 'cancel', label: 'Cancel' },
    ];

    const choice = await p.select({ message: 'How to proceed?', options });

    if (p.isCancel(choice) || choice === 'cancel') {
      p.cancel('Installation cancelled.');
      process.exit(1);
    }

    if (typeof choice === 'string' && choice.startsWith('alt:')) {
      const altPkg = choice.slice(4);
      console.log(pc.dim(`\nRunning: npm install ${[altPkg, ...flags].join(' ')}\n`));
      // shell:true required on Windows so cmd.exe can invoke npm.cmd
      const r = spawnSync('npm', ['install', altPkg, ...flags], { stdio: 'inherit', shell: true });
      if (r.error) {
        console.error(pc.red(`Failed to run npm: ${r.error.message}`));
        process.exit(1);
      }
      // Exit 2 signals shell hook that we already ran npm
      process.exit(r.status === 0 ? 2 : 1);
    }

    // 'proceed' — let shell run original npm install
    process.exit(0);
  }

  // Multi-package path: simple proceed / cancel
  const flaggedNames = flagged.map((v) => v.pkg).join(', ');
  const suffix = flagged.length === 1 ? 'has issues' : 'have issues';
  const choice = await p.select({
    message: `${flaggedNames} ${suffix}. How to proceed?`,
    options: [
      { value: 'proceed', label: 'Install all anyway', hint: 'ignores warnings' },
      { value: 'cancel', label: 'Cancel' },
    ],
  });

  if (p.isCancel(choice) || choice === 'cancel') {
    p.cancel('Installation cancelled.');
    process.exit(1);
  }

  process.exit(0);
}
