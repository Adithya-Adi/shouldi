import pc from 'picocolors';
import type { VerdictResult } from '../verdict/run.js';

const DECISION_CONFIG = {
  yes: { icon: '✓', color: pc.green, word: 'install' },
  caution: { icon: '⚠', color: pc.yellow, word: 'be cautious with' },
  no: { icon: '✗', color: pc.red, word: 'NOT install' },
} as const;

export function renderVerdict(result: VerdictResult, showSignals = false): void {
  const { verdict, signals, adapterId } = result;
  const cfg = DECISION_CONFIG[verdict.decision];

  const adapterTag = pc.dim(`[verdict by ${adapterId}]`);
  const header = cfg.color(`${cfg.icon}  shouldi ${cfg.word} ${signals.package.name}`);
  console.log(`\n${header}  ${adapterTag}\n`);

  console.log(cfg.color(`  ${verdict.headline}\n`));

  for (const reason of verdict.reasons) {
    console.log(`  • ${reason}`);
  }

  if (verdict.alternatives.length > 0) {
    console.log(`\n  ${pc.dim('Consider instead:')}`);
    for (const alt of verdict.alternatives) {
      console.log(`    ${pc.cyan('✓')} ${pc.bold(alt.name.padEnd(14))} ${alt.why}`);
    }
  }

  if (verdict.confidence === 'low') {
    console.log(`\n  ${pc.yellow('Confidence: low')} — signals were incomplete or conflicting`);
  }

  console.log(`\n  ${pc.dim(`Run \`shouldi why ${signals.package.name}\` for full reasoning.`)}`);

  if (showSignals) {
    console.log('\n' + pc.dim('─'.repeat(50)));
    console.log(pc.dim('Signals:'));
    console.log(pc.dim(JSON.stringify(signals, null, 2)));
  }

  console.log('');
}
