type EventHandler<T> = (payload: T) => void;

export class EventBus<TEvents extends object> {
  private readonly listeners = new Map<keyof TEvents, Set<EventHandler<TEvents[keyof TEvents]>>>();

  on<TKey extends keyof TEvents>(event: TKey, handler: EventHandler<TEvents[TKey]>): () => void {
    const handlers = this.listeners.get(event) ?? new Set<EventHandler<TEvents[keyof TEvents]>>();
    handlers.add(handler as EventHandler<TEvents[keyof TEvents]>);
    this.listeners.set(event, handlers);

    return () => {
      handlers.delete(handler as EventHandler<TEvents[keyof TEvents]>);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]): void {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }

    for (const handler of handlers) {
      handler(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
