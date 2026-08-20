import * as https from 'node:https';
import { CreatedRepository, GitAuthor, GitHubUser, ProjectSpec, RemoteCommitResult, ScaffoldFile } from './types';

interface GitHubErrorBody {
  message?: string;
  documentation_url?: string;
}

export class GitHubClient {
  public constructor(private readonly token: string) {}

  public async getCurrentUser(): Promise<GitHubUser> {
    return this.request<GitHubUser>('GET', '/user');
  }

  public async assertRepositoryAvailable(owner: string, repo: string): Promise<void> {
    const response = await this.requestRaw('GET', `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, undefined, true);
    if (response.statusCode === 404) {
      return;
    }
    if (response.statusCode >= 200 && response.statusCode < 300) {
      throw new Error(`Repository already exists: ${owner}/${repo}`);
    }
    throw new Error(`Could not verify repository availability: ${formatGitHubError(response.body)}`);
  }

  public async createRepository(spec: ProjectSpec): Promise<CreatedRepository> {
    const response = await this.request<{
      html_url: string;
      clone_url: string;
      full_name: string;
    }>('POST', '/user/repos', {
      name: spec.name,
      description: spec.description,
      private: spec.isPrivate,
      auto_init: false
    });

    return {
      htmlUrl: response.html_url,
      cloneUrl: response.clone_url,
      fullName: response.full_name
    };
  }

  public async createInitialCommit(
    owner: string,
    repo: string,
    files: ScaffoldFile[],
    author: GitAuthor,
    message: string
  ): Promise<RemoteCommitResult> {
    const tree = [];
    for (const file of files) {
      const blob = await this.request<{ sha: string }>(
        'POST',
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/blobs`,
        {
          content: file.content,
          encoding: 'utf-8'
        }
      );
      tree.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      });
    }

    const createdTree = await this.request<{ sha: string }>(
      'POST',
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees`,
      { tree }
    );

    const commit = await this.request<{ sha: string }>(
      'POST',
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/commits`,
      {
        message,
        tree: createdTree.sha,
        parents: [],
        author,
        committer: author
      }
    );

    await this.request(
      'POST',
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/refs`,
      {
        ref: 'refs/heads/main',
        sha: commit.sha
      }
    );

    await this.request(
      'PATCH',
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      {
        default_branch: 'main'
      }
    );

    return {
      treeSha: createdTree.sha,
      commitSha: commit.sha
    };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await this.requestRaw(method, path, body, false);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(formatGitHubError(response.body));
    }
    return JSON.parse(response.body || '{}') as T;
  }

  private requestRaw(method: string, path: string, body?: unknown, allowAnyStatus = false): Promise<{ statusCode: number; body: string }> {
    const payload = body === undefined ? undefined : JSON.stringify(body);

    return new Promise((resolve, reject) => {
      const request = https.request(
        {
          hostname: 'api.github.com',
          path,
          method,
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'Content-Length': payload ? Buffer.byteLength(payload) : 0,
            'User-Agent': 'reponator-vscode-extension',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        },
        response => {
          const chunks: Buffer[] = [];
          response.on('data', chunk => chunks.push(Buffer.from(chunk)));
          response.on('end', () => {
            const responseBody = Buffer.concat(chunks).toString('utf8');
            const statusCode = response.statusCode ?? 0;
            if (!allowAnyStatus && (statusCode < 200 || statusCode >= 300)) {
              reject(new Error(formatGitHubError(responseBody)));
              return;
            }
            resolve({ statusCode, body: responseBody });
          });
        }
      );

      request.on('error', reject);
      if (payload) {
        request.write(payload);
      }
      request.end();
    });
  }
}

function formatGitHubError(body: string): string {
  try {
    const parsed = JSON.parse(body) as GitHubErrorBody;
    const doc = parsed.documentation_url ? ` (${parsed.documentation_url})` : '';
    return `${parsed.message ?? body}${doc}`;
  } catch {
    return body || 'GitHub request failed.';
  }
}
