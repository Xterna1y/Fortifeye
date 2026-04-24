import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Bell,
  CheckCircle,
  Eye,
  MessageSquare,
  Mic,
  Shield,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import GlassPanel from '../../components/ui/GlassPanel';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import useGuardianLinking from '../../hooks/useGuardianLinking';
import {
  getGuardianTransactionRequests,
  type TransactionRequest,
} from '../../services/transactionRequestService';
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

type DashboardNotification = {
  id: string;
  title: string;
  description: string;
  timestamp?: string;
  path: string;
  tone: 'cyan' | 'amber' | 'emerald' | 'red';
  kind: 'linking' | 'transaction';
};

function formatRelativeTime(timestamp?: string) {
  if (!timestamp) {
    return 'Just now';
  }

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

function NotificationPanel({
  notifications,
  onOpen,
}: {
  notifications: DashboardNotification[];
  onOpen: (path: string) => void;
}) {
  return (
    <GlassPanel className="backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20">
          <Bell className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Alerts</h3>
          <p className="text-xs text-slate-400">
            Incoming linking and transaction requests appear here.
          </p>
        </div>
      </div>

      <div className="-mr-2 max-h-[26rem] space-y-3 overflow-y-auto pr-2">
        {notifications.length === 0 ? (
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-6 text-sm text-slate-400">
            No request yet.
          </div>
        ) : (
          notifications.map((notification) => {
            const toneClasses =
              notification.tone === 'emerald'
                ? 'border-emerald-500/20 bg-emerald-500/10 hover:border-emerald-400/30'
                : notification.tone === 'red'
                  ? 'border-red-500/20 bg-red-500/10 hover:border-red-400/30'
                  : notification.tone === 'amber'
                    ? 'border-amber-500/20 bg-amber-500/10 hover:border-amber-400/30'
                    : 'border-cyan-500/20 bg-slate-950/40 hover:border-cyan-400/30';

            const badgeClasses =
              notification.tone === 'emerald'
                ? 'bg-emerald-500/15 text-emerald-300'
                : notification.tone === 'red'
                  ? 'bg-red-500/15 text-red-300'
                  : notification.tone === 'amber'
                    ? 'bg-amber-500/15 text-amber-300'
                    : 'bg-cyan-500/15 text-cyan-300';

            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => onOpen(notification.path)}
                className={`w-full rounded-xl border p-4 text-left transition-all ${toneClasses}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${badgeClasses}`}
                  >
                    {notification.kind}
                  </span>
                </div>
                <p className="font-medium text-white">{notification.title}</p>
                <p className="mt-1 text-sm text-slate-300">{notification.description}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {formatRelativeTime(notification.timestamp)}
                </p>
              </button>
            );
          })
        )}
      </div>
    </GlassPanel>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { pendingIncomingRequests, currentRole } = useGuardianLinking();
  const [dashboard, setDashboard] = useState<DashboardData>(defaultDashboard);
  const [guardianRequests, setGuardianRequests] = useState<TransactionRequest[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const storedUser = localStorage.getItem('fortifeye.user');
        const currentUser = storedUser ? JSON.parse(storedUser) : null;

        if (!currentUser?.id) {
          setDashboard(defaultDashboard);
          setGuardianRequests([]);
          return;
        }

        const dashboardPromise = getDashboardData(currentUser.id);
        const guardianRequestsPromise =
          currentRole === 'guardian'
            ? getGuardianTransactionRequests(currentUser.id)
            : Promise.resolve([]);

        const [dashboardData, fetchedGuardianRequests] = await Promise.all([
          dashboardPromise,
          guardianRequestsPromise,
        ]);

        setDashboard(dashboardData);
        setGuardianRequests(fetchedGuardianRequests);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    loadDashboard();
  }, [currentRole]);

  const stats = [
    {
      label: 'Protected',
      value: dashboard.stats.protected.toLocaleString(),
      icon: Shield,
      color: 'text-cyan-400',
    },
    {
      label: 'Blocked',
      value: dashboard.stats.blocked.toLocaleString(),
      icon: XCircle,
      color: 'text-red-400',
    },
    {
      label: 'Verified',
      value: dashboard.stats.verified.toLocaleString(),
      icon: CheckCircle,
      color: 'text-emerald-400',
    },
    {
      label: 'Alerts',
      value: dashboard.stats.alerts.toLocaleString(),
      icon: Bell,
      color: 'text-amber-400',
    },
  ];

  const dashboardNotifications = useMemo<DashboardNotification[]>(() => {
    const linkingNotifications = pendingIncomingRequests.map((request) => ({
      id: `link-${request.id}`,
      title: request.requesterName || request.requesterEmail || request.requesterSerial,
      description: `Wants to connect as ${
        request.requesterRole === 'guardian' ? 'your guardian' : 'your dependent'
      }.`,
      timestamp: request.createdAt,
      path: '/guardian-link',
      tone: 'cyan' as const,
      kind: 'linking' as const,
    }));

    const transactionNotifications =
      currentRole === 'guardian'
        ? guardianRequests
            .filter((request) => request.status === 'pending')
            .map((request) => ({
              id: `transaction-${request.id}`,
              title: request.title || 'Incoming transaction request',
              description: request.message || 'A linked dependent needs your review.',
              timestamp: request.createdAt,
              path: '/guardian?tab=requests',
              tone: 'amber' as const,
              kind: 'transaction' as const,
            }))
        : [];

    return [...linkingNotifications, ...transactionNotifications].sort(
      (first, second) =>
        new Date(second.timestamp || 0).getTime() - new Date(first.timestamp || 0).getTime(),
    );
  }, [currentRole, guardianRequests, pendingIncomingRequests]);

  const handleStartAnalysis = () => {
    navigate('/input');
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Welcome back!"
        description="Your AI-powered financial guardian is always watching."
      />

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
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
          <GlassPanel
            padding="lg"
            className="bg-gradient-to-br from-slate-800/80 to-slate-800/40"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                <Activity className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Scam Detection</h2>
                <p className="text-sm text-slate-400">
                  Analyze messages or calls for potential scams
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                  <span className="font-medium text-emerald-400">
                    {dashboard.riskOverview.level}
                  </span>
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
          <NotificationPanel
            notifications={dashboardNotifications}
            onOpen={(path) => navigate(path)}
          />

          <GlassPanel className="backdrop-blur-sm">
            <h3 className="mb-4 font-semibold text-white">Today's Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Messages Analyzed</span>
                <span className="font-medium text-white">
                  {dashboard.summary.messagesAnalyzed}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Calls Screened</span>
                <span className="font-medium text-white">
                  {dashboard.summary.callsScreened}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Threats Blocked</span>
                <span className="font-medium text-red-400">
                  {dashboard.summary.threatsBlocked}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Safe Transactions</span>
                <span className="font-medium text-emerald-400">
                  {dashboard.summary.safeTransactions}
                </span>
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
