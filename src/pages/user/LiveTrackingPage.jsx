import { PageHeader } from '../../components/ui';
import { StrategyGate } from '../../routes/guards';
import LiveTrackingView from '../shared/LiveTrackingView';

export default function LiveTrackingPage() {
  return (
    <>
      <PageHeader title="Match Notes" description="Write down the score and what you see during a match." />
      <StrategyGate strategyKey="live-tracking">
        <LiveTrackingView />
      </StrategyGate>
    </>
  );
}
