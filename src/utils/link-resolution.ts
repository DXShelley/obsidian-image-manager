import type { ParsedLink } from '@/types/index';

export function getParsedLinkResolutionCandidates(parsed: ParsedLink | null): string[] {
  if (!parsed) {
    return [];
  }

  return getRawLinkResolutionCandidates(parsed.rawPath, parsed.path);
}

export function getRawLinkResolutionCandidates(...targets: (string | null | undefined)[]): string[] {
  const candidates = new Set<string>();
  for (const target of targets) {
    if (!target) {
      continue;
    }

    const normalized = normalizeLinkResolutionTarget(target);
    if (!normalized) {
      continue;
    }

    candidates.add(normalized);
    candidates.add(decodeLinkPathSafely(normalized));
  }

  return [...candidates].filter((candidate) => candidate.length > 0);
}

export function normalizeLinkResolutionTarget(target: string): string {
  return target.trim().replace(/[?#].*$/, '');
}

export function decodeLinkPathSafely(path: string): string {
  try {
    return decodeURI(path);
  } catch {
    return path;
  }
}
