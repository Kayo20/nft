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

  it('lists images from an IPFS html directory listing', async () => {
    const html = `<html><body><a href="image1.png">image1.png</a><a href="/ipfs/QmCid/Uncommon/image2.jpg">image2.jpg</a></body></html>`;
    (global.fetch as any).mockResolvedValueOnce({ ok: true, headers: { get: () => 'text/html' }, text: async () => html });
    const { listIpfsFolder } = await import('../src/lib/ipfs');
    const res = await listIpfsFolder('QmSomeFolder/Uncommon', ['https://gateway.test/ipfs']);
    expect(res).toEqual(expect.arrayContaining([expect.stringContaining('image1.png'), expect.stringContaining('image2.jpg')]));
  });
});
