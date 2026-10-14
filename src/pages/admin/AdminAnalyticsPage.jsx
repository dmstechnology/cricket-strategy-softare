import { PageHeader } from '../../components/ui';
import AnalyticsView from '../shared/AnalyticsView';

export default function AdminAnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics & Reports" description="Platform-wide analytics across all demo users." />
      <AnalyticsView />
    </>
  );
}
