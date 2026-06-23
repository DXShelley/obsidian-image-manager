export interface RegexIgnoreMatch {
  readonly source: string;
  readonly target: string;
}

export function parseRegexIgnorePattern(value: string): RegExp[] {
  const patterns: RegExp[] = [];
  for (const line of value.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    patterns.push(new RegExp(trimmed));
  }
  return patterns;
}

export function validateRegexIgnorePattern(value: string): string[] {
  const invalid: string[] = [];
  for (const line of value.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    try {
      new RegExp(trimmed);
    } catch {
      invalid.push(trimmed);
    }
  }
  return invalid;
}

export function matchRegexIgnorePattern(value: string, target: string): RegexIgnoreMatch | null {
  for (const line of value.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const pattern = new RegExp(trimmed);
    if (pattern.test(target)) {
      return {
        source: trimmed,
        target
      };
    }
  }

  return null;
}
