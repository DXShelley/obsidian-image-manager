export function extractImageLinks(content: string): string[] {
  const links = new Set<string>();
  const wikiRegex = /!\[\[([^\]]+)\]\]/g;
  const markdownRegex = /!\[[^\]]*]\(((?:<[^>]+>|[^)])+)\)/g;

  for (const match of content.matchAll(wikiRegex)) {
    if (match[1]) {
      links.add(match[1].split('|')[0] ?? match[1]);
    }
  }

  for (const match of content.matchAll(markdownRegex)) {
    if (match[1]) {
      links.add(parseMarkdownTarget(match[1]));
    }
  }

  return [...links];
}

function parseMarkdownTarget(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (trimmed.startsWith('<')) {
    const closingIndex = trimmed.indexOf('>');
    if (closingIndex >= 0) {
      return trimmed.slice(1, closingIndex);
    }
  }

  const titleMatch = trimmed.match(/^(.*?)(\s+(".*?"|'.*?'|\(.*?\)))$/);
  if (titleMatch?.[1]) {
    return titleMatch[1].trim();
  }

  return trimmed;
}
