import { httpGet } from '../lib/http.js';
import type { CollectorResult, GithubData } from './types.js';

interface GithubRepo {
  stargazers_count: number;
  open_issues_count: number;
  pushed_at: string;
  archived: boolean;
  default_branch: string;
}

interface GithubIssue {
  title: string;
}

interface GithubReadme {
  content: string; // base64
}

function parseOwnerRepo(repoUrl: string): { owner: string; repo: string } | null {
  const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.\s]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

export async function collectGithub(
  repoUrl: string | null,
): Promise<CollectorResult<GithubData>> {
  const start = Date.now();

  if (!repoUrl) {
    return {
      source: 'github',
      ok: false,
      error: 'No repository URL',
      durationMs: 0,
    };
  }

  const parsed = parseOwnerRepo(repoUrl);
  if (!parsed) {
    return {
      source: 'github',
      ok: false,
      error: `Not a GitHub URL: ${repoUrl}`,
      durationMs: 0,
    };
  }

  const { owner, repo } = parsed;
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const headers: Record<string, string> = {};
  if (process.env['GITHUB_TOKEN']) {
    headers['Authorization'] = `Bearer ${process.env['GITHUB_TOKEN']}`;
  }

  try {
    const [repoData, issues, readme] = await Promise.allSettled([
      httpGet<GithubRepo>(baseUrl, { headers }),
      httpGet<GithubIssue[]>(`${baseUrl}/issues?state=open&per_page=5&sort=created`, { headers }),
      httpGet<GithubReadme>(`${baseUrl}/readme`, { headers }),
    ]);

    if (repoData.status === 'rejected') {
      throw new Error(String(repoData.reason));
    }

    const r = repoData.value;
    let readmeSnippet: string | null = null;

    if (readme.status === 'fulfilled') {
      try {
        const decoded = Buffer.from(readme.value.content, 'base64').toString('utf8');
        readmeSnippet = decoded.slice(0, 500);
      } catch {}
    }

    return {
      source: 'github',
      ok: true,
      durationMs: Date.now() - start,
      data: {
        stars: r.stargazers_count,
        openIssues: r.open_issues_count,
        lastCommitDate: r.pushed_at,
        archived: r.archived,
        defaultBranch: r.default_branch,
        recentIssueTitles:
          issues.status === 'fulfilled' ? issues.value.map((i) => i.title) : [],
        readmeSnippet,
      },
    };
  } catch (err) {
    return {
      source: 'github',
      ok: false,
      error: String(err),
      durationMs: Date.now() - start,
    };
  }
}
