import * as p from '@clack/prompts';
import pc from 'picocolors';
import { detectAdapters, ALL_ADAPTERS } from '../adapters/registry.js';
import { saveConfig } from './save.js';
import { loadConfig } from './load.js';

export async function runFirstRun(): Promise<string> {
  p.intro(pc.bold('shouldi: First time? Let\'s pick which AI to use.'));

  console.log('\nDetecting installed AI CLIs...\n');
  const detected = await detectAdapters();
  const detectedIds = new Set(detected.map((a) => a.id));

  for (const adapter of ALL_ADAPTERS) {
    const found = detectedIds.has(adapter.id);
    const mark = found ? pc.green('  ✓') : pc.dim('  ✗');
    const name = adapter.id.padEnd(10);
    const label = found ? adapter.displayName : pc.dim(adapter.displayName + ' (not installed)');
    console.log(`${mark} ${name} ${label}`);
  }
  console.log('');

  if (detected.length === 0) {
    p.outro(
      pc.red('No AI CLIs detected. Install one of: claude, ollama, gemini') +
        '\n  claude: https://claude.ai/code' +
        '\n  ollama: https://ollama.ai' +
        '\n  gemini: https://ai.google.dev/gemini-api/docs/gemini-cli',
    );
    process.exit(3);
  }

  let chosenId: string;

  if (detected.length === 1) {
    const adapter = detected[0]!;
    const confirmed = await p.confirm({
      message: `Use ${pc.bold(adapter.displayName)}?`,
      initialValue: true,
    });
    if (p.isCancel(confirmed) || !confirmed) {
      p.cancel('Cancelled.');
      process.exit(0);
    }
    chosenId = adapter.id;
  } else {
    const choice = await p.select({
      message: 'Which AI would you like to use?',
      options: detected.map((a) => ({
        value: a.id,
        label: `${a.id.padEnd(10)} ${a.displayName}`,
        hint: a.note,
      })),
    });
    if (p.isCancel(choice)) {
      p.cancel('Cancelled.');
      process.exit(0);
    }
    chosenId = choice as string;
  }

  const config = loadConfig();
  config.ai = chosenId;
  saveConfig(config);

  p.outro(
    `Saved to ${pc.dim('~/.shouldirc')}. Change anytime with ${pc.cyan('shouldi config set ai <name>')}`,
  );

  return chosenId;
}
