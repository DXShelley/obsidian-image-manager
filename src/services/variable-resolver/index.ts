import type { VariableContext } from '@/types/index';

export class VariableResolver {
  private readonly customVariables = new Map<string, () => string>();

  registerVariable(name: string, resolver: () => string): void {
    this.customVariables.set(name, resolver);
  }

  resolve(pattern: string, context: VariableContext): string {
    return this.cleanFileName(this.replaceVariables(pattern, context));
  }

  resolvePath(pattern: string, context: VariableContext): string {
    return this.replaceVariables(pattern, context)
      .replace(/\\/g, '/')
      .split('/')
      .map((segment) => {
        if (!segment || segment === '.' || segment === '..') {
          return segment;
        }

        return this.cleanFileName(segment);
      })
      .join('/');
  }

  createContext(noteName: string, fileName: string): VariableContext {
    const now = new Date();
    const date = `${now.getFullYear()}-${this.pad(now.getMonth() + 1)}-${this.pad(now.getDate())}`;
    const time = `${this.pad(now.getHours())}-${this.pad(now.getMinutes())}-${this.pad(now.getSeconds())}`;
    const random = Math.random().toString(36).substring(2, 10);

    return {
      noteName: this.cleanFileName(noteName),
      noteFileName: this.cleanFileName(noteName),
      fileName: this.cleanFileName(fileName),
      date,
      time,
      random
    };
  }

  validatePattern(pattern: string): string[] {
    const known = new Set(['noteName', 'noteFileName', 'fileName', 'date', 'time', 'random', ...this.customVariables.keys()]);
    const matches = pattern.match(/\$?\{([^{}]+)\}/g) ?? [];
    const unresolved = new Set<string>();

    for (const match of matches) {
      const variable = match.replace(/^\$?\{/, '').replace(/}$/, '');
      if (!known.has(variable)) {
        unresolved.add(variable);
      }
    }

    return [...unresolved];
  }

  getRegisteredVariables(): string[] {
    return ['noteName', 'noteFileName', 'fileName', 'date', 'time', 'random', ...this.customVariables.keys()];
  }

  private replaceVariables(pattern: string, context: VariableContext): string {
    let result = this.normalizePattern(pattern, context);

    for (const [key, value] of Object.entries(context)) {
      result = result
        .replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value)
        .replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    for (const [name, resolver] of this.customVariables) {
      const value = resolver();
      result = result
        .replace(new RegExp(`\\$\\{${name}\\}`, 'g'), value)
        .replace(new RegExp(`\\{${name}\\}`, 'g'), value);
    }

    return result.replace(/\$?\{[^{}]+\}/g, '');
  }

  private normalizePattern(pattern: string, context: VariableContext): string {
    let normalized = pattern;
    const entries = Object.entries(context).filter(([, value]) => value.length > 0);

    for (let i = 0; i < entries.length; i += 1) {
      const leftEntry = entries[i];
      if (!leftEntry) {
        continue;
      }

      for (let j = i + 1; j < entries.length; j += 1) {
        const rightEntry = entries[j];
        if (!rightEntry) {
          continue;
        }

        const [leftKey, leftValue] = leftEntry;
        const [rightKey, rightValue] = rightEntry;
        if (leftValue !== rightValue) {
          continue;
        }

        normalized = this.collapseDuplicateVariablePair(normalized, leftKey, rightKey);
      }
    }

    return normalized;
  }

  private collapseDuplicateVariablePair(pattern: string, leftKey: string, rightKey: string): string {
    const leftTokens = [`{${leftKey}}`, `\${${leftKey}}`];
    const rightTokens = [`{${rightKey}}`, `\${${rightKey}}`];
    const separators = ['-', '_', ' '];
    let updated = pattern;

    for (const leftToken of leftTokens) {
      for (const rightToken of rightTokens) {
        for (const separator of separators) {
          updated = updated
            .split(`${leftToken}${separator}${rightToken}`)
            .join(leftToken)
            .split(`${rightToken}${separator}${leftToken}`)
            .join(rightToken);
        }
      }
    }

    return updated;
  }

  private cleanFileName(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/-{2,}/g, '-')
      .replace(/_+/g, '_')
      .replace(/^[-_.]+|[-_.]+$/g, '')
      .trim();
  }

  private pad(value: number): string {
    return value.toString().padStart(2, '0');
  }
}
