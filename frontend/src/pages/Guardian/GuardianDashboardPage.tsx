import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  Eye,
  Bell,
  Shield,
  User,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import GlassPanel from '../../components/ui/GlassPanel';
import PageHeader from '../../components/ui/PageHeader';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import useGuardianLinking from '../../hooks/useGuardianLinking';
import { getGuardianAlerts, updateGuardianAlertStatus, type GuardianAlert } from '../../services/alertService';
import { getDashboardData, type DashboardData } from '../../services/dashboardService';

const defaultDashboard: DashboardData = {
  stats: { protected: 0, blocked: 0, verified: 0, alerts: 0 },
  recentAlerts: [],
  summary: { messagesAnalyzed: 0, callsScreened: 0, threatsBlocked: 0, safeTransactions: 0 },
  riskOverview: { level: 'High', safeScore: 100 },
  guardian: { hasGuardian: false },
  safetyTip:
    'Banks will never ask for your password or PIN via phone or message. Always verify requests through official channels.',
};

function formatRelativeTime(value?: string) {
  if (!value) return 'Just now';
  const diffMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function inferAmountFromMessage(message?: string) {
  const match = message?.match(/(?:RM|\$)\s?(\d+(?:[.,]\d+)?)/i);
  return match ? Number(match[1].replace(/,/g, '')) : null;
}

export default function GuardianDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'settings'>('overview');
  const [dashboard, setDashboard] = useState<DashboardData>(defaultDashboard);
  const [alerts, setAlerts] = useState<GuardianAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    linkedAccounts,
    pendingIncomingRequests,
    currentRole,
    setRole,
    removeLink,
    updateLinkNickname,
  } = useGuardianLinking();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const storedUser = localStorage.getItem('fortifeye.user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        if (!user?.id) {
          setDashboard(defaultDashboard);
          setAlerts([]);
          return;
        }

        const [dashboardData, guardianAlerts] = await Promise.all([
          getDashboardData(user.id),
          getGuardianAlerts(user.id),
        ]);

        setDashboard(dashboardData);
        setAlerts(guardianAlerts);
      } catch (error) {
        console.error('Failed to load guardian dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const transactionRequests = useMemo(
    () =>
      alerts
        .filter((alert) => alert.status === 'pending')
        .map((alert) => ({
          id: alert.id,
          personName: alert.message || alert.title || 'Protected user',
          amount: inferAmountFromMessage(alert.message || alert.title) ?? null,
          description: alert.title || alert.message || 'Risky activity requires review',
          timestamp: formatRelativeTime(alert.createdAt),
        })),
    [alerts],
  );

  const resolvedRequests = useMemo(
    () =>
      alerts
        .filter((alert) => alert.status === 'approved' || alert.status === 'blocked')
        .map((alert) => ({
          id: alert.id,
          status: alert.status,
          description: alert.title || alert.message || 'Reviewed guardian alert',
          timestamp: formatRelativeTime(alert.createdAt),
        })),
    [alerts],
  );

  const handleRequestDecision = async (alertId: string, status: 'approved' | 'blocked') => {
    try {
      await updateGuardianAlertStatus(alertId, status);
      setAlerts((current) => current.map((alert) => (alert.id === alertId ? { ...alert, status } : alert)));
    } catch (error) {
      console.error(`Failed to ${status} guardian alert:`, error);
    }
  };

  const handleEditNickname = async (requestId: string, currentNickname?: string, fallbackName?: string) => {
    const nickname = window.prompt('Update the guardian nickname for this linked user:', currentNickname || fallbackName || '');
    if (nickname === null) {
      return;
    }
    await updateLinkNickname(requestId, nickname);
  };

  const tabs: Array<{ key: 'overview' | 'requests' | 'settings'; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'requests', label: 'Transaction Requests' },
    { key: 'settings', label: 'Settings' },
  ];
  const linkedLabel = 'dependent';
  const dashboardTitle = 'Guardian Dashboard';
  const dashboardDescription = 'Monitor and protect your linked users with live database-backed alerts and requests.';
  const accessTitle = 'Guardian Access';
  const accessDescription =
    linkedAccounts.length > 0
      ? `You currently have ${linkedAccounts.length} linked ${linkedLabel}${linkedAccounts.length === 1 ? ' account' : ' accounts'}.`
      : `No ${linkedLabel} links are active yet.`;
  const accessSummary = `Incoming link requests: ${pendingIncomingRequests.length}. Pending guardian reviews: ${transactionRequests.length}.`;
  const overviewTitle = 'People You Protect';
  const overviewEmptyTitle = 'No protected users yet';
  const overviewEmptyDescription =
    'Accepted dependent links will show up here once another user connects to this guardian.';
  const settingsTitle = 'Protected People Settings';
  const settingsEmptyTitle = 'No linked people yet';
  const settingsEmptyDescription =
    'Guardian nicknames and linked-account management will appear here after a dependent is connected.';

  if (currentRole !== 'guardian') {
    return <Navigate to="/protected" replace />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={dashboardTitle}
        description={dashboardDescription}
      />

      <SegmentedTabs activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />

      <GlassPanel
        title={accessTitle}
        description={accessDescription}
        className="mb-6"
        titleAction={
          <Button onClick={() => navigate('/guardian-link')} variant="secondary">
            Open Linking Setup
          </Button>
        }
      >
        <div className="flex flex-col gap-3 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-white">
              {currentRole === 'guardian' ? 'Guardian mode selected' : 'Dependent mode selected'}
            </p>
            <p className="text-slate-400">{accessSummary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={currentRole === 'guardian' ? 'info' : 'neutral'}>
              <button type="button" onClick={() => setRole('guardian')}>
                Guardian
              </button>
            </StatusBadge>
            <StatusBadge tone={currentRole === 'dependent' ? 'success' : 'neutral'}>
              <button type="button" onClick={() => setRole('dependent')}>
                Dependent
              </button>
            </StatusBadge>
          </div>
        </div>

        {linkedAccounts.length > 0 ? (
          <div className="mt-4 space-y-3">
            {linkedAccounts.map((link) => (
              <div key={link.requestId} className="flex flex-col gap-3 rounded-xl border border-slate-700/60 bg-slate-900/50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{link.nickname || link.name || link.serial}</p>
                    <StatusBadge tone="success">Linked</StatusBadge>
                  </div>
                  <p className="text-sm text-slate-400">
                    {link.email || link.serial} • linked as your {link.role} on {new Date(link.linkedAt).toLocaleDateString()}.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => removeLink(link.requestId)} variant="danger" className="px-3 py-2 text-xs">
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              icon={User}
              title="No guardian links yet"
              description="Open the linking setup to choose a role, share your serial ID, and connect this account to another user."
            />
          </div>
        )}
      </GlassPanel>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard label="Protected" value={linkedAccounts.length} icon={User} iconWrapperClassName="bg-cyan-500/20" iconClassName="text-cyan-400" />
            <StatCard label="Pending" value={transactionRequests.length} icon={AlertTriangle} iconWrapperClassName="bg-amber-500/20" iconClassName="text-amber-400" />
            <StatCard label="Approved" value={alerts.filter((alert) => alert.status === 'approved').length} icon={CheckCircle} iconWrapperClassName="bg-emerald-500/20" iconClassName="text-emerald-400" />
            <StatCard label="Blocked" value={alerts.filter((alert) => alert.status === 'blocked').length + dashboard.summary.threatsBlocked} icon={Ban} iconWrapperClassName="bg-red-500/20" iconClassName="text-red-400" />
          </div>

          <GlassPanel title={overviewTitle}>
            <div className="space-y-4">
              {linkedAccounts.length === 0 ? (
                <EmptyState
                  icon={Shield}
                  title={overviewEmptyTitle}
                  description={overviewEmptyDescription}
                />
              ) : (
                linkedAccounts.map((person) => (
                  <div key={person.requestId} className="flex flex-col gap-4 rounded-xl bg-slate-900/50 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700">
                        <User className="h-6 w-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{person.nickname || person.name || person.serial}</p>
                        <p className="text-sm text-slate-400">{person.email || person.serial}</p>
                        <p className="mt-1 text-xs text-slate-500">Linked {formatRelativeTime(person.linkedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
                        {`${dashboard.riskOverview.level} Protection`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassPanel>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-6">
          <GlassPanel title="Pending Transaction Requests">
            <div className="space-y-4">
              {transactionRequests.length === 0 ? (
                <p className="py-8 text-center text-slate-400">
                  {isLoading ? 'Loading pending reviews...' : 'No pending transaction reviews.'}
                </p>
              ) : (
                transactionRequests.map((request) => (
                  <div key={request.id} className="rounded-xl border border-amber-500/20 bg-slate-900/50 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <span className="font-medium text-white">{request.personName}</span>
                          <span className="text-sm text-slate-500">• {request.timestamp}</span>
                        </div>
                        <p className="mb-2 text-sm text-slate-400">{request.description}</p>
                        <p className="text-2xl font-bold text-white">
                          {request.amount === null ? 'Amount unavailable' : `RM${request.amount.toLocaleString()}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRequestDecision(request.id, 'approved')}
                          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-white transition-colors hover:bg-emerald-600"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRequestDecision(request.id, 'blocked')}
                          className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
                        >
                          <Ban className="h-4 w-4" />
                          Block
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassPanel>

          <GlassPanel title="Recent Notifications">
            <div className="space-y-3">
              {resolvedRequests.length === 0 ? (
                <p className="py-8 text-center text-slate-400">No reviewed requests yet.</p>
              ) : (
                resolvedRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between rounded-lg bg-slate-900/50 p-3">
                    <div className="flex items-center gap-3">
                      {request.status === 'approved' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <Ban className="h-5 w-5 text-red-400" />
                      )}
                      <div>
                        <p className="text-sm text-white">{request.description}</p>
                        <p className="text-xs text-slate-500">{request.timestamp}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${request.status === 'approved' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {request.status === 'approved' ? 'Approved' : 'Blocked'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </GlassPanel>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <GlassPanel title="Guardian Notifications">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">Pending Notifications</p>
                    <p className="text-sm text-slate-400">
                      These are the live guardian notifications waiting for review.
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-amber-400">{transactionRequests.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-4">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">Reviewed Notifications</p>
                    <p className="text-sm text-slate-400">Approved and blocked actions stay synchronized with the notifications list.</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-emerald-400">{resolvedRequests.length}</span>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel title={settingsTitle}>
            <div className="space-y-4">
              {linkedAccounts.length === 0 ? (
                <EmptyState
                  icon={User}
                  title={settingsEmptyTitle}
                  description={settingsEmptyDescription}
                />
              ) : (
                linkedAccounts.map((person) => (
                  <div key={person.requestId} className="flex flex-col gap-3 rounded-xl bg-slate-900/50 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-white">{person.nickname || person.name || person.serial}</p>
                      <p className="text-sm text-slate-400">{person.email || person.serial}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleEditNickname(person.requestId, person.nickname, person.name)} variant="secondary" className="px-3 py-2 text-xs">
                        Edit nickname
                      </Button>
                      <Button onClick={() => removeLink(person.requestId)} variant="danger" className="px-3 py-2 text-xs">
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
