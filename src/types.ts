export interface ProjectSpec {
  parentPath: string;
  name: string;
  description: string;
  isPrivate: boolean;
}

export interface GitHubUser {
  login: string;
  name?: string | null;
  email?: string | null;
}

export interface GitAuthor {
  name: string;
  email: string;
  date: string;
}

export interface ScaffoldFile {
  path: string;
  content: string;
}

export interface CreatedRepository {
  htmlUrl: string;
  cloneUrl: string;
  fullName: string;
}

export interface RemoteCommitResult {
  treeSha: string;
  commitSha: string;
}
