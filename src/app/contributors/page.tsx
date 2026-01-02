import Image from "next/image";
import styles from "./contributors.module.css";

interface Contributor {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

interface ContributorStats {
  author: {
    login: string;
    id: number;
    avatar_url: string;
  };
  total: number; // total commits
  weeks: Array<{
    w: number; // timestamp
    a: number; // additions
    d: number; // deletions
    c: number; // commits
  }>;
}

interface EnrichedContributor extends Contributor {
  additions: number;
  deletions: number;
  totalCommits: number;
}

async function getContributors(): Promise<Contributor[]> {
  const res = await fetch(
    "https://api.github.com/repos/anisayari/voyonsvoir/contributors",
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 3600 },
    }
  );

  if (!res.ok) {
    return [];
  }

  return res.json();
}

async function getContributorStats(): Promise<ContributorStats[]> {
  const res = await fetch(
    "https://api.github.com/repos/anisayari/voyonsvoir/stats/contributors",
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 3600 },
    }
  );

  // L'API peut retourner 202 si les stats sont en cours de calcul
  if (!res.ok || res.status === 202) {
    return [];
  }

  const data = await res.json();
  
  // Vérifie que c'est bien un tableau
  if (!Array.isArray(data)) {
    return [];
  }

  return data;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export default async function ContributorsPage() {
  const [contributors, stats] = await Promise.all([
    getContributors(),
    getContributorStats(),
  ]);

  // Merge stats with contributors
  const enrichedContributors: EnrichedContributor[] = contributors.map((contributor) => {
    const contributorStats = stats.find((s) => s.author?.id === contributor.id);
    
    let additions = 0;
    let deletions = 0;
    let totalCommits = 0;

    if (contributorStats?.weeks) {
      contributorStats.weeks.forEach((week) => {
        additions += week.a;
        deletions += week.d;
        totalCommits += week.c;
      });
    }

    return {
      ...contributor,
      additions,
      deletions,
      totalCommits,
    };
  });

  // Calculate totals
  const totalStats = enrichedContributors.reduce(
    (acc, c) => ({
      additions: acc.additions + c.additions,
      deletions: acc.deletions + c.deletions,
      commits: acc.commits + c.totalCommits,
      contributors: acc.contributors + 1,
    }),
    { additions: 0, deletions: 0, commits: 0, contributors: 0 }
  );

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>🎉 Les Contributeurs Fous 🎉</h1>
        <p className={styles.subtitle}>
          Ce repo où tout est permis... Merci à tous ceux qui ont osé contribuer !
        </p>

        {/* Global Stats */}
        <div className={styles.globalStats}>
          <div className={styles.statBox}>
            <span className={styles.statIcon}>👥</span>
            <span className={styles.statValue}>{totalStats.contributors}</span>
            <span className={styles.statLabel}>Contributeurs</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statIcon}>📝</span>
            <span className={styles.statValue}>{formatNumber(totalStats.commits)}</span>
            <span className={styles.statLabel}>Commits</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statIcon}>➕</span>
            <span className={`${styles.statValue} ${styles.additions}`}>{formatNumber(totalStats.additions)}</span>
            <span className={styles.statLabel}>Lignes ajoutées</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statIcon}>➖</span>
            <span className={`${styles.statValue} ${styles.deletionsText}`}>{formatNumber(totalStats.deletions)}</span>
            <span className={styles.statLabel}>Lignes supprimées</span>
          </div>
        </div>

        <div className={styles.grid}>
          {enrichedContributors.map((contributor, index) => (
            <a
              key={contributor.id}
              href={contributor.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.card}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={styles.avatarContainer}>
                <Image
                  src={contributor.avatar_url}
                  alt={`Avatar de ${contributor.login}`}
                  width={100}
                  height={100}
                  className={styles.avatar}
                />
                {index === 0 && <span className={styles.crown}>👑</span>}
              </div>
              <h2 className={styles.username}>{contributor.login}</h2>
              
              {/* Stats individuelles */}
              <div className={styles.statsGrid}>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>{contributor.totalCommits}</span>
                  <span className={styles.statName}>commits</span>
                </div>
                <div className={styles.stat}>
                  <span className={`${styles.statNumber} ${styles.additions}`}>+{formatNumber(contributor.additions)}</span>
                  <span className={styles.statName}>ajouts</span>
                </div>
                <div className={styles.stat}>
                  <span className={`${styles.statNumber} ${styles.deletionsText}`}>-{formatNumber(contributor.deletions)}</span>
                  <span className={styles.statName}>suppr.</span>
                </div>
              </div>

              {/* Barre de ratio additions/deletions */}
              {(contributor.additions > 0 || contributor.deletions > 0) && (
                <div className={styles.ratioBar}>
                  <div
                    className={styles.additionsBar}
                    style={{
                      width: `${(contributor.additions / (contributor.additions + contributor.deletions)) * 100}%`,
                    }}
                  />
                  <div
                    className={styles.deletionsBar}
                    style={{
                      width: `${(contributor.deletions / (contributor.additions + contributor.deletions)) * 100}%`,
                    }}
                  />
                </div>
              )}

              <div className={styles.badge}>
                {index === 0
                  ? "🏆 Top Contributeur"
                  : index < 3
                  ? "⭐ Star"
                  : "🚀 Contributeur"}
              </div>
            </a>
          ))}
        </div>

        {contributors.length === 0 && (
          <p className={styles.noContributors}>
            Aucun contributeur trouvé... Sois le premier ! 🚀
          </p>
        )}

        <a href="/" className={styles.backLink}>
          ← Retour à l&apos;accueil
        </a>
      </main>
    </div>
  );
}
