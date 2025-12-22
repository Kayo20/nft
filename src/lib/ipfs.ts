export async function resolveIpfsMetadata(uriOrCid: string, gateway = 'https://ipfs.io/ipfs') {
  if (!uriOrCid) return null;

  // If it's already a URL, fetch it directly
  try {
    if (/^https?:\/\//i.test(uriOrCid)) {
      const res = await fetch(uriOrCid);
      if (!res.ok) return null;
      return res.json();
    }

    // Accept URIs like ipfs://<cid>/path
    const ipfsMatch = uriOrCid.match(/ipfs:\/\/(.+)/i);
    let cidPath = uriOrCid;
    if (ipfsMatch) cidPath = ipfsMatch[1];

    // If it looks like a CID or cid/path, build gateway URL
    const url = `${gateway}/${cidPath}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    console.warn('Failed to resolve IPFS metadata', e);
    return null;
  }
}
