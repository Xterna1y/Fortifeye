import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Mic,
  Bell,
  Activity,
  TrendingUp,
  Eye
} from 'lucide-react';
import GlassPanel from '../../components/ui/GlassPanel';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import useGuardianLinking from '../../hooks/useGuardianLinking';
import { getDashboardData, type DashboardData } from '../../services/dashboardService';

const defaultDashboard: DashboardData = {
  stats: {
    protected: 0,
    blocked: 0,
    verified: 0,
    alerts: 0,
  },
  recentAlerts: [],
  summary: {
    messagesAnalyzed: 0,
    callsScreened: 0,
    threatsBlocked: 0,
    safeTransactions: 0,
  },
  riskOverview: {
    level: 'High',
    safeScore: 100,
  },
  guardian: {
    hasGuardian: false,
  },
  safetyTip:
    'Banks will never ask for your password or PIN via phone or message. Always verify requests through official channels.',
};

function formatRelativeTime(timestamp: string) {
  const time = new Date(timestamp).getTime();
  if (!time) {
    return 'Just now';
  }

  const diffMs = Date.now() - time;
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { linkedAccounts, pendingIncomingRequests } = useGuardianLinking();
  const [dashboard, setDashboard] = useState<DashboardData>(defaultDashboard);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const storedUser = localStorage.getItem('fortifeye.user');
        const currentUser = storedUser ? JSON.parse(storedUser) : null;

        if (!currentUser?.id) {
          setDashboard(defaultDashboard);
          return;
        }

        const data = await getDashboardData(currentUser.id);
        setDashboard(data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoadingDashboard(false);
      }
    };

    loadDashboard();
  }, []);

  const hasGuardian =
    linkedAccounts.some((account) => account.role === 'guardian') ||
    dashboard.guardian.hasGuardian;

  const notificationItems = useMemo(() => {
    const requestItems = pendingIncomingRequests.map((request) => ({
      id: `request-${request.id}`,
      kind: 'request' as const,
      type: 'warning' as const,
      title: request.requesterName || request.requesterEmail || 'Guardian link request',
      message:
        request.requesterRole === 'guardian'
          ? 'Guardian access request pending your review.'
          : 'Dependent access request pending your review.',
      createdAt: request.createdAt,
      actionLabel: 'Review request',
      actionPath: '/guardian-link',
    }));

    const alertItems = dashboard.recentAlerts.map((alert) => ({
      id: `alert-${alert.id}`,
      kind: 'alert' as const,
      type: alert.type,
      title:
        alert.type === 'danger'
          ? 'Threat blocked'
          : alert.type === 'warning'
            ? 'Action requires attention'
            : 'Protected activity verified',
      message: alert.message,
      createdAt: alert.createdAt,
      actionLabel: 'Open details',
      actionPath: '/guardian',
    }));

    return [...requestItems, ...alertItems].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }, [dashboard.recentAlerts, pendingIncomingRequests]);

  const stats = [
    { label: 'Protected', value: dashboard.stats.protected.toLocaleString(), icon: Shield, color: 'text-cyan-400' },
    { label: 'Blocked', value: dashboard.stats.blocked.toLocaleString(), icon: XCircle, color: 'text-red-400' },
    { label: 'Verified', value: dashboard.stats.verified.toLocaleString(), icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Alerts', value: dashboard.stats.alerts.toLocaleString(), icon: Bell, color: 'text-amber-400' },
  ];

  const handleStartAnalysis = () => {
    navigate('/input');
  };

  const handleNotificationsWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const container = notificationsRef.current;
    if (!container) {
      return;
    }

    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return;
    }

    event.preventDefault();
    container.scrollBy({
      left: event.deltaY,
      behavior: 'smooth',
    });
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Welcome back!"
        description="Your AI-powered financial guardian is always watching."
      />

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
              Notification Bar
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Scroll with your mouse wheel to move through live requests and alerts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/guardian')}
            className="text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300"
          >
            View all
          </button>
        </div>

        <div
          ref={notificationsRef}
          onWheel={handleNotificationsWheel}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700/70"
        >
          {notificationItems.length === 0 ? (
            <GlassPanel className="min-w-full border border-slate-700/50 bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800/80">
                  <Bell className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-white">No new notifications</p>
                  <p className="text-sm text-slate-400">
                    {isLoadingDashboard ? 'Syncing live activity...' : 'Alerts, requests, and reviews will appear here.'}
                  </p>
                </div>
              </div>
            </GlassPanel>
          ) : (
            notificationItems.map((item) => (
              <GlassPanel
                key={item.id}
                className={`min-w-[20rem] flex-1 border ${
                  item.type === 'danger'
                    ? 'border-red-500/30 bg-red-500/10'
                    : item.type === 'warning'
                      ? 'border-amber-500/30 bg-amber-500/10'
                      : 'border-emerald-500/30 bg-emerald-500/10'
                }`}
              >
                <div className="flex h-full flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 flex h-10 w-10 items-center justify-center rounded-2xl ${
                          item.type === 'danger'
                            ? 'bg-red-500/20'
                            : item.type === 'warning'
                              ? 'bg-amber-500/20'
                              : 'bg-emerald-500/20'
                        }`}
                      >
                        {item.type === 'danger' ? (
                          <XCircle className="h-5 w-5 text-red-400" />
                        ) : item.type === 'warning' ? (
                          <AlertTriangle className="h-5 w-5 text-amber-400" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-300">{item.message}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      {item.kind === 'request' ? 'Request' : 'Notification'}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(item.actionPath)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-white/10"
                    >
                      {item.actionLabel}
                    </button>
                  </div>
                </div>
              </GlassPanel>
            ))
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 mb-8 md:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            iconClassName={stat.color}
            iconWrapperClassName="bg-transparent"
            valueClassName="mb-1"
            className="backdrop-blur-sm"
            trailing={<TrendingUp className="h-4 w-4 text-emerald-400" />}
          />
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <GlassPanel padding="lg" className="bg-gradient-to-br from-slate-800/80 to-slate-800/40">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                <Activity className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Scam Detection</h2>
                <p className="text-sm text-slate-400">Analyze messages or calls for potential scams</p>
              </div>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              <button
                onClick={handleStartAnalysis}
                className="group rounded-xl border border-slate-700/50 bg-slate-900/50 p-6 text-left transition-all hover:border-cyan-500/50 hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 transition-transform group-hover:scale-110">
                    <MessageSquare className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-white">Text Analysis</h3>
                    <p className="text-sm text-slate-400">Paste a message to analyze</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleStartAnalysis}
                className="group rounded-xl border border-slate-700/50 bg-slate-900/50 p-6 text-left transition-all hover:border-emerald-500/50 hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 transition-transform group-hover:scale-110">
                    <Mic className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-white">Voice Analysis</h3>
                    <p className="text-sm text-slate-400">Record a voice message</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="border-t border-slate-700/50 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-white">Recent Alerts</h3>
                <button className="text-sm text-cyan-400 transition-colors hover:text-cyan-300">
                  View all
                </button>
              </div>
              <div className="space-y-3">
                {dashboard.recentAlerts.length === 0 ? (
                  <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 text-sm text-slate-400">
                    {isLoadingDashboard ? 'Loading recent activity...' : 'No recent activity found yet.'}
                  </div>
                ) : (
                  dashboard.recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-center gap-3 rounded-xl p-3 ${
                        alert.type === 'danger'
                          ? 'border border-red-500/20 bg-red-500/10'
                          : alert.type === 'warning'
                            ? 'border border-amber-500/20 bg-amber-500/10'
                            : 'border border-emerald-500/20 bg-emerald-500/10'
                      }`}
                    >
                      {alert.type === 'danger' ? (
                        <XCircle className="h-5 w-5 text-red-400" />
                      ) : alert.type === 'warning' ? (
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-white">{alert.message}</p>
                        <p className="text-xs text-slate-500">{formatRelativeTime(alert.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="backdrop-blur-sm">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
              <Eye className="h-5 w-5 text-cyan-400" />
              Risk Overview
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-slate-400">Protection Level</span>
                  <span className="font-medium text-emerald-400">{dashboard.riskOverview.level}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                    style={{ width: `${dashboard.riskOverview.safeScore}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{dashboard.riskOverview.safeScore}%</p>
                <p className="text-xs text-slate-400">Safe Score</p>
              </div>
            </div>
          </GlassPanel>
        </div>

        <div className="space-y-6">
          {pendingIncomingRequests.length > 0 && (
            <GlassPanel className="border-amber-500/30 bg-amber-500/10">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
                  <Bell className="h-5 w-5 animate-bounce text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Link Request</h3>
                  <p className="text-xs text-slate-400">You have a new connection request</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/guardian-link')}
                className="w-full rounded-xl bg-amber-500 py-3 font-medium text-white transition-all hover:bg-amber-600"
              >
                View Requests
              </button>
            </GlassPanel>
          )}

          {!hasGuardian && (
            <GlassPanel className="backdrop-blur-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
                  <Bell className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Guardian Mode</h3>
                  <p className="text-xs text-slate-400">Add a trusted person to review risky activity</p>
                </div>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-slate-300">
                Link a guardian to this account so they can help approve or block suspicious actions later.
              </p>
              <button
                type="button"
                onClick={() => navigate('/guardian-link')}
                className="w-full rounded-xl border border-amber-500/30 bg-amber-500/20 py-3 font-medium text-amber-300 transition-all hover:bg-amber-500/30"
              >
                Configure Guardian
              </button>
            </GlassPanel>
          )}

          <GlassPanel className="backdrop-blur-sm">
            <h3 className="mb-4 font-semibold text-white">Today's Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Messages Analyzed</span>
                <span className="font-medium text-white">{dashboard.summary.messagesAnalyzed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Calls Screened</span>
                <span className="font-medium text-white">{dashboard.summary.callsScreened}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Threats Blocked</span>
                <span className="font-medium text-red-400">{dashboard.summary.threatsBlocked}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Safe Transactions</span>
                <span className="font-medium text-emerald-400">{dashboard.summary.safeTransactions}</span>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10">
            <h3 className="mb-3 font-semibold text-white">💡 Safety Tip</h3>
            <p className="text-sm leading-relaxed text-slate-300">{dashboard.safetyTip}</p>
          </GlassPanel>
        </div>
      </div>
    </main>
  );
}
