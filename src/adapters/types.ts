export interface AIAdapter {
  id: string;
  displayName: string;
  note?: string;
  detect(): Promise<boolean>;
  invoke(prompt: string, opts: { signal?: AbortSignal }): Promise<string>;
}
