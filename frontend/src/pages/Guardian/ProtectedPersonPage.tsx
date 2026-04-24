import { useEffect, useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Send,
  Link2,
  Mail,
  PencilLine,
  Shield,
  XCircle,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import GlassPanel from '../../components/ui/GlassPanel';
import PageHeader from '../../components/ui/PageHeader';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import StatCard from '../../components/ui/StatCard';
import useGuardianLinking from '../../hooks/useGuardianLinking';
import {
  createTransactionRequest,
  getDependentTransactionRequests,
  type TransactionRequest,
} from '../../services/transactionRequestService';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'settings'>('overview');
  const [requests, setRequests] = useState<TransactionRequest[]>([]);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const { guardian, linkedAccounts, updateLinkNickname, currentRole, isLoading } =
    useGuardianLinking();

  const refreshDependentRequests = async () => {
    try {
      const storedUser = localStorage.getItem('fortifeye.user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      if (!user?.id) {
        setRequests([]);
        return;
      }

      const data = await getDependentTransactionRequests(user.id);
      setRequests(data);
    } catch (error) {
      console.error('Failed to load protected transaction requests:', error);
    }
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'overview' || tab === 'transactions' || tab === 'settings') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      await refreshDependentRequests();
    };

    load();

    const intervalId = window.setInterval(() => {
      refreshDependentRequests();
    }, 10000);

    const handleFocus = () => {
      refreshDependentRequests();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const transactions = useMemo(
    () =>
      requests.map((request) => {
        return {
          id: request.id,
          amount: Number.isFinite(request.amount) ? request.amount : null,
          description: request.title || request.message || 'Transaction request',
          detail: request.message || '',
          timestamp: formatRelativeTime(request.updatedAt || request.createdAt),
          status:
            request.status === 'approved'
              ? 'approved'
              : request.status === 'denied'
                ? 'blocked'
                : 'pending',
          decisionReason: request.decisionReason || '',
          guardianApproved: request.status === 'approved',
        };
      }),
    [requests],
  );

  const linkedGuardians = useMemo(
    () =>
      linkedAccounts
        .filter((link) => link.role === 'guardian')
        .map((link) => ({
          id: link.requestId,
          name: link.nickname || link.name || link.serial,
          email: link.email,
          serial: link.serial,
          linkedAt: link.linkedAt,
        })),
    [linkedAccounts],
  );
  const pendingTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.status === 'pending'),
    [transactions],
  );
  const approvedTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.status === 'approved'),
    [transactions],
  );
  const blockedTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.status === 'blocked'),
    [transactions],
  );
  const protectionAlerts = useMemo(() => {
    const items = [];

    if (linkedGuardians[0]) {
      items.push({
        id: `guardian-${linkedGuardians[0].id}`,
        type: 'success' as const,
        title: 'Guardian protection is active',
        detail: `${linkedGuardians[0].name} is linked to your account.`,
        timestamp: linkedGuardians[0].linkedAt,
      });
    }

    requests.forEach((request) => {
      items.push({
        id: `request-${request.id}`,
        type:
          request.status === 'denied'
            ? ('warning' as const)
            : request.status === 'approved'
              ? ('success' as const)
              : ('info' as const),
        title:
          request.status === 'denied'
            ? 'Transaction request denied'
            : request.status === 'approved'
              ? 'Transaction request approved'
              : 'Transaction request awaiting approval',
        detail:
          request.status === 'denied' && request.decisionReason
            ? `${request.message || request.title || 'A request was denied.'} Reason: ${request.decisionReason}`
            : request.message || request.title || 'No details provided.',
        timestamp: request.updatedAt || request.createdAt,
      });
    });

    return items.sort(
      (first, second) =>
        new Date(second.timestamp || 0).getTime() - new Date(first.timestamp || 0).getTime(),
    );
  }, [requests, linkedGuardians]);

  const handleSubmitTransactionRequest = async () => {
    const storedUser = localStorage.getItem('fortifeye.user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    const amount = Number(requestAmount);

    if (!user?.id || !guardian?.userId) {
      setRequestFeedback('Link a guardian first before sending a transaction request.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setRequestFeedback('Enter a valid amount before sending the request.');
      return;
    }

    if (!requestReason.trim()) {
      setRequestFeedback('Add a short reason so your guardian knows what this request is for.');
      return;
    }

    setIsSubmittingRequest(true);
    setRequestFeedback(null);

    try {
      await createTransactionRequest({
        guardianId: guardian.userId,
        dependentId: user.id,
        riskLevel: 'medium',
        title: `Transaction request from ${user.name || user.email || 'dependent user'}`,
        message: requestReason.trim(),
        amount,
      });

      await refreshDependentRequests();

      setRequestAmount('');
      setRequestReason('');
      setRequestFeedback('Transaction request sent to your guardian.');
    } catch (error) {
      console.error('Failed to create transaction request:', error);
      setRequestFeedback('Unable to send the transaction request right now.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

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

  const tabs: Array<{ key: 'overview' | 'transactions' | 'settings'; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'transactions', label: 'Transaction Requests' },
    { key: 'settings', label: 'Privacy Settings' },
  ];

  const handleTabChange = (tab: 'overview' | 'transactions' | 'settings') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" />;
  }

  if (currentRole === 'guardian') {
    return <Navigate to="/guardian?tab=requests" replace />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Protected Account"
        description="See the live activity and guardian notifications attached to this account."
      />

      <div className="mb-6">
        <SegmentedTabs activeTab={activeTab} onChange={handleTabChange} tabs={tabs} />
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[14rem] flex-1">
              <StatCard
                label="Pending"
                value={pendingTransactions.length}
                icon={Clock}
                iconWrapperClassName="bg-amber-500/20"
                iconClassName="text-amber-400"
              />
            </div>
            <div className="min-w-[14rem] flex-1">
              <StatCard
                label="Approved"
                value={approvedTransactions.length}
                icon={CheckCircle}
                iconWrapperClassName="bg-emerald-500/20"
                iconClassName="text-emerald-400"
              />
            </div>
            <div className="min-w-[14rem] flex-1">
              <StatCard
                label="Blocked"
                value={blockedTransactions.length}
                icon={XCircle}
                iconWrapperClassName="bg-red-500/20"
                iconClassName="text-red-400"
              />
            </div>
          </div>

          <GlassPanel
            title="Guardian Details"
            description="Current guardian connection synced from the same database used by the linking flow."
          >
            <div className="space-y-4">
              {linkedGuardians.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-900/30 px-4 py-8 text-center text-sm text-slate-400">
                  No guardian has been linked yet.
                </div>
              ) : (
                linkedGuardians.map((linkedGuardian) => (
                  <div key={linkedGuardian.id} className="rounded-xl bg-slate-900/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700">
                          <Shield className="h-6 w-6 text-cyan-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white">{linkedGuardian.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                            {linkedGuardian.email && (
                              <span className="inline-flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" />
                                {linkedGuardian.email}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1.5">
                              <Link2 className="h-3.5 w-3.5" />
                              {linkedGuardian.serial}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">
                            Linked {formatRelativeTime(linkedGuardian.linkedAt)}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                        Active
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassPanel>

          <GlassPanel
            title="Protection Alerts"
            description="Live updates from your guardian link and transaction-request activity."
          >
            <div className="space-y-4">
              {protectionAlerts.length === 0 ? (
                <p className="py-8 text-center text-slate-400">No protection alerts yet.</p>
              ) : (
                protectionAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-xl border p-4 ${
                      alert.type === 'warning'
                        ? 'border-amber-500/20 bg-amber-500/10'
                        : alert.type === 'success'
                          ? 'border-emerald-500/20 bg-emerald-500/10'
                          : 'border-cyan-500/20 bg-cyan-500/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          alert.type === 'warning'
                            ? 'bg-amber-500/20'
                            : alert.type === 'success'
                              ? 'bg-emerald-500/20'
                              : 'bg-cyan-500/20'
                        }`}
                      >
                        {alert.type === 'warning' ? (
                          <AlertTriangle className="h-5 w-5 text-amber-400" />
                        ) : alert.type === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <Bell className="h-5 w-5 text-cyan-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white">{alert.title}</p>
                        <p className="mt-1 text-sm text-slate-300">{alert.detail}</p>
                        <p className="mt-2 text-xs text-slate-500">{formatRelativeTime(alert.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassPanel>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <GlassPanel title="Request Guardian Approval">
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Send a transaction request to your guardian before making a higher-risk payment or transfer.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="min-w-[12rem] flex-[0.9]">
                  <label className="mb-2 block text-sm font-medium text-white">Amount</label>
                  <input
                    value={requestAmount}
                    onChange={(event) => setRequestAmount(event.target.value)}
                    placeholder="RM500"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-white outline-none transition-colors focus:border-cyan-400"
                  />
                </div>
                <div className="min-w-[16rem] flex-[2]">
                  <label className="mb-2 block text-sm font-medium text-white">Reason</label>
                  <input
                    value={requestReason}
                    onChange={(event) => setRequestReason(event.target.value)}
                    placeholder="Describe why you need approval"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-white outline-none transition-colors focus:border-cyan-400"
                  />
                </div>
              </div>
              {requestFeedback && (
                <p className={`text-sm ${requestFeedback.includes('sent') ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {requestFeedback}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  onClick={handleSubmitTransactionRequest}
                  variant="primary"
                  className="px-4 py-3"
                  disabled={isSubmittingRequest || !guardian}
                >
                  <span className="inline-flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    {isSubmittingRequest ? 'Sending...' : 'Send Transaction Request'}
                  </span>
                </Button>
              </div>
            </div>
          </GlassPanel>

          {transactions.length === 0 ? (
            <GlassPanel padding="sm">
              <p className="text-sm text-slate-400">No recent protected activity yet.</p>
            </GlassPanel>
          ) : (
            transactions.map((transaction) => (
              <GlassPanel key={transaction.id} padding="sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
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
                  <div className="w-full text-left sm:w-auto sm:text-right">
                    <p className="text-xl font-bold text-white">
                      {transaction.amount === null ? 'Amount unavailable' : `RM${transaction.amount}`}
                    </p>
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
                          <span className="text-xs text-red-400">Denied by guardian</span>
                        </>
                      )}
                    </div>
                    {transaction.decisionReason && (
                      <p className="mt-2 text-xs text-slate-400 sm:text-right">
                        Reason: {transaction.decisionReason}
                      </p>
                    )}
                  </div>
                </div>
              </GlassPanel>
            ))
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <GlassPanel title="Guardian Settings">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-4">
                <div className="flex items-center gap-3">
                  <PencilLine className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">Guardian Nickname</p>
                    <p className="text-sm text-slate-400">
                      {guardian ? 'Edit how your guardian appears across the protected account views.' : 'No guardian is currently linked to this account.'}
                    </p>
                  </div>
                </div>
                {guardian && (
                  <Button onClick={handleEditGuardianNickname} variant="secondary" className="px-3 py-2 text-xs">
                    Edit Nickname
                  </Button>
                )}
              </div>
            </div>
          </GlassPanel>

          {guardian && (
            <GlassPanel title="Guardian Profile">
              <div className="flex flex-col gap-4 rounded-xl bg-slate-900/50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-white">
                    {guardian.nickname || guardian.name || guardian.serial}
                  </p>
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
