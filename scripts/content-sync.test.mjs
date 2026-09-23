import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import matter from 'gray-matter';
import { convertHtml, syncContent } from './content-sync.mjs';
import { GET as getFeed } from '../src/pages/api/feeds/[source].js';
import { convertDescription } from './content-converter.mjs';

const source = { id: 'one', publication: 'One', feedURL: 'https://one.example/feed' };
const item = ({ title = 'A post', url = 'https://one.example/p/post', body = '<p>Hello.</p>', guid = url } = {}) => `
  <item><title>${title}</title><link>${url}</link><guid>${guid}</guid>
  <pubDate>Tue, 22 Sep 2026 10:00:00 GMT</pubDate><description>A description.</description>
  ${body === null ? '' : `<content:encoded><![CDATA[${body}]]></content:encoded>`}</item>`;
const feed = (...items) => `<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>One</title>${items.join('')}</channel></rss>`;
const response = (xml) => async () => new Response(xml);

async function fixture(t, sources = [source]) {
  const root = await mkdtemp(join(tmpdir(), 'content-sync-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'src/content/writing'), { recursive: true });
  await writeFile(join(root, 'content-sources.json'), JSON.stringify(sources));
  return root;
}

test('migration namespaces synced posts, preserves local drafts, and converges after edits', async (t) => {
  const root = await fixture(t);
  const old = join(root, 'src/content/writing/original-slug.md');
  const local = join(root, 'src/content/writing/local.md');
  const localText = '---\ntitle: Local\ndraft: true\n---\nLocal text.\n';
  await writeFile(local, localText);
  await writeFile(old, '---\ntitle: Old\ntags:\n  - Product\n  - Launch\ncanonicalURL: https://one.example/p/post\ndraft: true\n---\nOld text.\n');
  const fetchFeed = response(feed(item()));
  const dryRun = await syncContent({ root, fetchFeed, dryRun: true });
  assert.equal(dryRun.updated, 1);
  const migratedPath = dryRun.paths.find((path) => path.endsWith('.mdx'));
  assert.match(migratedPath, /^src\/content\/writing\/one\//);
  const migrated = join(root, migratedPath);
  assert.match(await readFile(old, 'utf8'), /Old text/);
  assert.equal((await syncContent({ root, fetchFeed })).updated, 1);
  await assert.rejects(readFile(old, 'utf8'), { code: 'ENOENT' });
  const text = await readFile(migrated, 'utf8');
  assert.equal(matter(text).data.draft, false);
  assert.deepEqual(matter(text).data.tags, ['Product', 'Launch']);
  assert.match(matter(text).data.sync.hash, /^[a-f0-9]{64}$/);
  assert.match(text, /import Tweet from '..\/..\/..\/components\/content\/Tweet\.astro';/);
  assert.equal((await syncContent({ root, fetchFeed })).unchanged, 1);
  await writeFile(migrated, text.replace('Hello.', 'Local edit.'));
  assert.equal((await syncContent({ root, fetchFeed })).updated, 1);
  assert.equal(await readFile(migrated, 'utf8'), text);
  const editedFeed = response(feed(item({ title: 'Updated', body: '<p>Remote edit.</p>' })));
  await syncContent({ root, fetchFeed: editedFeed });
  const edited = await readFile(migrated, 'utf8');
  assert.match(edited, /Remote edit/);
  assert.deepEqual(matter(edited).data.tags, ['Product', 'Launch']);
  assert.notEqual(matter(edited).data.sync.hash, matter(text).data.sync.hash);
  await syncContent({ root, fetchFeed: response(feed()) });
  assert.equal(await readFile(migrated, 'utf8'), edited);
  assert.equal(await readFile(local, 'utf8'), localText);
  assert.deepEqual((await readdir(join(root, 'src/content/writing'))).sort(), ['local.md', 'one']);
});

test('migration rejects an occupied MDX destination without changing either file', async (t) => {
  const root = await fixture(t);
  const markdown = join(root, 'src/content/writing/post.md');
  const original = '---\ncanonicalURL: https://one.example/p/post\n---\nOld Markdown.\n';
  await writeFile(markdown, original);
  const preview = await syncContent({ root, fetchFeed: response(feed(item())), dryRun: true });
  const mdx = join(root, preview.paths.find((path) => path.endsWith('.mdx')));
  await mkdir(dirname(mdx), { recursive: true });
  await writeFile(mdx, 'Unrelated MDX.\n');
  await assert.rejects(syncContent({ root, fetchFeed: response(feed(item())) }), /MDX migration collision/);
  assert.equal(await readFile(markdown, 'utf8'), original);
  assert.equal(await readFile(mdx, 'utf8'), 'Unrelated MDX.\n');
});

test('source namespaces and remote identity keep same-slug posts distinct and URLs stable', async (t) => {
  const root = await fixture(t, [source, { ...source, id: 'two', publication: 'Two', feedURL: 'https://two.example/feed' }]);
  const fetchFeed = async (url) => new Response(feed(item({ url: url.replace('/feed', '/p/post'), guid: url })));
  const result = await syncContent({ root, fetchFeed });
  assert.equal(result.added, 2);
  assert.notEqual(result.paths[0], result.paths[1]);
  const changedURL = async (url) => new Response(feed(item({ url: url.replace('/feed', '/p/new-slug'), guid: url })));
  assert.deepEqual((await syncContent({ root, fetchFeed: changedURL })).paths, result.paths);
  assert.equal((await syncContent({ root, fetchFeed: changedURL })).unchanged, 2);
});

test('bad sources and summary-only items abort the whole batch without writes', async (t) => {
  const root = await fixture(t, [source, { ...source, id: 'two', feedURL: 'https://two.example/feed' }]);
  for (const bad of ['invalid XML', '<html>Not a feed</html>', feed(item({ body: null })), feed(item({ body: '' }))]) {
    await assert.rejects(syncContent({ root, fetchFeed: async (url) => new Response(url === source.feedURL ? feed(item()) : bad) }));
    assert.deepEqual(await readdir(join(root, 'src/content/writing')), []);
  }
  await assert.rejects(syncContent({ root, fetchFeed: async () => new Response('', { status: 503 }) }), /HTTP 503/);
});

test('duplicate feed identities and source IDs fail without writes', async (t) => {
  const root = await fixture(t);
  await assert.rejects(syncContent({ root, fetchFeed: response(feed(item(), item())) }), /Duplicate feed item/);
  await writeFile(join(root, 'content-sources.json'), JSON.stringify([source, source]));
  await assert.rejects(syncContent({ root, fetchFeed: response(feed(item())) }), /duplicate source ID/);
  assert.deepEqual(await readdir(join(root, 'src/content/writing')), []);
});

test('a changed canonical URL cannot claim another existing post', async (t) => {
  const root = await fixture(t);
  const first = item({ guid: 'first', url: 'https://one.example/first' });
  const second = item({ guid: 'second', url: 'https://one.example/second' });
  const result = await syncContent({ root, fetchFeed: response(feed(first, second)) });
  const before = await Promise.all(result.paths.map((path) => readFile(join(root, path), 'utf8')));
  await assert.rejects(syncContent({ root, fetchFeed: response(feed(item({ guid: 'first', url: 'https://one.example/second' }))) }), /different local posts/);
  assert.deepEqual(await Promise.all(result.paths.map((path) => readFile(join(root, path), 'utf8'))), before);
});

test('Atom article content is supported but an Atom summary alone is rejected', async (t) => {
  const root = await fixture(t);
  const atom = (content) => `<feed xmlns="http://www.w3.org/2005/Atom"><title>One</title><entry><id>urn:post:1</id><title>Atom post</title><link href="https://one.example/atom"/><published>2026-09-22T10:00:00Z</published><updated>2026-09-22T11:00:00Z</updated><summary>Summary only</summary>${content}</entry></feed>`;
  await assert.rejects(syncContent({ root, fetchFeed: response(atom('')) }), /full article content/);
  assert.equal((await syncContent({ root, fetchFeed: response(atom('<content type="html">&lt;p&gt;Full post&lt;/p&gt;</content>')) })).added, 1);
});

test('hosted sync reads configured feed IDs through the relay', async (t) => {
  const root = await fixture(t);
  const result = await syncContent({
    root, feedBaseURL: 'https://shub.gg/api/feeds/',
    fetchFeed: async (url) => {
      assert.equal(url, 'https://shub.gg/api/feeds/one');
      return new Response(feed(item()));
    },
  });
  assert.equal(result.added, 1);
});

test('feed endpoint only fetches configured sources and rejects upstream failures', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url, 'https://failingloudly.substack.com/feed');
    return new Response(feed(item()), { headers: { 'Content-Type': 'application/rss+xml' } });
  });
  assert.equal((await getFeed({ params: { source: 'https://unconfigured.example' } })).status, 404);
  assert.equal(fetchMock.mock.callCount(), 0);
  const good = await getFeed({ params: { source: 'failing-loudly' } });
  assert.equal(good.status, 200);
  assert.match(await good.text(), /<rss/);
  fetchMock.mock.mockImplementation(async () => new Response('Challenge', { status: 403 }));
  assert.equal((await getFeed({ params: { source: 'failing-loudly' } })).status, 502);
  fetchMock.mock.mockImplementation(async () => new Response('<html>Login</html>', { headers: { 'Content-Type': 'text/html' } }));
  assert.equal((await getFeed({ params: { source: 'failing-loudly' } })).status, 502);
});

