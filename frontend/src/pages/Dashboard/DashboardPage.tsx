import { useMemo, useState } from 'react';
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
  Eye,
} from 'lucide-react';
import GlassPanel from '../../components/ui/GlassPanel';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import useGuardianLinking from '../../hooks/useGuardianLinking';
import useTransactionRequests from '../../hooks/useTransactionRequests';

interface Alert {
  id: number;
  type: 'warning' | 'danger' | 'success';
  message: string;
  time: string;
}

interface DashboardNotification {
  id: string;
  type: 'link' | 'transaction';
  title: string;
  description: string;
  timestamp: string;
  actionLabel: string;
  actionPath: string;
  tone: 'cyan' | 'emerald' | 'amber' | 'red';
}

function formatTimestamp(value?: string) {
  if (!value) {
    return 'Just now';
  }

  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
}

function sortNotifications(notifications: DashboardNotification[]) {
  return [...notifications].sort(
    (first, second) => new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime(),
  );
}

function NotificationPanel({
  emptyState,
  notifications,
  onNavigate,
}: {
  emptyState: string;
  notifications: DashboardNotification[];
  onNavigate: (path: string) => void;
}) {
  return (
    <GlassPanel className="backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20">
          <Bell className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Notifications</h3>
          <p className="text-xs text-slate-400">
            Latest linking and transaction activity appears here
          </p>
        </div>
      </div>

      <div className="-mr-2 max-h-[28rem] space-y-3 overflow-y-auto pr-3">
        {notifications.length === 0 ? (
          <p className="text-sm leading-relaxed text-slate-300">{emptyState}</p>
        ) : (
          notifications.map((notification) => {
            const containerClassName =
              notification.tone === 'emerald'
                ? 'border-emerald-500/20 bg-emerald-500/10 hover:border-emerald-400/30 hover:bg-emerald-500/15'
                : notification.tone === 'red'
                  ? 'border-red-500/20 bg-red-500/10 hover:border-red-400/30 hover:bg-red-500/15'
                  : notification.tone === 'amber'
                    ? 'border-amber-500/20 bg-slate-900/50 hover:border-amber-400/30 hover:bg-slate-800/60'
                    : 'border-cyan-500/20 bg-slate-950/30 hover:border-cyan-400/40 hover:bg-slate-900/50';

            const badgeClassName =
              notification.tone === 'emerald'
                ? 'bg-emerald-500/15 text-emerald-300'
                : notification.tone === 'red'
                  ? 'bg-red-500/15 text-red-300'
                  : notification.tone === 'amber'
                    ? 'bg-amber-500/15 text-amber-300'
                    : 'bg-cyan-500/15 text-cyan-300';

            const actionClassName =
              notification.tone === 'emerald'
                ? 'text-emerald-300'
                : notification.tone === 'red'
                  ? 'text-red-300'
                  : notification.tone === 'amber'
                    ? 'text-amber-300'
                    : 'text-cyan-300';

            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => onNavigate(notification.actionPath)}
                className={`w-full rounded-xl border p-4 text-left transition-all ${containerClassName}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${badgeClassName}`}
                  >
                    {notification.type === 'transaction' ? 'Transaction' : 'Linking'}
                  </span>
                </div>
                <p className="font-medium text-white">{notification.title}</p>
                <p className="mt-1 text-sm text-slate-300">{notification.description}</p>
                <p className="mt-1 text-xs text-slate-500">{formatTimestamp(notification.timestamp)}</p>
                <p className={`mt-3 text-xs font-medium uppercase tracking-[0.18em] ${actionClassName}`}>
                  {notification.actionLabel}
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
  const {
    currentRole,
    pendingIncomingRequests,
    pendingOutgoingRequests,
    linkedAccounts,
  } = useGuardianLinking();
  const { requests: transactionRequests } = useTransactionRequests();
  const [recentAlerts] = useState<Alert[]>([
    { id: 1, type: 'danger', message: 'High risk transaction detected', time: '2 min ago' },
    { id: 2, type: 'warning', message: 'Unusual login attempt blocked', time: '15 min ago' },
    { id: 3, type: 'success', message: 'Safe transaction verified', time: '1 hour ago' },
  ]);

  const stats = [
    { label: 'Protected', value: '12,847', icon: Shield, color: 'text-cyan-400' },
    { label: 'Blocked', value: '1,239', icon: XCircle, color: 'text-red-400' },
    { label: 'Verified', value: '8,562', icon: CheckCircle, color: 'text-emerald-400' },
    { label: 'Alerts', value: '23', icon: Bell, color: 'text-amber-400' },
  ];

  const handleStartAnalysis = () => {
    navigate('/input');
  };

  const guardianNotifications = useMemo(
    () =>
      sortNotifications([
        ...pendingIncomingRequests.map((request) => ({
          id: `link-${request.id}`,
          type: 'link' as const,
          title: request.requesterName || request.requesterEmail || request.requesterSerial,
          description: `Wants to be your ${
            request.requesterRole === 'guardian' ? 'guardian' : 'dependent'
          }.`,
          timestamp: request.createdAt,
          actionLabel: 'Open Linking Setup',
          actionPath: '/guardian-link',
          tone: 'cyan' as const,
        })),
        ...transactionRequests
          .filter((request) => request.status === 'pending')
          .map((request) => ({
            id: `transaction-${request.id}`,
            type: 'transaction' as const,
            title: request.linkNickname || request.dependentName || request.dependentSerial,
            description: `${formatCurrency(request.amount)} for ${request.title}. ${request.reason}`,
            timestamp: request.createdAt,
            actionLabel: 'Open Guardian Page',
            actionPath: '/guardian?tab=requests',
            tone: 'amber' as const,
          })),
      ]),
    [pendingIncomingRequests, transactionRequests],
  );

  const dependentNotifications = useMemo(
    () =>
      sortNotifications([
        ...pendingOutgoingRequests.map((request) => ({
          id: `outgoing-link-${request.id}`,
          type: 'link' as const,
          title: request.targetSerial,
          description: 'Pending response',
          timestamp: request.createdAt,
          actionLabel: 'Open Linking Details',
          actionPath: '/guardian-link',
          tone: 'cyan' as const,
        })),
        ...linkedAccounts.map((link) => ({
          id: `linked-${link.requestId}`,
          type: 'link' as const,
          title: link.nickname || link.serial,
          description: 'Linked successfully',
          timestamp: link.linkedAt,
          actionLabel: 'Open Linking Details',
          actionPath: '/guardian-link',
          tone: 'emerald' as const,
        })),
        ...transactionRequests.map((request) => ({
          id: `request-${request.id}`,
          type: 'transaction' as const,
          title: request.title,
          description: `${formatCurrency(request.amount)} • ${
            request.status === 'approved'
              ? 'Approved'
              : request.status === 'rejected'
                ? 'Rejected'
                : 'Pending review'
          }`,
          timestamp: request.resolvedAt ?? request.createdAt,
          actionLabel: 'Open Transaction Requests',
          actionPath: '/protected?tab=transactions',
          tone:
            request.status === 'approved'
              ? ('emerald' as const)
              : request.status === 'rejected'
                ? ('red' as const)
                : ('amber' as const),
        })),
      ]),
    [linkedAccounts, pendingOutgoingRequests, transactionRequests],
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Welcome back!"
          description="Your AI-powered financial guardian is always watching."
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Action Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Analyze Card */}
            <GlassPanel padding="lg" className="bg-gradient-to-br from-slate-800/80 to-slate-800/40">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Scam Detection</h2>
                  <p className="text-slate-400 text-sm">Analyze messages or calls for potential scams</p>
                </div>
              </div>

              {/* Analysis Options */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <button
                  onClick={handleStartAnalysis}
                  className="group p-6 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Text Analysis</h3>
                      <p className="text-slate-400 text-sm">Paste a message to analyze</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleStartAnalysis}
                  className="group p-6 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Mic className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">Voice Analysis</h3>
                      <p className="text-slate-400 text-sm">Record a voice message</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Recent Activity Preview */}
              <div className="border-t border-slate-700/50 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Recent Alerts</h3>
                  <button className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors">
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  {recentAlerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={`flex items-center gap-3 p-3 rounded-xl ${
                        alert.type === 'danger' ? 'bg-red-500/10 border border-red-500/20' :
                        alert.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' :
                        'bg-emerald-500/10 border border-emerald-500/20'
                      }`}
                    >
                      {alert.type === 'danger' ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : alert.type === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      )}
                      <div className="flex-1">
                        <p className="text-white text-sm">{alert.message}</p>
                        <p className="text-slate-500 text-xs">{alert.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassPanel>

            {/* Risk Overview */}
            <GlassPanel className="backdrop-blur-sm">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-cyan-400" />
                Risk Overview
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">Protection Level</span>
                    <span className="text-emerald-400 font-medium">High</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"></div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">85%</p>
                  <p className="text-slate-400 text-xs">Safe Score</p>
                </div>
              </div>
            </GlassPanel>
          </div>

        {/* Side Panel */}
          <div className="space-y-6">
            {currentRole === 'guardian' ? (
              <NotificationPanel
                notifications={guardianNotifications}
                emptyState="No notifications right now. New link and transaction requests will appear here."
                onNavigate={(path) => navigate(path)}
              />
            ) : (
              <NotificationPanel
                notifications={dependentNotifications}
                emptyState="No notifications yet. Guardian link and transaction updates will appear here."
                onNavigate={(path) => navigate(path)}
              />
            )}

            {/* Quick Stats */}
            <GlassPanel className="backdrop-blur-sm">
              <h3 className="font-semibold text-white mb-4">Today's Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Messages Analyzed</span>
                  <span className="text-white font-medium">47</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Calls Screened</span>
                  <span className="text-white font-medium">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Threats Blocked</span>
                  <span className="text-red-400 font-medium">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Safe Transactions</span>
                  <span className="text-emerald-400 font-medium">8</span>
                </div>
              </div>
            </GlassPanel>

            {/* Tips Card */}
            <GlassPanel className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10">
              <h3 className="font-semibold text-white mb-3">💡 Safety Tip</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Banks will never ask for your password or PIN via phone or message. 
                Always verify requests through official channels.
              </p>
            </GlassPanel>
          </div>
        </div>
      </main>
  );
}
