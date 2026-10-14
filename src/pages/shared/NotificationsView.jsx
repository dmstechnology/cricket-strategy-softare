import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, CheckCheck, CheckCircle2, Info, Megaphone, XCircle } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { Badge, Button, Card, EmptyState, Tabs, cx } from '../../components/ui';
import { formatDateTime, timeAgo } from '../../utils/formatters';

const ICONS = {
  info: { icon: Info, cls: 'bg-blue-50 text-blue-600' },
  success: { icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-600' },
  warning: { icon: AlertTriangle, cls: 'bg-amber-50 text-amber-600' },
  danger: { icon: XCircle, cls: 'bg-red-50 text-red-600' },
};

export default function NotificationsView() {
  const data = useAppData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');

  const all = data.notificationsFor(user);
  const unread = all.filter((n) => !n.readBy.includes(user.id));
  const list = tab === 'unread' ? unread : tab === 'announcements' ? all.filter((n) => n.kind === 'announcement') : all;
  const home = user.role === 'admin' ? '/admin' : '/user';

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'all', label: 'All', count: all.length },
            { value: 'unread', label: 'Unread', count: unread.length },
            { value: 'announcements', label: 'Announcements' },
          ]}
        />
        <Button variant="secondary" size="sm" icon={CheckCheck} disabled={!unread.length} onClick={() => data.markAllRead(user.id, unread.map((n) => n.id))}>
          Mark all as read
        </Button>
      </div>
      {list.length ? (
        <ul className="divide-y divide-slate-100">
          {list.map((n) => {
            const s = ICONS[n.type] || ICONS.info;
            const Icon = n.kind === 'announcement' ? Megaphone : s.icon;
            const isUnread = !n.readBy.includes(user.id);
            const linkOk = n.link && n.link.startsWith(home);
            return (
              <li key={n.id} className={cx('flex gap-4 px-5 py-4', isUnread && 'bg-indigo-50/30')}>
                <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', s.cls)}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cx('text-sm', isUnread ? 'font-semibold text-slate-900' : 'font-medium text-slate-700')}>{n.title}</p>
                    {n.kind === 'announcement' && <Badge tone="violet">Announcement</Badge>}
                    {isUnread && <span className="h-2 w-2 rounded-full bg-indigo-500" />}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                  <p className="mt-1 text-xs text-slate-400" title={formatDateTime(n.createdAt)}>
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {linkOk && (
                    <Button size="xs" variant="soft" onClick={() => { data.markRead(user.id, n.id); navigate(n.link); }}>
                      Open
                    </Button>
                  )}
                  {isUnread && (
                    <Button size="xs" variant="ghost" onClick={() => data.markRead(user.id, n.id)}>
                      Mark read
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={Bell} title="You're all caught up" message="New notifications will appear here." />
      )}
    </Card>
  );
}
