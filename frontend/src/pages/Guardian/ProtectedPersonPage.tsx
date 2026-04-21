import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Shield,
  XCircle,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import GlassPanel from '../../components/ui/GlassPanel';
import PageHeader from '../../components/ui/PageHeader';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import useGuardianLinking from '../../hooks/useGuardianLinking';
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

export default function ProtectedPersonPage() {
  const [showBalance, setShowBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'alerts' | 'settings'>('transactions');
  const [dashboard, setDashboard] = useState<DashboardData>(defaultDashboard);
  const { guardian, linkedAccounts, updateLinkNickname } = useGuardianLinking();

  useEffect(() => {
    const load = async () => {
      try {
        const storedUser = localStorage.getItem('fortifeye.user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        if (!user?.id) {
          return;
        }

        const data = await getDashboardData(user.id);
        setDashboard(data);
      } catch (error) {
        console.error('Failed to load protected dashboard:', error);
      }
    };

    load();
  }, []);

  const transactions = useMemo(
    () =>
      dashboard.recentAlerts.map((alert, index) => ({
        id: alert.id,
        amount: alert.type === 'danger' ? 500 : alert.type === 'warning' ? 250 : 80,
        description: alert.message,
        timestamp: formatRelativeTime(alert.createdAt),
        status:
          alert.type === 'danger' ? 'blocked' : alert.type === 'warning' ? 'pending' : 'approved',
        guardianApproved: alert.type === 'success',
        accountName: linkedAccounts[0]?.nickname || linkedAccounts[0]?.name || 'Protected account',
        index,
      })),
    [dashboard.recentAlerts, linkedAccounts],
  );

  const guardianName = guardian?.nickname || guardian?.name || 'Guardian not linked';
  const balance = dashboard.riskOverview.safeScore * 100;

  const handleEditGuardianNickname = async () => {
    if (!guardian) {
      return;
    }

    const nickname = window.prompt('Update the nickname for your guardian:', guardian.nickname || guardian.name || '');
    if (nickname === null) {
      return;
    }

    await updateLinkNickname(guardian.requestId, nickname);
  };

  const tabs: Array<{ key: 'transactions' | 'alerts' | 'settings'; label: string }> = [
    { key: 'transactions', label: 'My Transactions' },
    { key: 'alerts', label: 'Alerts' },
    { key: 'settings', label: 'Privacy Settings' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Protected Account"
        description="See the live activity and guardian notifications attached to this account."
      />

      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 p-6">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-white/80">Protection Score</span>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-white/80" />
              <span className="text-xs text-white/80">Guardian Protected</span>
            </div>
          </div>
          <div className="mb-4 flex items-center gap-2">
            {showBalance ? (
              <span className="text-4xl font-bold text-white">RM{balance.toLocaleString()}</span>
            ) : (
              <span className="text-4xl font-bold text-white">••••••</span>
            )}
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="rounded-lg bg-white/20 p-2 transition-colors hover:bg-white/30"
            >
              {showBalance ? <EyeOff className="h-5 w-5 text-white" /> : <Eye className="h-5 w-5 text-white" />}
            </button>
          </div>
          <p className="text-sm text-white/70">Safe score mirrored from live dashboard data</p>
        </div>
      </div>

      <SegmentedTabs activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />

      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <GlassPanel padding="sm">
              <p className="text-sm text-slate-400">No recent protected activity yet.</p>
            </GlassPanel>
          ) : (
            transactions.map((transaction) => (
              <GlassPanel key={transaction.id} padding="sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        transaction.status === 'approved'
                          ? 'bg-emerald-500/20'
                          : transaction.status === 'pending'
                            ? 'bg-amber-500/20'
                            : 'bg-red-500/20'
                      }`}
                    >
                      {transaction.status === 'approved' ? (
                        <CheckCircle className="h-6 w-6 text-emerald-400" />
                      ) : transaction.status === 'pending' ? (
                        <Clock className="h-6 w-6 text-amber-400" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{transaction.description}</p>
                      <p className="text-sm text-slate-400">{transaction.timestamp}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">RM{transaction.amount}</p>
                    <div className="mt-1 flex items-center justify-end gap-1">
                      {transaction.status === 'approved' && transaction.guardianApproved && (
                        <>
                          <CheckCircle className="h-3 w-3 text-emerald-400" />
                          <span className="text-xs text-emerald-400">Guardian approved</span>
                        </>
                      )}
                      {transaction.status === 'pending' && (
                        <>
                          <Clock className="h-3 w-3 text-amber-400" />
                          <span className="text-xs text-amber-400">Awaiting approval</span>
                        </>
                      )}
                      {transaction.status === 'blocked' && (
                        <>
                          <XCircle className="h-3 w-3 text-red-400" />
                          <span className="text-xs text-red-400">Blocked by guardian</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </GlassPanel>
            ))
          )}
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <GlassPanel title="Recent Notifications">
            <div className="space-y-3">
              {dashboard.recentAlerts.length === 0 ? (
                <p className="py-8 text-center text-slate-400">No guardian notifications yet.</p>
              ) : (
                dashboard.recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between rounded-lg bg-slate-900/50 p-3">
                    <div className="flex items-center gap-3">
                      {alert.type === 'danger' ? (
                        <XCircle className="h-5 w-5 text-red-400" />
                      ) : alert.type === 'warning' ? (
                        <Bell className="h-5 w-5 text-amber-400" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      )}
                      <div>
                        <p className="text-sm text-white">{alert.message}</p>
                        <p className="text-xs text-slate-500">{formatRelativeTime(alert.createdAt)}</p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        alert.type === 'danger'
                          ? 'text-red-400'
                          : alert.type === 'warning'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                      }`}
                    >
                      {alert.type === 'danger' ? 'Blocked' : alert.type === 'warning' ? 'Warning' : 'Approved'}
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
          <GlassPanel title="Guardian Settings">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-4">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">Guardian Status</p>
                    <p className="text-sm text-slate-400">
                      {guardian ? `${guardianName} is currently linked and monitoring this account.` : 'No guardian is currently linked to this account.'}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${guardian ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {guardian ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">Notifications</p>
                    <p className="text-sm text-slate-400">Guardian review results and recent alerts stay synchronized with the notifications tab.</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-emerald-400">{dashboard.recentAlerts.length}</span>
              </div>
            </div>
          </GlassPanel>

          {guardian && (
            <GlassPanel title="Guardian Profile">
              <div className="flex flex-col gap-4 rounded-xl bg-slate-900/50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-white">{guardianName}</p>
                  <p className="text-sm text-slate-400">{guardian.email || guardian.serial}</p>
                </div>
                <Button onClick={handleEditGuardianNickname} variant="secondary" className="px-3 py-2 text-xs">
                  Edit nickname
                </Button>
              </div>
            </GlassPanel>
          )}
        </div>
      )}
    </div>
  );
}
