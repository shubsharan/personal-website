import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import matter from 'gray-matter';
import { convertHtml, syncContent } from './content-sync.mjs';

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

test('migration keeps URLs, publishes imports, preserves local drafts, and converges after edits', async (t) => {
  const root = await fixture(t);
  const old = join(root, 'src/content/writing/original-slug.md');
  const local = join(root, 'src/content/writing/local.md');
  const localText = '---\ntitle: Local\ndraft: true\n---\nLocal text.\n';
  await writeFile(local, localText);
  await writeFile(old, '---\ntitle: Old\ncanonicalURL: https://one.example/p/post\ndraft: true\n---\nOld text.\n');
  const fetchFeed = response(feed(item()));
  assert.equal((await syncContent({ root, fetchFeed, dryRun: true })).updated, 1);
  assert.match(await readFile(old, 'utf8'), /Old text/);
  assert.equal((await syncContent({ root, fetchFeed })).updated, 1);
  const text = await readFile(old, 'utf8');
  assert.equal(matter(text).data.draft, false);
  assert.match(matter(text).data.sync.hash, /^[a-f0-9]{64}$/);
  assert.equal((await syncContent({ root, fetchFeed })).unchanged, 1);
  await writeFile(old, text.replace('Hello.', 'Local edit.'));
  assert.equal((await syncContent({ root, fetchFeed })).updated, 1);
  assert.equal(await readFile(old, 'utf8'), text);
  const editedFeed = response(feed(item({ title: 'Updated', body: '<p>Remote edit.</p>' })));
  await syncContent({ root, fetchFeed: editedFeed });
  const edited = await readFile(old, 'utf8');
  assert.match(edited, /Remote edit/);
  assert.notEqual(matter(edited).data.sync.hash, matter(text).data.sync.hash);
  await syncContent({ root, fetchFeed: response(feed()) });
  assert.equal(await readFile(old, 'utf8'), edited);
  assert.equal(await readFile(local, 'utf8'), localText);
  assert.deepEqual((await readdir(join(root, 'src/content/writing'))).sort(), ['local.md', 'original-slug.md']);
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

test('Atom article content is supported but an Atom summary alone is rejected', async (t) => {
  const root = await fixture(t);
  const atom = (content) => `<feed xmlns="http://www.w3.org/2005/Atom"><title>One</title><entry><id>urn:post:1</id><title>Atom post</title><link href="https://one.example/atom"/><published>2026-09-22T10:00:00Z</published><updated>2026-09-22T11:00:00Z</updated><summary>Summary only</summary>${content}</entry></feed>`;
  await assert.rejects(syncContent({ root, fetchFeed: response(atom('')) }), /full article content/);
  assert.equal((await syncContent({ root, fetchFeed: response(atom('<content type="html">&lt;p&gt;Full post&lt;/p&gt;</content>')) })).added, 1);
});

test('conversion preserves structure and footnotes, removes controls, and makes media links', () => {
  const md = convertHtml(`
    <h2>A heading</h2><p>Hello <strong>world</strong>.<a id="footnote-anchor-1" href="#footnote-1">1</a></p>
    <ul><li>First</li></ul><pre><code>const n = 1;</code></pre>
    <figure><a href="/image"><picture><img src="/photo.jpg" alt="Photo" onerror="alert(1)"></picture></a><figcaption>A caption.</figcaption><button>Image control</button></figure>
    <table><tr><th>Column</th></tr><tr><td>Value</td></tr></table>
    <div class="footnote"><a id="footnote-1" href="#footnote-anchor-1">1</a><p>Footnote text.</p></div>
    <div data-component-name="SubscribeWidgetToDOM"><p>Subscribe CTA</p></div>
    <div class="captioned-button-wrap"><p>Share CTA</p><a href="?action=share">Share</a></div>
    <iframe src="https://www.youtube.com/embed/123"></iframe>
    <div class="native-video-embed" data-attrs='{"mediaUploadId":"123"}'></div>
    <div class="twitter-embed" data-attrs='{"url":"https://example.com/status/123"}'></div>
    <script>alert(1)</script><a href="javascript:alert(1)">Unsafe link</a>
    <p>&lt;script&gt;alert(2)&lt;/script&gt;</p>
  `, 'https://one.example/post');
  assert.match(md, /- +First/);
  for (const value of ['## A heading', '**world**', '```', '<figure>', '<figcaption>A caption.</figcaption>', '<table>', 'id="footnote-1"', 'href="#footnote-1"', 'https://one.example/photo.jpg', 'https://www.youtube.com/embed/123', 'https://example.com/status/123', '[View embedded media](<https://one.example/post>)']) assert.ok(md.includes(value), value);
  assert.doesNotMatch(md, /<script|onerror|javascript:|Subscribe CTA|Share CTA|Image control|<iframe|data-attrs/);
  assert.match(md, /&lt;script&gt;/);
});
