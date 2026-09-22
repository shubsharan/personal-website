import sanitizeHtml from 'sanitize-html';
import TurndownService from 'turndown';

function httpURL(value, base) {
  const url = new URL(value, base);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error(`Expected an HTTP(S) URL: ${value}`);
  }
  return url.href;
}

function props(values) {
  return Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}={${JSON.stringify(value)}}`)
    .join(' ');
}

function data(node) {
  return JSON.parse(node.getAttribute('data-attrs') || '{}');
}

function tweetURL(value, base) {
  try {
    const url = new URL(value, base);
    if (!/(^|\.)(?:x|twitter)\.com$/.test(url.hostname)) return undefined;
    const match = url.pathname.match(/\/status\/(\d+)/);
    return match ? `https://x.com/i/status/${match[1]}` : undefined;
  } catch {
    return undefined;
  }
}

function normalizeDividers(markdown) {
  const lines = markdown.split('\n');
  const output = [];
  let fence;
  for (const line of lines) {
    const marker = line.match(/^(```+|~~~+)/)?.[1];
    if (marker) fence = fence ? (marker[0] === fence[0] && marker.length >= fence.length ? undefined : fence) : marker;
    if (!fence && line === '* * *') {
      const previous = output.findLast((value) => value.trim());
      if (previous === '* * *') continue;
    }
    output.push(line);
  }
  while (output.length && !output.at(0).trim()) output.shift();
  while (output.length && !output.at(-1).trim()) output.pop();
  if (output.at(0) === '* * *') output.shift();
  if (output.at(-1) === '* * *') output.pop();
  return output.join('\n').trim();
}

function convert(html, articleURL, blocks) {
  const retained = (value) => sanitizeHtml(value, {
    allowedTags: sanitizeHtml.defaults.allowedTags,
    allowedAttributes: {
      a: ['href', 'id'], '*': ['id'], th: ['colspan', 'rowspan'], td: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowProtocolRelative: false,
  });
  const clean = sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'picture', 'iframe', 'video', 'audio', 'source'],
    allowedAttributes: {
      '*': ['id', 'class', 'data-component-name', 'data-attrs'],
      a: ['href', 'title'], img: ['src', 'alt', 'title', 'width', 'height'],
      iframe: ['src', 'title'], video: ['src', 'poster'], audio: ['src'], source: ['src', 'type'],
      th: ['colspan', 'rowspan'], td: ['colspan', 'rowspan'],
    },
    nonTextTags: ['script', 'style', 'textarea', 'option', 'form', 'button', 'svg'],
    allowedSchemes: ['https', 'http', 'mailto'],
    allowedSchemesByTag: { img: ['https', 'http'], iframe: ['https', 'http'], video: ['https', 'http'], audio: ['https', 'http'], source: ['https', 'http'] },
    allowProtocolRelative: false,
    transformTags: {
      '*': (tagName, attribs) => {
        for (const attr of ['href', 'src', 'poster']) {
          if (attribs[attr] && !attribs[attr].startsWith('#') && !attribs[attr].startsWith('mailto:')) {
            attribs[attr] = new URL(attribs[attr], articleURL).href;
          }
        }
        return { tagName, attribs };
      },
    },
  });
  const imageBlock = (node) => {
    const image = node.querySelector('img[src]');
    const link = image.closest('a[href]');
    const caption = node.querySelector('figcaption');
    const width = Number.parseFloat(image.getAttribute('width'));
    const height = Number.parseFloat(image.getAttribute('height'));
    return `\n\n<ImportedImage ${props({
      src: image.getAttribute('src'), alt: image.getAttribute('alt') || '', title: image.getAttribute('title'),
      width: Number.isFinite(width) ? width : undefined, height: Number.isFinite(height) ? height : undefined,
      href: link?.getAttribute('href'), captionHtml: caption ? retained(caption.innerHTML) : undefined,
    })} />\n\n`;
  };
  const tweetBlock = (node) => {
    const url = tweetURL(data(node).url || node.querySelector('a[href]')?.getAttribute('href'), articleURL);
    return url ? `\n\n<Tweet ${props({ url })} />\n\n`
      : `\n\n<ImportedMedia ${props({ kind: 'link', src: articleURL, title: 'View embedded media' })} />\n\n`;
  };
  const mediaBlock = (node) => {
    const src = node.getAttribute('src') || node.querySelector('source[src]')?.getAttribute('src');
    const youtube = src?.match(/^https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([^?/#]+)/);
    const kind = youtube ? 'youtube' : node.nodeName === 'VIDEO' ? 'video' : node.nodeName === 'AUDIO' ? 'audio' : 'link';
    const mediaSrc = youtube ? src : src ? httpURL(src, articleURL) : articleURL;
    return `\n\n<ImportedMedia ${props({ kind, src: mediaSrc, title: node.getAttribute('title') || (kind === 'link' ? 'View embedded media' : 'Embedded media') })} />\n\n`;
  };
  const converter = new TurndownService({
    headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-',
    blankReplacement: (_content, node) => {
      if (!blocks) return node.isBlock ? '\n\n' : '';
      if (node.nodeName === 'FIGURE' && node.querySelector('img[src]')) return imageBlock(node);
      if (node.classList.contains('twitter-embed')) return tweetBlock(node);
      if (['IFRAME', 'VIDEO', 'AUDIO'].includes(node.nodeName) || node.classList.contains('native-video-embed')) return mediaBlock(node);
      return node.isBlock ? '\n\n' : '';
    },
  });
  const escape = converter.escape.bind(converter);
  converter.escape = (text) => escape(text)
    .replaceAll('{', '&#123;').replaceAll('}', '&#125;')
    .replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replace(/\b(import|export)\b/g, (word) => `&#${word.codePointAt(0)};${word.slice(1)}`);

  const isControl = (node) => {
    const component = node.getAttribute('data-component-name') || '';
    if (/^(?:Subscribe|Follow)/.test(component)) return true;
    if (['subscription-widget-wrap-editor', 'subscription-widget', 'follow-button'].some((name) => node.classList.contains(name))) return true;
    if (!['captioned-button-wrap', 'button-wrapper'].some((name) => node.classList.contains(name))) return false;
    return Array.from(node.querySelectorAll('a')).some((anchor) => {
      try {
        const url = new URL(anchor.getAttribute('href') || articleURL, articleURL);
        return ['share', 'subscribe', 'follow'].includes(url.searchParams.get('action')) || /\/(?:subscribe|follow)\/?$/.test(url.pathname);
      } catch {
        return false;
      }
    });
  };
  converter.addRule('controls', { filter: isControl, replacement: () => '' });

  if (blocks) {
    converter.addRule('retained-structure', {
      filter: (node) => node.nodeName === 'TABLE'
        || (node.nodeName === 'A' && node.hasAttribute('id'))
        || node.classList.contains('footnote'),
      replacement: (_content, node) => {
        const component = `<SafeHtml ${props({ html: retained(node.outerHTML) })} />`;
        return node.nodeName === 'A' ? component : `\n\n${component}\n\n`;
      },
    });
    converter.addRule('images', {
      filter: (node) => node.nodeName === 'FIGURE' && Boolean(node.querySelector('img[src]')),
      replacement: (_content, node) => imageBlock(node),
    });
    converter.addRule('tweets', {
      filter: (node) => node.classList.contains('twitter-embed')
        || (node.nodeName === 'P' && node.children.length === 1 && Boolean(tweetURL(node.children[0].getAttribute?.('href'), articleURL))),
      replacement: (_content, node) => tweetBlock(node),
    });
    converter.addRule('media', {
      filter: (node) => ['IFRAME', 'VIDEO', 'AUDIO'].includes(node.nodeName) || node.classList.contains('native-video-embed'),
      replacement: (_content, node) => mediaBlock(node),
    });
  } else {
    converter.addRule('description-media', {
      filter: (node) => node.nodeName === 'FIGURE' || ['IFRAME', 'VIDEO', 'AUDIO'].includes(node.nodeName)
        || node.classList.contains('twitter-embed') || node.classList.contains('native-video-embed'),
      replacement: () => '',
    });
  }

  return normalizeDividers(converter.turndown(clean).replace(/^[\t ]+$/gm, ''));
}

export const convertHtml = (html, articleURL) => convert(html, articleURL, true);
export const convertDescription = (html, articleURL) => convert(html, articleURL, false);
