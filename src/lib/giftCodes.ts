/**
 * Gift Code System for TreeFi
 * Generates and manages 100 unique gift codes for OGs to claim free Uncommon tree NFTs
 */

export interface GiftCode {
  code: string;
  claimed: boolean;
  claimedBy?: string;
  claimedAt?: number;
  createdAt: number;
}

// Generate 100 unique gift codes
export function generateGiftCodes(count: number = 100): GiftCode[] {
  const codes: GiftCode[] = [];
  const now = Date.now();

  for (let i = 1; i <= count; i++) {
    const code = `OG-TREE-${String(i).padStart(5, '0')}-${generateRandomSuffix()}`;
    codes.push({
      code,
      claimed: false,
      createdAt: now,
    });
  }

  return codes;
}

// Generate random 4-character suffix for uniqueness
function generateRandomSuffix(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Validate gift code format
export function isValidGiftCodeFormat(code: string): boolean {
  return /^OG-TREE-\d{5}-[A-Z0-9]{4}$/.test(code);
}

// Check if code exists and is valid
export function validateGiftCode(code: string, giftCodes: GiftCode[]): { valid: boolean; message: string } {
  const trimmed = code.trim().toUpperCase();

  if (!isValidGiftCodeFormat(trimmed)) {
    return { valid: false, message: 'Invalid gift code format' };
  }

  const giftCode = giftCodes.find(gc => gc.code === trimmed);

  if (!giftCode) {
    return { valid: false, message: 'Gift code not found' };
  }

  if (giftCode.claimed) {
    return { valid: false, message: 'This gift code has already been claimed' };
  }

  return { valid: true, message: 'Valid gift code!' };
}

// Claim a gift code
export function claimGiftCode(
  code: string,
  address: string,
  giftCodes: GiftCode[]
): { success: boolean; message: string } {
  const trimmed = code.trim().toUpperCase();
  const validation = validateGiftCode(trimmed, giftCodes);

  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  const giftCode = giftCodes.find(gc => gc.code === trimmed);
  if (giftCode) {
    giftCode.claimed = true;
    giftCode.claimedBy = address;
    giftCode.claimedAt = Date.now();
  }

  return { success: true, message: 'Gift code claimed successfully! You received a free Uncommon tree.' };
}

// Get gift code statistics
export function getGiftCodeStats(giftCodes: GiftCode[]) {
  const total = giftCodes.length;
  const claimed = giftCodes.filter(gc => gc.claimed).length;
  const available = total - claimed;
  const claimRate = ((claimed / total) * 100).toFixed(1);

  return {
    total,
    claimed,
    available,
    claimRate: `${claimRate}%`,
  };
}
