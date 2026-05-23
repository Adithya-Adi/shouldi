export interface Signals {
  package: {
    name: string;
    version: string;
    license: string | null;
    description: string | null;
    repository: string | null;
  };
  activity: {
    lastPublishDate: string;
    daysSinceLastPublish: number;
    lastCommitDate: string | null;
    daysSinceLastCommit: number | null;
    archived: boolean;
    releaseCadence: 'active' | 'slow' | 'dormant' | 'unknown';
  };
  popularity: {
    weeklyDownloads: number;
    githubStars: number | null;
    dependentsCount: number | null;
  };
  health: {
    openIssues: number | null;
    openIssuesAgeMedianDays: number | null;
    knownVulnerabilities: Array<{
      id: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      summary: string;
    }>;
    maintainerCount: number;
  };
  size: {
    minified: number | null;
    minifiedGzipped: number | null;
    hasTreeshaking: boolean | null;
    dependencyCount: number;
  };
  qualitative: {
    readmeSnippet: string | null;
    recentIssueTitles: string[];
    deprecatedFlag: boolean;
    scorecardScore: number | null;
  };
  meta: {
    collectorsFailed: string[];
    collectedAt: string;
  };
}