test('conversion preserves MDX structure and footnotes, removes controls, and escapes remote code', () => {
  const md = convertHtml(`
    <h2>A heading</h2><p>Hello <strong>world</strong>.<a id="footnote-anchor-1" href="#footnote-1">1</a></p>
    <ul><li>First<ol><li>Nested</li></ol></li></ul><pre><code>const n = { safe: true };</code></pre>
    <figure><a href="/image"><picture><img src="/photo.jpg" alt="Photo" onerror="alert(1)"></picture></a><figcaption>A caption.</figcaption><button>Image control</button></figure>
    <table><tr><th>Column</th></tr><tr><td>Value</td></tr></table>
    <div class="footnote"><a id="footnote-1" href="#footnote-anchor-1">1</a><p>Footnote text.</p></div>
    <hr><div data-component-name="SubscribeWidgetToDOM"><p>Subscribe CTA</p></div><div><hr></div>
    <div class="captioned-button-wrap"><p>Share CTA</p><a href="?action=share">Share</a></div>
    <iframe src="https://www.youtube.com/embed/123" title="Demo"></iframe>
    <video><source src="/clip.mp4"></video><audio src="/sound.mp3"></audio>
    <div class="native-video-embed" data-attrs='{"mediaUploadId":"123"}'></div>
    <div class="twitter-embed" data-attrs='{"url":"https://x.com/example/status/123"}'></div>
    <p><a href="https://twitter.com/example/status/456">A standalone tweet</a></p>
    <p>An inline <a href="https://x.com/example/status/789">tweet link</a> stays inline.</p>
    <div class="twitter-embed" data-attrs="not-json"></div>
    <script>alert(1)</script><a href="javascript:alert(1)">Unsafe link</a>
    <p>&lt;script&gt;alert(2)&lt;/script&gt;</p>
    <p>{process.exit(1)}</p><p>import fs from 'node:fs'</p>
  `, 'https://one.example/post');
  assert.match(md, /- +First/);
  for (const value of ['## A heading', '**world**', '```', '<ImportedImage', 'captionHtml={"A caption."}', '<SafeHtml', '<table>', 'footnote-1', 'https://one.example/photo.jpg', 'kind={"youtube"}', 'kind={"video"}', 'kind={"audio"}', '<Tweet url={"https://x.com/i/status/123"}', '<Tweet url={"https://x.com/i/status/456"}', 'An inline [tweet link]', '<ImportedMedia kind={"link"}', '&#123;process.exit(1)&#125;', '&#105;mport']) assert.ok(md.includes(value), value);
  assert.doesNotMatch(md, /<script|onerror|javascript:|Subscribe CTA|Share CTA|Image control|<iframe|data-attrs/);
  assert.match(md, /&lt;script&gt;/);
});

test('empty and control-only content terminate, and dividers inside code survive', { timeout: 1000 }, () => {
  assert.equal(convertDescription('', 'https://one.example'), '');
  assert.equal(convertHtml('<div data-component-name="SubscribeWidgetToDOM">Subscribe</div>', 'https://one.example'), '');
  assert.match(convertHtml('<pre><code>* * *\n* * *</code></pre>', 'https://one.example'), /\* \* \*\n\* \* \*/);
  assert.equal(convertHtml('<ol><li>Share<div><hr></div></li></ol><div data-component-name="SubscribeWidgetToDOM">Subscribe</div><div><hr></div><p>Next</p>', 'https://one.example').match(/^\s*\* \* \*\s*$/gm)?.length, 1);
});
