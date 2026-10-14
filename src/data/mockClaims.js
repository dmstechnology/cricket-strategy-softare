import { at } from './time';
import { mockAppSettings } from './mockStrategies';

// SIMULATED claim requests. No money is distributed by this demo.
const c = (id, userId, category, amount, explanation, status, day, extra = {}) => {
  const submittedAt = at(day, 11, 15);
  const history = [{ status: 'Submitted', at: submittedAt, note: 'Claim submitted by user.' }, ...(extra.history || [])];
  return {
    id,
    userId,
    category,
    amount,
    explanation,
    status,
    message: extra.message || mockAppSettings.claimDefaultMessage,
    processingTime: extra.processingTime || mockAppSettings.claimProcessingTime,
    internalNotes: extra.internalNotes || '',
    submittedAt,
    updatedAt: history[history.length - 1].at,
    history,
  };
};

export const mockClaims = [
  c('CLM-2026-0001', 'U-003', 'Demo Reward', 2500, 'Monthly demo reward.', 'Completed (Simulated)', -20, {
    message: 'Your demo claim has been marked as completed. No real payment has been made.',
    history: [
      { status: 'Under Review', at: at(-19, 10), note: 'Reviewed by admin.' },
      { status: 'Approved (Simulated)', at: at(-18, 15), note: 'Approved for demo.' },
      { status: 'Completed (Simulated)', at: at(-17, 12), note: 'Marked completed (simulated).' },
    ],
  }),
  c('CLM-2026-0002', 'U-006', 'Promotional Credit (Demo)', 1200, 'Referral promotion (demo).', 'Processing', -6, {
    message: 'Your demo claim is being processed. Estimated time is 1–2 days. This is a demonstration message only.',
    processingTime: '1–2 days',
    history: [
      { status: 'Under Review', at: at(-5, 10), note: 'Checked KYC (simulated).' },
      { status: 'Approved (Simulated)', at: at(-4, 11), note: '' },
      { status: 'Processing', at: at(-3, 9), note: '' },
    ],
  }),
  c('CLM-2026-0003', 'U-003', 'Demo Wallet Adjustment', 800, 'Wallet top-up shown as failed.', 'Under Review', -2, {
    internalNotes: 'Check the failed demo transaction TXN-7104.',
    history: [{ status: 'Under Review', at: at(-1, 16), note: 'Assigned for review.' }],
  }),
  c('CLM-2026-0004', 'U-004', 'Demo Reward', 5000, 'Weekly demo reward.', 'Rejected (Simulated)', -8, {
    message: 'Your demo claim could not be approved because the demo KYC is still pending. This is a demonstration message only.',
    history: [{ status: 'Rejected (Simulated)', at: at(-7, 12), note: 'KYC not approved.' }],
  }),
  c('CLM-2026-0005', 'U-006', 'Other', 300, 'Testing the claim form.', 'Submitted', -1),
];
