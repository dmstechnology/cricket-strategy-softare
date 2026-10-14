import { at } from './time';

// SIMULATED wallet transactions. No real money is accepted, stored or moved.
const t = (id, userId, type, amount, description, status, day, h = 12) => ({
  id,
  userId,
  type,
  amount,
  description,
  status,
  createdAt: at(day, h, 10),
});

export const mockTransactions = [
  t('TXN-7001', 'U-002', 'Credit', 10000, 'Demo welcome credit', 'Completed', -64, 9),
  t('TXN-7002', 'U-002', 'Credit', 5000, 'Simulated add funds', 'Completed', -40),
  t('TXN-7003', 'U-002', 'Debit', 1500, 'Demo strategy allocation', 'Completed', -30),
  t('TXN-7004', 'U-002', 'Credit', 2500, 'Simulated add funds', 'Failed', -18, 18),
  t('TXN-7005', 'U-002', 'Debit', 499, 'Demo premium analytics (simulated)', 'Completed', -14),
  t('TXN-7006', 'U-002', 'Credit', 3000, 'Simulated add funds', 'Completed', -7, 10),
  t('TXN-7007', 'U-002', 'Debit', 750, 'Demo strategy allocation', 'Completed', -3, 15),
  t('TXN-7008', 'U-002', 'Credit', 1000, 'Simulated add funds', 'Pending', 0, 9),
  t('TXN-7101', 'U-003', 'Credit', 10000, 'Demo welcome credit', 'Completed', -52, 14),
  t('TXN-7102', 'U-003', 'Credit', 2500, 'Demo claim (simulated)', 'Completed', -17),
  t('TXN-7103', 'U-003', 'Debit', 1200, 'Demo strategy allocation', 'Completed', -10),
  t('TXN-7104', 'U-003', 'Credit', 800, 'Simulated add funds', 'Failed', -3),
  t('TXN-7201', 'U-004', 'Credit', 10000, 'Demo welcome credit', 'Completed', -40, 11),
  t('TXN-7202', 'U-004', 'Debit', 2000, 'Demo strategy allocation', 'Completed', -12),
  t('TXN-7301', 'U-005', 'Credit', 10000, 'Demo welcome credit', 'Completed', -33, 16),
  t('TXN-7401', 'U-006', 'Credit', 10000, 'Demo welcome credit', 'Completed', -21, 12),
  t('TXN-7402', 'U-006', 'Credit', 4000, 'Simulated add funds', 'Pending', -1),
  t('TXN-7501', 'U-007', 'Credit', 10000, 'Demo welcome credit', 'Completed', -9, 18),
];

// SIMULATED KYC records. Only fictional / masked references are stored.
export const mockKycRecords = [
  { id: 'KYC-01', userId: 'U-003', reference: 'KYC-DEMO-4821', displayName: 'Ananya Iyer', docCategory: 'Demo ID Card', docReference: '••••••7731', status: 'Approved (Simulated)', submittedAt: at(-50, 12), updatedAt: at(-49, 10), remarks: 'Demo approval.' },
  { id: 'KYC-02', userId: 'U-004', reference: 'KYC-DEMO-5390', displayName: 'Vikram Desai', docCategory: 'Sample Membership Card', docReference: '••••••2210', status: 'Pending Review', submittedAt: at(-2, 15), updatedAt: at(-2, 15), remarks: '' },
  { id: 'KYC-03', userId: 'U-005', reference: 'KYC-DEMO-6012', displayName: 'Meera Nair', docCategory: 'Fictional Licence', docReference: '••••••0094', status: 'Rejected (Simulated)', submittedAt: at(-30, 11), updatedAt: at(-29, 9), remarks: 'Reference format did not match the demo pattern.' },
  { id: 'KYC-04', userId: 'U-006', reference: 'KYC-DEMO-7144', displayName: 'Kabir Sethi', docCategory: 'Demo ID Card', docReference: '••••••5582', status: 'Approved (Simulated)', submittedAt: at(-20, 13), updatedAt: at(-19, 17), remarks: 'Demo approval.' },
  { id: 'KYC-05', userId: 'U-007', reference: 'KYC-DEMO-8267', displayName: 'Sara Thomas', docCategory: 'Sample Membership Card', docReference: '••••••6619', status: 'Pending Review', submittedAt: at(-1, 19), updatedAt: at(-1, 19), remarks: '' },
];
