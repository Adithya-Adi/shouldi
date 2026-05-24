import type { SupportedShell } from './detect-shell.js';

export function getHookContent(shell: SupportedShell): string {
  switch (shell) {
    case 'bash':
    case 'zsh':
      return BASH_ZSH_HOOK;
    case 'fish':
      return FISH_HOOK;
    case 'powershell':
      return POWERSHELL_HOOK;
  }
}

// Shell function wraps `npm install` — passes pkg args to shouldi intercept.
// Exit code protocol: 0=proceed, 1=cancelled, 2=shouldi ran npm (alternative chosen).
const BASH_ZSH_HOOK = `npm() {
  local cmd="\${1-}"
  if [[ "$cmd" == "install" || "$cmd" == "i" ]]; then
    local has_pkgs=false
    for arg in "\${@:2}"; do
      if [[ "$arg" != -* ]]; then
        has_pkgs=true
        break
      fi
    done
    if $has_pkgs; then
      shouldi intercept -- "\${@:2}"
      local rc=$?
      if [[ $rc -eq 0 ]]; then
        command npm "$@"
      elif [[ $rc -eq 1 ]]; then
        return 1
      fi
      return
    fi
  fi
  command npm "$@"
}`;

const FISH_HOOK = `function npm
  if test (count $argv) -ge 2; and contains -- $argv[1] install i
    set rest $argv[2..]
    set has_pkgs false
    for arg in $rest
      if not string match -q -- '-*' $arg
        set has_pkgs true
        break
      end
    end
    if $has_pkgs
      shouldi intercept -- $rest
      set rc $status
      if test $rc -eq 0
        command npm $argv
      else if test $rc -eq 1
        return 1
      end
      return
    end
  end
  command npm $argv
end`;

const POWERSHELL_HOOK = `function npm {
  param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments)
  $installCmds = @('install', 'i')
  if ($Arguments.Count -ge 2 -and $installCmds -contains $Arguments[0]) {
    $restArgs = $Arguments[1..($Arguments.Count - 1)]
    $hasPkgs = $restArgs | Where-Object { $_ -notmatch '^-' } | Select-Object -First 1
    if ($hasPkgs) {
      & shouldi intercept -- @restArgs
      $rc = $LASTEXITCODE
      if ($rc -eq 0) {
        & npm.cmd @Arguments
      } elseif ($rc -eq 1) {
        return
      }
      # rc=2: shouldi already ran npm install with alternative
      return
    }
  }
  & npm.cmd @Arguments
}`;
