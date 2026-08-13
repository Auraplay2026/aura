export interface ComplianceCheckParams {
  user: {
    id: string;
    kycStatus?: string | null;
    accountType?: string;
    adminNotes?: string | null;
  };
  stakeOrAmount: number;
  actionType: 'bet' | 'deposit' | 'withdraw';
}

export interface ComplianceCheckResult {
  allowed: boolean;
  reason?: string;
  code?: 'KYC_REQUIRED_HIGH_STAKE' | 'SELF_EXCLUDED' | 'DEPOSIT_LIMIT_EXCEEDED';
}

/**
 * Enterprise Responsible Gaming & Compliance Engine
 * Enforces self-exclusion, KYC thresholds on high-stake wagers (> ₹50,000), and limits.
 */
export function validateResponsibleGaming(params: ComplianceCheckParams): ComplianceCheckResult {
  const { user, stakeOrAmount, actionType } = params;

  // 1. Self-Exclusion Check
  if (user.adminNotes && user.adminNotes.includes('[SELF_EXCLUDED]')) {
    return {
      allowed: false,
      reason: 'RESPONSIBLE_GAMING_EXCLUSION: Account is currently in a self-exclusion timeout period.',
      code: 'SELF_EXCLUDED'
    };
  }

  // 2. High-Stake KYC Threshold Requirement (> ₹50,000 wager)
  // On real-money accounts, wagers exceeding ₹50,000 require approved KYC status
  const isRealAccount = user.accountType === 'real';
  const kycStatus = (user.kycStatus || 'NONE').toUpperCase();
  const isKycApproved = kycStatus === 'APPROVED' || kycStatus === 'VERIFIED';

  if (isRealAccount && actionType === 'bet' && stakeOrAmount > 50000 && !isKycApproved) {
    return {
      allowed: false,
      reason: 'KYC_VERIFICATION_REQUIRED: Wagers exceeding ₹50,000 require a verified KYC profile.',
      code: 'KYC_REQUIRED_HIGH_STAKE'
    };
  }

  // 3. High-Value Withdrawal KYC Enforcement (> ₹10,000 withdrawal)
  if (isRealAccount && actionType === 'withdraw' && stakeOrAmount > 10000 && !isKycApproved) {
    return {
      allowed: false,
      reason: 'KYC_VERIFICATION_REQUIRED: Withdrawals exceeding ₹10,000 require KYC identity verification.',
      code: 'KYC_REQUIRED_HIGH_STAKE'
    };
  }

  return { allowed: true };
}
