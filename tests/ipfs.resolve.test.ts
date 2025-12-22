/* @vitest-environment node */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveIpfsMetadata } from '../src/lib/ipfs';

const originalFetch = global.fetch;

describe('resolveIpfsMetadata', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    sessionStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('resolves JSON from gateway', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, headers: { get: () => 'application/json' }, json: async () => ({ name: 'meta' }) });
    const res = await resolveIpfsMetadata('QmSomeCid');
    expect(res).toEqual({ type: 'json', data: { name: 'meta' }, url: expect.any(String) });
  });

  it('returns asset url for images', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, headers: { get: () => 'image/png' } });
    const res = await resolveIpfsMetadata('QmImageCid');
    expect(res).toEqual({ type: 'asset', url: expect.any(String) });
  });

  it('caches results in sessionStorage', async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, headers: { get: () => 'application/json' }, json: async () => ({ name: 'meta' }) });
    const a = await resolveIpfsMetadata('QmCacheCid');
    expect(sessionStorage.getItem('ipfs_meta_QmCacheCid')).toBeTruthy();
    const b = await resolveIpfsMetadata('QmCacheCid');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
