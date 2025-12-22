// Global polyfills for fetch in vitest environment
if (typeof (globalThis as any).fetch === 'undefined') {
  // simple fallback for Node tests; test files can override with vi.fn()
  (globalThis as any).fetch = async () => {
    throw new Error('fetch not implemented in node test environment');
  };
}

// Add a sessionStorage shim for Node tests
if (typeof (globalThis as any).sessionStorage === 'undefined') {
  const _store = new Map<string, string>();
  (globalThis as any).sessionStorage = {
    getItem: (k: string) => (_store.has(k) ? _store.get(k) as string : null),
    setItem: (k: string, v: string) => _store.set(k, v),
    removeItem: (k: string) => _store.delete(k),
    clear: () => _store.clear(),
  };
}
