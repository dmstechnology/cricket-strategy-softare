import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, FlaskConical, LogOut, Menu, Plus, User, Wallet, X } from 'lucide-react';
import Sidebar from './Sidebar';
import { adminNav, userNav } from './navConfig';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { cx } from '../ui';
import { formatAmount, initials, timeAgo } from '../../utils/formatters';
import { walletSummary } from '../../utils/calculations';
import AddMoneyModal from '../modals/AddMoneyModal';

const TYPE_DOT = {
  info: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const handler = (e) => ref.current && !ref.current.contains(e.target) && onOutside();
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onOutside]);
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const data = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bannerHidden, setBannerHidden] = useState(false);
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const bellRef = useRef(null);
  const menuRef = useRef(null);
  useClickOutside(bellRef, () => setBellOpen(false));
  useClickOutside(menuRef, () => setMenuOpen(false));

  const isAdmin = user.role === 'admin';
  const base = isAdmin ? '/admin' : '/user';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const notifications = data.notificationsFor(user);
  const unread = notifications.filter((n) => !n.readBy.includes(user.id));

  const nav = useMemo(() => {
    if (isAdmin) return adminNav;
    return userNav.map((g) => ({
      ...g,
      items: g.items.filter((i) => !i.strategyKey || data.isStrategyEnabled(i.strategyKey)),
    }));
  }, [isAdmin, data]);

  const balance = isAdmin ? 0 : walletSummary(data.transactions.filter((t) => t.userId === user.id)).balance;

  const badges = {
    notifications: unread.length,
    kyc: data.kycRecords.filter((k) => k.status === 'Pending Review').length,
    claims: data.claims.filter((c) => c.status === 'Submitted' || c.status === 'Under Review').length,
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openNotification = (n) => {
    data.markRead(user.id, n.id);
    setBellOpen(false);
    navigate(n.link && !isAdmin === n.link.startsWith('/user') ? n.link : `${base}/notifications`);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar
        nav={nav}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        badges={badges}
        role={user.role}
      />
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className={cx('hidden items-center gap-2', isAdmin ? 'sm:flex' : 'lg:flex')}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                <FlaskConical className="h-3.5 w-3.5" /> Demo mode — simulated data
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              {!isAdmin && (
                <button
                  onClick={() => setAddMoneyOpen(true)}
                  className="group flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 py-1 pl-1 pr-1 text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 sm:pr-1.5"
                  title="Wallet balance — click to add money"
                  aria-label={`Wallet balance ${formatAmount(balance)}. Add money`}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-bold tabular-nums">{formatAmount(balance, { decimals: 0 })}</span>
                  <span className="flex h-6 items-center gap-0.5 rounded-full bg-white px-2 text-xs font-semibold text-emerald-700 shadow-sm group-hover:bg-emerald-600 group-hover:text-white">
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Add</span>
                  </span>
                </button>
              )}
              <div className="relative" ref={bellRef}>
                <button
                  onClick={() => setBellOpen((o) => !o)}
                  className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unread.length > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unread.length > 9 ? '9+' : unread.length}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <div className="animate-modal-in absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">Notifications</p>
                      {unread.length > 0 && (
                        <button
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                          onClick={() => data.markAllRead(user.id, unread.map((n) => n.id))}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto scrollbar-thin">
                      {notifications.slice(0, 8).map((n) => {
                        const isUnread = !n.readBy.includes(user.id);
                        return (
                          <li key={n.id}>
                            <button
                              onClick={() => openNotification(n)}
                              className={cx('flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50', isUnread && 'bg-indigo-50/40')}
                            >
                              <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', TYPE_DOT[n.type] || 'bg-slate-400')} />
                              <span className="min-w-0 flex-1">
                                <span className={cx('block truncate text-sm', isUnread ? 'font-semibold text-slate-900' : 'text-slate-700')}>{n.title}</span>
                                <span className="line-clamp-2 block text-xs text-slate-500">{n.message}</span>
                                <span className="mt-0.5 block text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                      {!notifications.length && <li className="px-4 py-8 text-center text-sm text-slate-500">No notifications</li>}
                    </ul>
                    <Link
                      to={`${base}/notifications`}
                      onClick={() => setBellOpen(false)}
                      className="block border-t border-slate-100 px-4 py-2.5 text-center text-sm font-medium text-indigo-600 hover:bg-slate-50"
                    >
                      View all
                    </Link>
                  </div>
                )}
              </div>
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100">
                  <span className={cx('flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white', isAdmin ? 'bg-violet-600' : 'bg-indigo-600')}>
                    {initials(user.name)}
                  </span>
                  <span className="hidden text-left md:block">
                    <span className="block text-sm font-semibold leading-tight text-slate-800">{user.name}</span>
                    <span className="block text-xs capitalize leading-tight text-slate-500">{user.role}</span>
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
                </button>
                {menuOpen && (
                  <div className="animate-modal-in absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                    <div className="border-b border-slate-100 px-4 py-2.5">
                      <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                      <p className="truncate text-xs text-slate-500">@{user.username}</p>
                    </div>
                    {!isAdmin && (
                      <Link to="/user/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <User className="h-4 w-4" /> My Profile
                      </Link>
                    )}
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        {data.settings.showDemoBanner && !bannerHidden && (
          <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 sm:px-6">
            <FlaskConical className="h-4 w-4 shrink-0 text-amber-600" />
            <span className="flex-1">
              {isAdmin ? (
                <>
                  <strong>Frontend demonstration.</strong> No real money, betting, payments, identity verification or payouts are processed.
                  Match data is fictional or manually entered. Data resets when the page is refreshed.
                </>
              ) : (
                <>
                  <strong>Practice app.</strong> All money is demo money — no real betting or payments.
                </>
              )}
            </span>
            <button onClick={() => setBannerHidden(true)} className="rounded p-0.5 hover:bg-amber-100" aria-label="Hide notice">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {!isAdmin && <AddMoneyModal open={addMoneyOpen} onClose={() => setAddMoneyOpen(false)} />}
        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
