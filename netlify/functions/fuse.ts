import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { FuseRequestSchema, validateRequest } from "./_utils/validation";
import { verifySession, corsHeaders, securityHeaders } from "./_utils/auth";
import { getNftsByIds as mockGetNftsByIds, insertNft as mockInsertNft, burnNfts as mockBurnNfts } from "./_utils/mock_db";
import { verifyERC20Transfer } from './_utils/web3';
import { TF_TOKEN_CONTRACT, GAME_WALLET } from '../../src/lib/constants';
import { FUSION_COST } from '../../src/lib/constants';

let supabase: any;
try {
  supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
} catch (e) {
  console.warn('Supabase client not configured, using mock DB for fuse');
}

const RARITY_ORDER = ["Uncommon", "Rare", "Epic", "Legendary"];

// TreeFi Spec: Fusion rules
const FUSION_RULES: Record<string, { inputCount: number; outputRarity: string }> = {
  Uncommon: { inputCount: 3, outputRarity: "Rare" },
  Rare: { inputCount: 3, outputRarity: "Epic" },
  Epic: { inputCount: 3, outputRarity: "Legendary" },
  Legendary: { inputCount: -1, outputRarity: "" }, // Cannot fuse Legendary
};

export const handler: Handler = async (event) => {
  const headers = { ...corsHeaders(), ...securityHeaders() };
  
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  
  try {
    if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: "request body required" }) };
    
    let body: any;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "invalid JSON" }) };
    }

    const validation = validateRequest(FuseRequestSchema, body);
    if (!validation.valid) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: validation.error }) };
    }
    const { nftIds, txHash } = validation.data!;

    // Authenticate using session cookie
    const session = verifySession(event.headers.cookie);
    if (!session) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "not authenticated" }) };
    }
    const address = session.address;

    // Fetch NFTs
    let nfts: any[] = [];
    if (!supabase) {
      nfts = mockGetNftsByIds(nftIds as any);
      if (!nfts || nfts.length !== nftIds.length) return { statusCode: 400, headers, body: JSON.stringify({ error: "some nfts not found (mock)" }) };
    } else {
      const { data: fetched, error: fetchErr } = await supabase.from("nfts").select("*").in("id", nftIds);
      if (fetchErr) throw fetchErr;
      nfts = fetched;
      if (!nfts || nfts.length !== nftIds.length) return { statusCode: 400, headers, body: JSON.stringify({ error: "some nfts not found" }) };
    }

    // Validate ownership
    for (const n of nfts) {
      if ((n.owner_address || "").toLowerCase() !== address) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: "not owner of all NFTs" }) };
      }
      if (n.status !== "active") {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "all nfts must be active" }) };
      }
    }

    // Validate rarities are the same
    const rarities = new Set(nfts.map((x: any) => x.rarity || ""));
    if (rarities.size !== 1) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "all NFTs must have the same rarity" }) };
    }

    const currentRarity = Array.from(rarities)[0] as string;

    // TreeFi Spec: Check fusion rules
    const fuseRule = FUSION_RULES[currentRarity];
    if (!fuseRule) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "invalid rarity" }) };
    }

    // Cannot fuse Legendary
    if (currentRarity === "Legendary") {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Legendary NFTs cannot be fused" }) };
    }

    // Must have exactly 3 NFTs for fusion
    if (nftIds.length !== fuseRule.inputCount) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: `must select exactly ${fuseRule.inputCount} NFTs of same rarity` }) };
    }

    const newRarity = fuseRule.outputRarity;
    const idx = RARITY_ORDER.indexOf(currentRarity);
    const expectedNewRarity = idx >= 0 && idx < RARITY_ORDER.length - 1 ? RARITY_ORDER[idx + 1] : currentRarity;
    
    if (newRarity !== expectedNewRarity) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "fusion rarity mismatch" }) };
    }

    // Compute new power (sum of input powers, scaled for rarity increase)
    const totalPower = nfts.reduce((sum: number, x: any) => sum + (Number(x.power) || 0), 0);
    const newPower = Math.max(1, Math.floor(totalPower * 1.2)); // 20% boost for fused NFT

    // txHash is required and we require an on-chain transfer for fusion cost + transaction fee
    const expectedCost = FUSION_COST[currentRarity as any] || 0;
    if (!txHash) return { statusCode: 400, headers, body: JSON.stringify({ error: 'txHash required' }) };

    if (supabase) {
      try {
        const expected = expectedCost + (await import('../../src/lib/constants')).TRANSACTION_FEE_TF;
        const ok = await verifyERC20Transfer(txHash, TF_TOKEN_CONTRACT, GAME_WALLET, expected);
        if (!ok) return { statusCode: 400, headers, body: JSON.stringify({ error: 'on-chain tx verification failed' }) };
      } catch (err) {
        console.error('tx verification error', err);
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'tx verification error' }) };
      }
    } else {
      // in mock mode, accept any txHash
    }

    // Create new NFT (persist or mock)
    let created: any;
    if (!supabase) {
      created = mockInsertNft({ owner_address: address, rarity: newRarity, power: newPower, metadata: { fused_from: nftIds, txHash } });
      mockBurnNfts(nftIds as any);
      return { statusCode: 200, headers, body: JSON.stringify({ nft: created }) };
    }

    const { data: createdData, error: insertErr } = await supabase
      .from("nfts")
      .insert([
        {
          owner_address: address,
          rarity: newRarity,
          power: newPower,
          daily_yield: 0,
          health: 100,
          image_url: nfts[0].image_url || null,
          metadata: { fused_from: nftIds },
          status: "active",
        },
      ])
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Mark inputs burned
    const { error: burnErr } = await supabase.from("nfts").update({ status: "burned" }).in("id", nftIds);
    if (burnErr) throw burnErr;

    // Log fusion history (include expected cost and fee)
    const feeAmount = (await import('../../src/lib/constants')).TRANSACTION_FEE_TF;
    await supabase.from("fusion_history").insert([
      { user_address: address, input_nft_ids: nftIds, result_nft_id: createdData.id, cost: expectedCost, fee: feeAmount, total_paid: expectedCost + feeAmount, tx_hash: txHash },
    ]);

    return { statusCode: 200, headers, body: JSON.stringify({ nft: createdData }) };
  } catch (err: any) {
    console.error("fuse error", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "internal server error" }) };
  }
};
