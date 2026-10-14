import { PageHeader } from '../../components/ui';
import LiveTrackingView from '../shared/LiveTrackingView';

export default function LiveUpdatesPage() {
  return (
    <>
      <PageHeader title="Live Match Updates" description="Add simulated score updates, observations and status changes, and review each match's chronological timeline." />
      <LiveTrackingView admin />
    </>
  );
}
