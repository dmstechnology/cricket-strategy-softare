import {
  LayoutDashboard, CalendarDays, Crosshair, Activity, Target, Calculator, ShieldAlert,
  BarChart3, Wallet, BadgeCheck, FileText, History, Bell, User, Users, Trophy, Settings2, Radio,
  ClipboardList, LineChart, ShieldCheck, Receipt, Megaphone, Settings,
} from 'lucide-react';

// User menu uses plain, everyday names. strategyKey hides the item when the
// admin disables that strategy module.
export const userNav = [
  {
    section: 'Main',
    items: [
      { label: 'Home', to: '/user/dashboard', icon: LayoutDashboard },
      { label: 'Matches', to: '/user/matches', icon: CalendarDays },
    ],
  },
  {
    section: 'My Plays',
    items: [
      { label: 'Entry Check', to: '/user/strategies/right-entry', icon: Crosshair, strategyKey: 'right-entry' },
      { label: 'Match Notes', to: '/user/strategies/live-tracking', icon: Activity, strategyKey: 'live-tracking' },
      { label: 'Book Profit', to: '/user/strategies/book-profit', icon: Target, strategyKey: 'book-profit' },
      { label: 'Profit & Loss', to: '/user/pnl', icon: Calculator },
      { label: 'Loss Limit', to: '/user/strategies/loss-cut', icon: ShieldAlert, strategyKey: 'loss-cut' },
      { label: 'Reports', to: '/user/analytics', icon: BarChart3 },
    ],
  },
  {
    section: 'Money & Account',
    items: [
      { label: 'Wallet', to: '/user/wallet', icon: Wallet },
      { label: 'Verify ID', to: '/user/kyc', icon: BadgeCheck },
      { label: 'Claim Money', to: '/user/claims', icon: FileText, end: true },
      { label: 'My Claims', to: '/user/claims/history', icon: History },
      { label: 'Notifications', to: '/user/notifications', icon: Bell, badge: 'notifications' },
      { label: 'Profile', to: '/user/profile', icon: User },
    ],
  },
];

export const adminNav = [
  {
    section: 'Overview',
    items: [
      { label: 'Admin Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Analytics & Reports', to: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    section: 'Management',
    items: [
      { label: 'User Management', to: '/admin/users', icon: Users },
      { label: 'Match Management', to: '/admin/matches', icon: Trophy },
      { label: 'Strategy Management', to: '/admin/strategies', icon: Settings2 },
      { label: 'Live Match Updates', to: '/admin/live-updates', icon: Radio },
      { label: 'Strategy Records', to: '/admin/strategy-records', icon: ClipboardList },
      { label: 'P&L Reports', to: '/admin/pnl-reports', icon: LineChart },
      { label: 'Risk Management', to: '/admin/risk-management', icon: ShieldAlert },
    ],
  },
  {
    section: 'Operations (Demo)',
    items: [
      { label: 'KYC Management', to: '/admin/kyc', icon: ShieldCheck, badge: 'kyc' },
      { label: 'Claim Management', to: '/admin/claims', icon: FileText, badge: 'claims' },
      { label: 'Demo Transactions', to: '/admin/transactions', icon: Receipt },
      { label: 'Notifications', to: '/admin/notifications', icon: Megaphone, badge: 'notifications' },
      { label: 'Settings', to: '/admin/settings', icon: Settings },
    ],
  },
];
