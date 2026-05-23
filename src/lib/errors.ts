export class ShouldIError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number = 1,
  ) {
    super(message);
    this.name = 'ShouldIError';
  }
}

export class PackageNotFoundError extends ShouldIError {
  constructor(pkg: string) {
    super(`Package "${pkg}" not found on npm`, 2);
  }
}

export class NoAdapterError extends ShouldIError {
  constructor() {
    super('No AI CLI configured. Run: shouldi config set ai <name>', 3);
  }
}

export class AdapterNotOnPathError extends ShouldIError {
  constructor(id: string) {
    super(`${id} is configured but not found on PATH`, 4);
  }
}

export class AdapterInvocationError extends ShouldIError {
  constructor(id: string, detail: string) {
    super(`${id} exited with error: ${detail}`, 5);
  }
}

export class AdapterTimeoutError extends ShouldIError {
  constructor(id: string, seconds: number) {
    super(`${id} did not respond within ${seconds}s. Try --timeout ${seconds * 2}`, 6);
  }
}

export class VerdictParseError extends ShouldIError {
  constructor(id: string) {
    super(`${id} returned output we couldn't parse. Re-run with --verbose to see it.`, 7);
  }
}

export class NetworkError extends ShouldIError {
  constructor(detail: string) {
    super(`Network error: ${detail}`, 8);
  }
}
