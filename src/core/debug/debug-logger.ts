type LogPayload = Readonly<Record<string, unknown>>;
type DebugLoggingEnabledGetter = () => boolean;

export class DebugLogger {
  private enabled = false;
  private initialized = false;

  constructor(
    private readonly isDebugLoggingEnabled: DebugLoggingEnabledGetter,
    private readonly prefix = 'Note Image Manager'
  ) {}

  refreshMode(reason: string): boolean {
    const next = this.isDebugLoggingEnabled();
    const changed = !this.initialized || this.enabled !== next;
    const previous = this.enabled;
    this.initialized = true;
    this.enabled = next;

    if (next && changed) {
      console.info(`[${this.prefix}] Debug logging enabled`, { reason, previous });
    }

    if (!next && changed && previous) {
      console.info(`[${this.prefix}] Debug logging disabled`, { reason });
    }

    return next;
  }

  isEnabled(): boolean {
    return this.initialized ? this.enabled : this.refreshMode('lazy-check');
  }

  debug(message: string, payload?: LogPayload): void {
    if (!this.isEnabled()) {
      return;
    }

    console.log(`[${this.prefix}] ${message}`, payload ?? {});
  }

  info(message: string, payload?: LogPayload): void {
    if (!this.isEnabled()) {
      return;
    }

    console.info(`[${this.prefix}] ${message}`, payload ?? {});
  }

  warn(message: string, payload?: LogPayload): void {
    if (!this.isEnabled()) {
      return;
    }

    console.warn(`[${this.prefix}] ${message}`, payload ?? {});
  }

  error(message: string, error?: unknown, payload?: LogPayload): void {
    if (!this.isEnabled()) {
      return;
    }

    console.error(`[${this.prefix}] ${message}`, error, payload ?? {});
  }
}
