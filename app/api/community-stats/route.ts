import { NextResponse } from 'next/server';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const [githubRes, discordRes] = await Promise.allSettled([
      fetch('https://api.github.com/repos/lingdojo/kana-dojo', {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
        next: { revalidate: 3600 },
      }),
      fetch('https://discord.com/api/invites/CyvBNNrSmb?with_counts=true', {
        next: { revalidate: 3600 },
      }),
    ]);

    let githubStars = null;
    let discordOnline = null;

    if (githubRes.status === 'fulfilled' && githubRes.value.ok) {
      const data = await githubRes.value.json();
      githubStars = data.stargazers_count;
    }

    if (discordRes.status === 'fulfilled' && discordRes.value.ok) {
      const data = await discordRes.value.json();
      discordOnline = data.approximate_presence_count;
    }

    return NextResponse.json(
      { githubStars, discordOnline },
      {
        headers: {
          'Cache-Control':
            'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      },
    );
  } catch (error) {
    console.error('Failed to fetch community stats:', error);
    return NextResponse.json(
      { githubStars: null, discordOnline: null },
      { status: 500 },
    );
  }
}
