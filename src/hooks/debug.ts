export function debugMissingNFT(nft: any, context = '') {
  try {
    // Keep logs small and readable
    const summary = {
      id: nft.id,
      image: nft.image || null,
      image_url: nft.image_url || null,
      image_url_resolved: nft.image_url_resolved || null,
      metadata_image: nft.metadata?.image || nft.metadata?.image_url || null,
      context,
    };
    // eslint-disable-next-line no-console
    console.warn('NFT image missing or unresolved:', summary);
  } catch (e) {
    // ignore
  }
}
