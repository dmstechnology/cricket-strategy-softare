import { PageHeader } from '../../components/ui';
import NotificationsView from '../shared/NotificationsView';

export default function NotificationsPage() {
  return (
    <>
      <PageHeader title="Notifications" description="Messages from the admin and updates about your account." />
      <NotificationsView />
    </>
  );
}
