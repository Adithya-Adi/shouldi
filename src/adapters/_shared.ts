import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { isVerbose } from '../lib/logger.js';
import { AdapterInvocationError, AdapterTimeoutError } from '../lib/errors.js';

// On Windows, npm CLIs are .cmd/.ps1 wrappers around node scripts.
// Resolve them to the actual node binary + js file so we can spawn directly.
function resolveCmd(cmd: string): [string, string[]] {
  if (process.platform !== 'win32') return [cmd, []];

  try {
    const paths = execFileSync('where.exe', [cmd], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 2000,
    })
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);

    for (const found of paths) {
      const ext = found.toLowerCase().slice(found.lastIndexOf('.'));
      if (ext === '.exe') return [found, []]; // native binary, use directly

      if (ext === '.cmd' || ext === '.ps1') {
        const basedir = dirname(found);
        const content = readFileSync(found, 'utf8');
        // Both .cmd and .ps1 npm wrappers reference the JS file as a path segment
        const match = content.match(/node_modules[/\\][^\s"'%]+\.js/);
        if (!match) continue;

        const jsPath = join(basedir, match[0].replace(/\//g, '\\'));
        if (!existsSync(jsPath)) continue;

        const nodeExe = existsSync(join(basedir, 'node.exe'))
          ? join(basedir, 'node.exe')
          : 'node';

        return [nodeExe, [jsPath]];
      }
    }
  } catch {
    // where.exe failed (command not on PATH) — fall through
  }

  return [cmd, []];
}

export async function runDetect(cmd: string, args: string[]): Promise<boolean> {
  const [resolved, extraArgs] = resolveCmd(cmd);
  return new Promise((resolve) => {
    const proc = spawn(resolved, [...extraArgs, ...args], { stdio: 'ignore', shell: false });
    const timer = setTimeout(() => {
      proc.kill();
      resolve(false);
    }, 3000);
    proc.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
  });
}

export interface CaptureOpts {
  signal?: AbortSignal;
  adapterId: string;
  /** Prompt text piped to stdin. If undefined, stdin is closed immediately. */
  stdin?: string;
}

export async function runCapture(
  cmd: string,
  args: string[],
  opts: CaptureOpts,
): Promise<string> {
  const [resolved, extraArgs] = resolveCmd(cmd);

  return new Promise((resolve, reject) => {
    const proc = spawn(resolved, [...extraArgs, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
      if (isVerbose()) {
        process.stderr.write(chunk);
      }
    });

    // Write prompt via stdin then close it
    if (opts.stdin !== undefined) {
      proc.stdin.write(opts.stdin, 'utf8');
    }
    proc.stdin.end();

    const onAbort = () => {
      proc.kill();
      reject(new AdapterTimeoutError(opts.adapterId, 60));
    };

    if (opts.signal) {
      if (opts.signal.aborted) {
        proc.kill();
        reject(new AdapterTimeoutError(opts.adapterId, 60));
        return;
      }
      opts.signal.addEventListener('abort', onAbort, { once: true });
    }

    proc.on('error', (err) => {
      opts.signal?.removeEventListener('abort', onAbort);
      reject(new AdapterInvocationError(opts.adapterId, err.message));
    });

    proc.on('close', (code) => {
      opts.signal?.removeEventListener('abort', onAbort);
      if (code !== 0) {
        reject(
          new AdapterInvocationError(opts.adapterId, stderr.trim() || `exit code ${code}`),
        );
        return;
      }
      resolve(stdout.trim());
    });
  });
}
