import type { VariableContext } from '@/types/index';

export class VariableResolver {
  private readonly customVariables = new Map<string, () => string>();

  registerVariable(name: string, resolver: () => string): void {
    this.customVariables.set(name, resolver);
  }

  resolve(pattern: string, context: VariableContext): string {
    let result = pattern;

    for (const [key, value] of Object.entries(context)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    for (const [name, resolver] of this.customVariables) {
      result = result.replace(new RegExp(`\\{${name}\\}`, 'g'), resolver());
    }

    return this.cleanFileName(result.replace(/\{[^{}]+\}/g, ''));
  }

  createContext(noteName: string, fileName: string): VariableContext {
    const now = new Date();
    const date = now.toISOString().split('T')[0] ?? '';
    const time = now.toTimeString().split(' ')[0]?.replace(/:/g, '-') ?? '';
    const random = Math.random().toString(36).substring(2, 10);

    return {
      noteName: this.cleanFileName(noteName),
      fileName: this.cleanFileName(fileName),
      date,
      time,
      random
    };
  }

  private cleanFileName(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .trim();
  }
}
