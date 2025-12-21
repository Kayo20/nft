import React, { useState } from 'react';
import { mintNFT } from '../services/nftService';

const rarities = ['Common', 'Rare', 'Epic', 'Legendary'];

export default function MintNFT() {
  const [name, setName] = useState('');
  const [rarity, setRarity] = useState('Common');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleMint = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await mintNFT({ name, rarity });
      setResult(res);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md max-w-xl">
      <h3 className="text-lg font-bold mb-2">Mint NFT</h3>
      <label className="block mb-2">
        <div className="text-sm text-gray-600">Name</div>
        <input className="w-full px-2 py-1 border rounded" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter NFT name" />
      </label>
      <label className="block mb-4">
        <div className="text-sm text-gray-600">Rarity</div>
        <select className="w-full px-2 py-1 border rounded" value={rarity} onChange={(e) => setRarity(e.target.value)}>
          {rarities.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleMint} disabled={loading || !name}>
          {loading ? 'Minting…' : 'Mint NFT'}
        </button>
      </div>

      {error && <div className="mt-3 text-red-600">Error: {error}</div>}

      {result && (
        <div className="mt-3 p-3 border rounded bg-gray-50">
          <div className="text-sm text-gray-700">Success! Metadata URL:</div>
          <div className="break-all text-blue-600">{result.metadataUrl || result.cid ? (result.metadataUrl || `ipfs://${result.cid}`) : JSON.stringify(result)}</div>
          {result.nft && <pre className="mt-2 text-xs text-gray-700">{JSON.stringify(result.nft, null, 2)}</pre>}
        </div>
      )}
    </div>
  );
}
