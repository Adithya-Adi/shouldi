import type { Command } from 'commander';
import { detectShell, getProfileFile } from '../../hook/detect-shell.js';
import { getHookContent } from '../../hook/templates.js';
import { installHook, removeHook, isHookInstalled } from '../../hook/install.js';
import pc from 'picocolors';

export function registerHookCommand(program: Command) {
  const hook = program
    .command('hook')
    .description('Manage the npm install middleware hook');

  hook
    .command('enable')
    .description('Intercept npm install to run shouldi checks first')
    .option('--shell <shell>', 'Shell to configure: bash, zsh, fish, powershell')
    .action(async (opts: { shell?: string }) => {
      const shell = detectShell(opts.shell);
      const profilePath = getProfileFile(shell);
      const hookContent = getHookContent(shell);

      if (isHookInstalled(profilePath)) {
        console.log(pc.yellow('Hook already installed in') + ' ' + pc.dim(profilePath));
        console.log(pc.dim('Run `shouldi hook disable` then `shouldi hook enable` to reinstall.'));
        return;
      }

      installHook(profilePath, hookContent);
      console.log('\n' + pc.green('✓ Hook installed') + ' in ' + pc.dim(profilePath));
      console.log(pc.dim(`\nReload your shell to activate:`));
      console.log(pc.cyan(`  source ${profilePath}`));
      console.log(pc.dim('\nAfter that, `npm install <pkg>` will run shouldi checks first.\n'));
    });

  hook
    .command('disable')
    .description('Remove the shouldi npm install hook')
    .option('--shell <shell>', 'Shell to configure: bash, zsh, fish, powershell')
    .action(async (opts: { shell?: string }) => {
      const shell = detectShell(opts.shell);
      const profilePath = getProfileFile(shell);

      if (!isHookInstalled(profilePath)) {
        console.log(pc.dim(`Hook not found in ${profilePath}`));
        return;
      }

      removeHook(profilePath);
      console.log(pc.green('✓ Hook removed from') + ' ' + pc.dim(profilePath));
    });

  hook
    .command('status')
    .description('Show whether the npm install hook is active')
    .option('--shell <shell>', 'Shell to check: bash, zsh, fish, powershell')
    .action(async (opts: { shell?: string }) => {
      const shell = detectShell(opts.shell);
      const profilePath = getProfileFile(shell);
      const active = isHookInstalled(profilePath);

      if (active) {
        console.log(pc.green(`✓ Hook active`) + pc.dim(` — ${shell} — ${profilePath}`));
      } else {
        console.log(pc.dim(`✗ Hook not installed (${shell})`));
        console.log(pc.dim('Run `shouldi hook enable` to set up.'));
      }
    });
}
