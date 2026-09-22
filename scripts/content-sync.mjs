import { createHash } from 'node:crypto';
import { appendFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import matter from 'gray-matter';
import Parser from 'rss-parser';
import sanitizeHtml from 'sanitize-html';
import TurndownService from 'turndown';

const hash = (value) => createHash('sha256').update(value).digest('hex');

function httpURL(value, base) {
  const url = new URL(value, base);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error(`Expected an HTTP(S) URL: ${value}`);
  }
  return url.href;
}

function canonical(value) {
  const url = new URL(httpURL(value));
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith('utm_')) url.searchParams.delete(key);
  }
  return url.href.replace(/\/$/, '');
}

function required(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing ${label}`);
  return value.trim();
}

function date(value) {
  const parsed = new Date(required(value, 'publication date'));
  if (!Number.isFinite(parsed.valueOf())) throw new Error(`Invalid date: ${value}`);
  return parsed.toISOString();
}

export function convertHtml(html, articleURL) {
  const retained = (value) => sanitizeHtml(value, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img'],
    allowedAttributes: {
      a: ['href', 'id'], img: ['src', 'alt', 'title', 'width', 'height'],
      '*': ['id'], th: ['colspan', 'rowspan'], td: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowedSchemesByTag: { img: ['https', 'http'] },
    allowProtocolRelative: false,
  });
  const clean = sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'picture', 'iframe', 'video', 'audio', 'source'],
    allowedAttributes: {
      '*': ['id', 'class', 'data-component-name', 'data-attrs'],
      a: ['href', 'title'], img: ['src', 'alt', 'title', 'width', 'height'],
      iframe: ['src'], video: ['src'], audio: ['src'], source: ['src'],
      th: ['colspan', 'rowspan'], td: ['colspan', 'rowspan'],
    },
    nonTextTags: ['script', 'style', 'textarea', 'option', 'form', 'button', 'svg'],
    allowedSchemes: ['https', 'http', 'mailto'],
    allowedSchemesByTag: { img: ['https', 'http'] },
    allowProtocolRelative: false,
    transformTags: {
      '*': (tagName, attribs) => {
        for (const attr of ['href', 'src']) {
          if (attribs[attr] && !attribs[attr].startsWith('#')) {
            attribs[attr] = new URL(attribs[attr], articleURL).href;
          }
        }
        return { tagName, attribs };
      },
    },
  });
  const isEmbed = (node) => ['IFRAME', 'VIDEO', 'AUDIO'].includes(node.nodeName)
    || ['twitter-embed', 'native-video-embed'].some((name) => node.classList.contains(name));
  const mediaLink = (node) => {
    const data = JSON.parse(node.getAttribute('data-attrs') || '{}');
    const url = httpURL(data.url || node.getAttribute('src')
      || node.querySelector('source')?.getAttribute('src') || articleURL, articleURL);
    return `\n\n[View embedded media](<${url.replaceAll('>', '%3E')}>)\n\n`;
  };
  const converter = new TurndownService({
    headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-',
    blankReplacement: (_content, node) => isEmbed(node) ? mediaLink(node) : node.isBlock ? '\n\n' : '',
  });
  const escape = converter.escape.bind(converter);
  converter.escape = (text) => escape(text).replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  converter.addRule('retained-structure', {
    filter: (node) => ['FIGURE', 'TABLE'].includes(node.nodeName)
      || (node.nodeName === 'A' && node.hasAttribute('id'))
      || node.classList.contains('footnote'),
    replacement: (_content, node) => node.nodeName === 'A'
      ? retained(node.outerHTML) : `\n\n${retained(node.outerHTML)}\n\n`,
  });
  converter.addRule('embedded-media', {
    filter: isEmbed,
    replacement: (_content, node) => mediaLink(node),
  });
  converter.addRule('substack-controls', {
    filter: (node) => node.getAttribute('data-component-name') === 'SubscribeWidgetToDOM'
      || node.classList.contains('subscription-widget-wrap-editor')
      || (['captioned-button-wrap', 'button-wrapper'].some((name) => node.classList.contains(name))
        && Array.from(node.querySelectorAll('a')).some((a) => {
          const url = new URL(a.getAttribute('href') || articleURL, articleURL);
          return url.searchParams.get('action') === 'share' || url.pathname === '/subscribe';
        })),
    replacement: () => '',
  });
  return converter.turndown(clean).trim();
}

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(path));
    else if (entry.isFile() && /\.mdx?$/.test(entry.name)) files.push(path);
  }
  return files;
}

export async function syncContent({ root = process.cwd(), dryRun = false, fetchFeed = fetch } = {}) {
  const sources = JSON.parse(await readFile(join(root, 'content-sources.json'), 'utf8'));
  if (!Array.isArray(sources) || !sources.length) throw new Error('Configure at least one content source');
  const sourceIDs = new Set();
  for (const source of sources) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(required(source.id, 'source ID')) || sourceIDs.has(source.id)) {
      throw new Error(`Invalid or duplicate source ID: ${source.id}`);
    }
    sourceIDs.add(source.id);
    required(source.publication, 'publication');
    httpURL(required(source.feedURL, 'feed URL'));
  }
  const directory = join(root, 'src/content/writing');
  const files = new Map();
  const byURL = new Map();
  const byID = new Map();
  for (const path of await markdownFiles(directory)) {
    const text = await readFile(path, 'utf8');
    const { data } = matter(text);
    files.set(path, { text, data });
    if (data.canonicalURL) {
      const url = canonical(data.canonicalURL);
      if (byURL.has(url)) throw new Error(`Duplicate local canonical URL: ${url}`);
      byURL.set(url, path);
    }
    if (data.sync) {
      const id = JSON.stringify([data.sync.source, data.sync.id]);
      if (byID.has(id)) throw new Error(`Duplicate local remote ID: ${id}`);
      byID.set(id, path);
    }
  }

  const changes = [];
  const claimed = new Set();
  const seenIDs = new Set();
  const seenURLs = new Set();
  const result = { added: 0, updated: 0, unchanged: 0, failed: 0, paths: [] };
  const errors = [];
  for (const source of sources) {
    try {
      const response = await fetchFeed(source.feedURL, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`Feed returned HTTP ${response.status}`);
      const xml = await response.text();
      const feed = await new Parser({ customFields: { item: [['description', 'description'], ['updated', 'updated']] } }).parseString(xml);
      const atom = /<(?:\w+:)?feed[\s>]/.test(xml);
      for (const item of feed.items) {
        try {
          const url = canonical(required(item.link, 'article URL'));
          const id = JSON.stringify([source.id, item.guid || item.id || url]);
          if (seenIDs.has(id) || seenURLs.has(url)) throw new Error(`Duplicate feed item: ${url}`);
          seenIDs.add(id);
          seenURLs.add(url);
          const html = required(item['content:encoded'] || (atom ? item.content : undefined), 'full article content');
          const body = required(convertHtml(html, url), 'converted article content');
          const title = required(item.title, 'title');
          const description = convertHtml(item.description || item.summary || '', url)
            || body.replace(/<[^>]*>/g, '').slice(0, 200);
          const data = {
            title, description, publication: source.publication,
            pubDate: date(item.pubDate || item.isoDate),
            ...(item.updated ? { updatedDate: date(item.updated) } : {}),
            canonicalURL: url, draft: false,
          };
          const existing = byID.get(id) || byURL.get(url);
          const slug = new URL(url).pathname.split('/').filter(Boolean).at(-1)
            ?.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'post';
          const path = existing || join(directory, source.id, `${slug}-${hash(id).slice(0, 12)}.md`);
          if (claimed.has(path) || (!existing && files.has(path))) throw new Error(`File collision: ${path}`);
          if (existing && files.get(existing).data.sync && files.get(existing).data.sync.source !== source.id) {
            throw new Error(`Post belongs to another source: ${url}`);
          }
          if (existing?.endsWith('.mdx')) throw new Error(`Convert imported MDX to Markdown before syncing: ${existing}`);
          claimed.add(path);
          const sync = { source: source.id, id: item.guid || item.id || url, hash: hash(JSON.stringify({ data, body })) };
          const text = matter.stringify(`${body}\n`, { ...data, sync });
          if (files.get(path)?.text === text) result.unchanged++;
          else {
            result[existing ? 'updated' : 'added']++;
            result.paths.push(relative(root, path));
            changes.push({ path, text });
          }
        } catch (error) {
          result.failed++;
          errors.push(new Error(`${source.id}: ${item.link || item.title || 'item'}: ${error.message}`));
        }
      }
    } catch (error) {
      result.failed++;
      errors.push(new Error(`${source.id}: ${error.message}`));
    }
  }
  if (errors.length) {
    const error = new AggregateError(errors, errors.map((error) => error.message).join('\n'));
    error.result = result;
    throw error;
  }
  if (!dryRun) {
    for (const { path, text } of changes) {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, text);
    }
  }
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--dry-run')) throw new Error('Usage: pnpm content:sync [--dry-run]');
  const dryRun = args.includes('--dry-run');
  let result;
  try {
    result = await syncContent({ dryRun });
  } catch (error) {
    result = error.result || { added: 0, updated: 0, unchanged: 0, failed: 1, paths: [] };
    console.error(error.message);
    process.exitCode = 1;
  }
  const summary = `${dryRun ? 'Dry run: ' : ''}${result.added} added, ${result.updated} updated, ${result.unchanged} unchanged, ${result.failed} failed${process.exitCode ? '. No batch published.' : '.'}`;
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `changed=${!process.exitCode && result.paths.length > 0}\npaths=${JSON.stringify(result.paths)}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
