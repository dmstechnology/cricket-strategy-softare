import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { HomeRedirect, PublicOnly, RequireRole } from './guards';

import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';

import DashboardPage from '../pages/user/DashboardPage';
import MatchesPage from '../pages/user/MatchesPage';
import MatchDetailsPage from '../pages/user/MatchDetailsPage';
import StrategyCenterPage from '../pages/user/StrategyCenterPage';
import EntryCheckPage from '../pages/user/EntryCheckPage';
import LiveTrackingPage from '../pages/user/LiveTrackingPage';
import BookProfitPage from '../pages/user/BookProfitPage';
import LossCutPage from '../pages/user/LossCutPage';
import PnlPage from '../pages/user/PnlPage';
import AnalyticsPage from '../pages/user/AnalyticsPage';
import WalletPage from '../pages/user/WalletPage';
import KycPage from '../pages/user/KycPage';
import ClaimsPage from '../pages/user/ClaimsPage';
import ClaimHistoryPage from '../pages/user/ClaimHistoryPage';
import NotificationsPage from '../pages/user/NotificationsPage';
import ProfilePage from '../pages/user/ProfilePage';

import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import UsersPage from '../pages/admin/UsersPage';
import MatchManagementPage from '../pages/admin/MatchManagementPage';
import StrategyManagementPage from '../pages/admin/StrategyManagementPage';
import LiveUpdatesPage from '../pages/admin/LiveUpdatesPage';
import StrategyRecordsPage from '../pages/admin/StrategyRecordsPage';
import PnlReportsPage from '../pages/admin/PnlReportsPage';
import RiskManagementPage from '../pages/admin/RiskManagementPage';
import KycManagementPage from '../pages/admin/KycManagementPage';
import ClaimManagementPage from '../pages/admin/ClaimManagementPage';
import TransactionsPage from '../pages/admin/TransactionsPage';
import AdminAnalyticsPage from '../pages/admin/AdminAnalyticsPage';
import AdminNotificationsPage from '../pages/admin/AdminNotificationsPage';
import SettingsPage from '../pages/admin/SettingsPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route element={<RequireRole role="user" />}>
        <Route path="/user" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="matches" element={<MatchesPage />} />
          <Route path="matches/:id" element={<MatchDetailsPage />} />
          <Route path="strategies" element={<StrategyCenterPage />} />
          <Route path="strategies/right-entry" element={<EntryCheckPage />} />
          <Route path="strategies/live-tracking" element={<LiveTrackingPage />} />
          <Route path="strategies/book-profit" element={<BookProfitPage />} />
          <Route path="strategies/loss-cut" element={<LossCutPage />} />
          <Route path="pnl" element={<PnlPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="kyc" element={<KycPage />} />
          <Route path="claims" element={<ClaimsPage />} />
          <Route path="claims/history" element={<ClaimHistoryPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
        </Route>
      </Route>

      <Route element={<RequireRole role="admin" />}>
        <Route path="/admin" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="matches" element={<MatchManagementPage />} />
          <Route path="strategies" element={<StrategyManagementPage />} />
          <Route path="live-updates" element={<LiveUpdatesPage />} />
          <Route path="strategy-records" element={<StrategyRecordsPage />} />
          <Route path="pnl-reports" element={<PnlReportsPage />} />
          <Route path="risk-management" element={<RiskManagementPage />} />
          <Route path="kyc" element={<KycManagementPage />} />
          <Route path="claims" element={<ClaimManagementPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
