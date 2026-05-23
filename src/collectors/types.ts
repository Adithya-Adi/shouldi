export interface CollectorResult<T> {
  source: string;
  ok: boolean;
  data?: T;
  error?: string;
  durationMs: number;
}

export interface NpmData {
  name: string;
  description: string | null;
  license: string | null;
  repository: string | null;
  latestVersion: string;
  lastPublishDate: string;
  maintainers: string[];
  dependencies: Record<string, string>;
  deprecated: string | false;
}

export interface NpmDownloadsData {
  weeklyDownloads: number;
  monthlyDownloads: number;
}

export interface GithubData {
  stars: number;
  openIssues: number;
  lastCommitDate: string | null;
  archived: boolean;
  defaultBranch: string;
  recentIssueTitles: string[];
  readmeSnippet: string | null;
}

export interface BundlephobiaData {
  minified: number;
  minifiedGzipped: number;
  dependencyCount: number;
  hasTreeshaking: boolean;
}

export interface OsvVuln {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  summary: string;
}

export interface OsvData {
  vulnerabilities: OsvVuln[];
}

export interface DepsDevData {
  scorecardScore: number | null;
}
