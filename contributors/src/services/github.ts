export interface GitHubContributor {
  login: string;
  id: number;
  avatar_url: string;
  contributions: number;
}

export async function fetchContributors(
  owner: string,
  repo: string
): Promise<GitHubContributor[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contributors`
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
}
