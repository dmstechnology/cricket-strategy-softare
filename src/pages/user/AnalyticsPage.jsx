import { PageHeader } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import AnalyticsView from '../shared/AnalyticsView';

export default function AnalyticsPage() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Reports" description="Simple charts that show how you are doing." />
      <AnalyticsView userId={user.id} />
    </>
  );
}
