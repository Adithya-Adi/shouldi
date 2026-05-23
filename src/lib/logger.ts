let verbose = false;
let debugEnabled = false;

export function setVerbose(v: boolean) {
  verbose = v;
}

export function setDebug(d: boolean) {
  debugEnabled = d;
}

export function isVerbose() {
  return verbose || debugEnabled || process.env['DEBUG']?.includes('shouldi') === true;
}

export function log(...args: unknown[]) {
  if (isVerbose()) {
    console.error('[shouldi]', ...args);
  }
}

export function warn(...args: unknown[]) {
  console.error('[shouldi warn]', ...args);
}
