import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { Card, EmptyState, Button } from '../components/ui';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export function RequireRole({ role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  return <Outlet />;
}

export function PublicOnly() {
  const { user } = useAuth();
  if (user) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  return <Outlet />;
}

export function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
}

// Shows a friendly notice when the admin has disabled a strategy module.
export function StrategyGate({ strategyKey, children }) {
  const { isStrategyEnabled, coreStrategies } = useAppData();
  if (isStrategyEnabled(strategyKey)) return children;
  const s = coreStrategies.find((x) => x.key === strategyKey);
  return (
    <Card>
      <EmptyState
        icon={Lock}
        title="This feature is turned off"
        message="The admin has turned this feature off for now. Please try again later."
        action={
          <Link to="/user/dashboard">
            <Button variant="secondary">Back to Home</Button>
          </Link>
        }
      />
    </Card>
  );
}
