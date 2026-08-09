import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Ad landing pages, read from content/landing/*.md at build time.
 *
 * WHY MARKDOWN FILES RATHER THAN THE CMS
 * These are campaign assets, not site content. They are reviewed as .docx
 * before they go live, iterated on with whoever runs the ads, and retired when
 * the campaign ends. Keeping the markdown as the single source means the
 * document under review and the page that serves traffic are generated from
 * the same bytes — scripts/export-landing-docx.py reads exactly these files.
 *
 * They are deliberately NOT in the sitemap and are served noindex. Every one
 * of the eight duplicates a service page that already ranks organically, so
 * letting them be indexed would set the firm's own pages against each other.
 */

const DIR = path.join(process.cwd(), 'content', 'landing');

/**
 * One variant per `type`, rather than `{ type: 'h2' | 'h3' | 'p' }`. A union
 * member whose own discriminant is a union does not narrow away cleanly, so
 * the renderer could not see `items` after ruling out the text kinds.
 */
export type Block =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] };

export type Landing = {
  slug: string;
  title: string;
  h1: string;
  subhead: string;
  description: string;
  /**
   * Index into the brand photography (the homepage hero plus its four section
   * images). Chosen per page so the photograph matches the subject rather than
   * rotating arbitrarily, and set in the markdown so it is editable alongside
   * the copy.
   */
  image: number;
  blocks: Block[];
};

/**
 * The source is hard-wrapped, so a lone newline inside a paragraph or bullet
 * is a soft wrap and must be joined back. Blocks are therefore accumulated and
 * flushed when the next block starts — not emitted line by line, which split
 * every wrapped bullet in half.
 */
function parseBody(body: string): Block[] {
  const blocks: Block[] = [];
  let kind: 'p' | 'ul' | 'ol' | 'h2' | 'h3' | null = null;
  let lines: string[] = [];

  const flush = () => {
    if (!kind || lines.length === 0) return;
    if (kind === 'ul' || kind === 'ol') blocks.push({ type: kind, items: [...lines] });
    else blocks.push({ type: kind, text: lines.join(' ') } as Block);
    kind = null;
    lines = [];
  };

  for (const raw of body.split('\n')) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }
    if (line.startsWith('## ')) {
      flush();
      kind = 'h2';
      lines = [line.slice(3).trim()];
    } else if (line.startsWith('### ')) {
      flush();
      kind = 'h3';
      lines = [line.slice(4).trim()];
    } else if (/^\s*[-*]\s+/.test(line)) {
      const item = line.replace(/^\s*[-*]\s+/, '');
      if (kind === 'ul') lines.push(item);
      else {
        flush();
        kind = 'ul';
        lines = [item];
      }
    } else if (/^\s*\d+\.\s+/.test(line)) {
      const item = line.replace(/^\s*\d+\.\s+/, '');
      if (kind === 'ol') lines.push(item);
      else {
        flush();
        kind = 'ol';
        lines = [item];
      }
    } else if (kind === 'ul' || kind === 'ol') {
      // Continuation of the last list item, not a new one.
      lines[lines.length - 1] += ` ${line.trim()}`;
    } else if (kind) {
      lines.push(line.trim());
    } else {
      kind = 'p';
      lines = [line.trim()];
    }
  }
  flush();
  return blocks;
}

function parse(slug: string, raw: string): Landing {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta: Record<string, string> = {};
  let body = raw;
  if (m) {
    for (const line of m[1].split('\n')) {
      const i = line.indexOf(':');
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
    body = m[2];
  }
  return {
    slug,
    title: meta.title ?? slug,
    h1: meta.h1 ?? meta.title ?? slug,
    subhead: meta.subhead ?? '',
    description: meta.description ?? '',
    image: Number.isFinite(Number(meta.image)) ? Number(meta.image) : 0,
    blocks: parseBody(body),
  };
}

export async function getLandingSlugs(): Promise<string[]> {
  const files = await readdir(DIR).catch(() => [] as string[]);
  return files.filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)).sort();
}

export async function getLanding(slug: string): Promise<Landing | null> {
  // Guard the path: slug comes from the URL, and a traversal here would read
  // arbitrary files off disk at build time.
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const raw = await readFile(path.join(DIR, `${slug}.md`), 'utf8').catch(() => null);
  return raw === null ? null : parse(slug, raw);
}

export async function getAllLandings(): Promise<Landing[]> {
  const slugs = await getLandingSlugs();
  const all = await Promise.all(slugs.map((s) => getLanding(s)));
  return all.filter((x): x is Landing => x !== null);
}

/** `**bold**` -> segments. The only inline markup these pages use. */
export function inline(text: string): { text: string; bold: boolean }[] {
  return text
    .split(/\*\*(.+?)\*\*/g)
    .map((part, i) => ({ text: part, bold: i % 2 === 1 }))
    .filter((s) => s.text !== '');
}
