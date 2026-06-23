export function extractImageLinks(content: string): string[] {
  const links = new Set<string>();
  const wikiRegex = /!\[\[([^|\]]+)(?:\|[^\]]*)?\]\]/g;
  const markdownRegex = /!\[[^\]]*]\(([^)]+)\)/g;

  for (const match of content.matchAll(wikiRegex)) {
    if (match[1]) {
      links.add(decodeURIComponent(match[1]));
    }
  }

  for (const match of content.matchAll(markdownRegex)) {
    if (match[1]) {
      links.add(decodeURIComponent(match[1].split(/\s+\|/)[0] ?? match[1]));
    }
  }

  return [...links];
}
