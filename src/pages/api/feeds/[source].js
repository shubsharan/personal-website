import sources from '../../../../content-sources.json' with { type: 'json' };

export const prerender = false;

export async function GET({ params }) {
  const source = sources.find((source) => source.id === params.source);
  if (!source) return new Response('Unknown feed', { status: 404 });

  const upstream = await fetch(source.feedURL, {
    signal: AbortSignal.timeout(30_000),
    headers: {
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      'User-Agent': 'shub.gg-content-sync/1.0 (+https://shub.gg)',
    },
  });
  if (!upstream.ok || !upstream.headers.get('content-type')?.includes('xml')) {
    console.error(`Feed ${source.id} returned ${upstream.status} ${upstream.headers.get('content-type')}`);
    return new Response('Feed unavailable', { status: 502 });
  }
  return new Response(await upstream.text(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
