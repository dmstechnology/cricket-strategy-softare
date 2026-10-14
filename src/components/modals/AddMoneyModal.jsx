import { useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { Button, Field, Input, Modal, cx, useToast } from '../ui';
import { walletSummary } from '../../utils/calculations';
import { formatAmount } from '../../utils/formatters';
import { isValidNumber } from '../../utils/validation';

const PRESETS = [500, 1000, 2500, 5000];

// Simple "Add Money" pop-up. Demo money only — nothing is charged or transferred.
export default function AddMoneyModal({ open, onClose }) {
  const data = useAppData();
  const { user } = useAuth();
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const balance = walletSummary(data.transactions.filter((t) => t.userId === user.id)).balance;

  const close = () => {
    setAmount('');
    setError('');
    onClose();
  };

  const submit = (e) => {
    e?.preventDefault();
    const value = String(amount).trim();
    if (!isValidNumber(value) || Number(value) <= 0) return setError('Please enter an amount more than 0.');
    if (!/^\d+(\.\d{1,2})?$/.test(value)) return setError('Use numbers only, with up to 2 decimals.');
    if (Number(value) > 100000) return setError('You can add up to ₹1,00,000 at a time.');
    data.addTransaction({ userId: user.id, type: 'Credit', amount: Number(value), description: 'Added money (demo)', status: 'Completed' });
    toast(`${formatAmount(Number(value))} added to your wallet.`, 'success', 'Money added');
    close();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="sm"
      title="Add Money"
      footer={
        <>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button icon={Plus} onClick={submit}>Add Money</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-indigo-50 p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white"><Wallet className="h-5 w-5" /></span>
          <div>
            <p className="text-xs text-indigo-700">Current balance</p>
            <p className="text-lg font-bold tabular-nums text-slate-900">{formatAmount(balance)}</p>
          </div>
        </div>
        <Field label="How much do you want to add?" error={error}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
            <Input autoFocus inputMode="decimal" value={amount} onChange={(e) => { setAmount(e.target.value); setError(''); }} error={error} className="pl-7 text-lg" placeholder="0" />
          </div>
        </Field>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setAmount(String(p)); setError(''); }}
              className={cx('rounded-lg border py-2 text-sm font-medium transition', String(p) === amount ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}
            >
              ₹{p.toLocaleString('en-IN')}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">This is demo money for practice. No real payment is taken.</p>
      </form>
    </Modal>
  );
}
