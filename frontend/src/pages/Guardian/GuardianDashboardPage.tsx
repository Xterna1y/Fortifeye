import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  DollarSign,
  Eye,
  Link2,
  Lock,
  Mail,
  MessageSquareText,
  User,
} from 'lucide-react';
import GlassPanel from '../../components/ui/GlassPanel';
import PageHeader from '../../components/ui/PageHeader';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import StatCard from '../../components/ui/StatCard';
import useGuardianLinking from '../../hooks/useGuardianLinking';
import useTransactionRequests from '../../hooks/useTransactionRequests';

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

export default function GuardianDashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'settings'>('overview');
  const [rejectionDrafts, setRejectionDrafts] = useState<Record<string, string>>({});
  const {
    linkedAccounts,
    removeLink,
  } = useGuardianLinking();
  const {
    requests: transactionRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    isLoading: isTransactionsLoading,
    approveRequest,
    rejectRequest,
  } = useTransactionRequests();

  const tabs: Array<{ key: 'overview' | 'requests' | 'settings'; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'requests', label: 'Transaction Requests' },
    { key: 'settings', label: 'Settings' },
  ];

  useEffect(() => {
    const tab = searchParams.get('tab');

    if (tab === 'overview' || tab === 'requests' || tab === 'settings') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const protectedPeople = useMemo(
    () =>
      linkedAccounts
        .filter((link) => link.role === 'dependent')
        .map((link) => ({
          id: link.requestId,
          name: link.nickname || link.name || link.serial,
          email: link.email,
          serial: link.serial,
          linkedAt: link.linkedAt,
        })),
    [linkedAccounts],
  );

  const recentReviewedRequests = transactionRequests.filter(
    (request) => request.status !== 'pending',
  );

  const handleRejectRequest = async (requestId: string) => {
    await rejectRequest(requestId, rejectionDrafts[requestId] || undefined);
    setRejectionDrafts((current) => ({ ...current, [requestId]: '' }));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Guardian Dashboard"
        description="Monitor your dependents and review live transaction requests in one place."
      />

      <SegmentedTabs activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />

      <GlassPanel
        title="Guardian Access"
        description={
          linkedAccounts.length > 0
            ? `You currently have ${linkedAccounts.length} linked ${linkedAccounts.length === 1 ? 'account' : 'accounts'} synced from the database.`
            : 'No guardian/dependent links are active for this account yet.'
        }
        className="mb-6"
        titleAction={
          <button
            type="button"
            onClick={() => navigate('/guardian-link')}
            className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition-all hover:bg-cyan-500/20"
          >
            Open Linking Setup
          </button>
        }
      >
        {linkedAccounts.length > 0 && (
          <div className="space-y-3">
            {linkedAccounts.map((link) => (
              <div
                key={link.requestId}
                className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/50 p-4"
              >
                <div>
                  <p className="font-medium text-white">{link.nickname || link.name || link.serial}</p>
                  {link.email && <p className="text-sm text-slate-400">{link.email}</p>}
                  {link.nickname && (
                    <p className="text-sm text-slate-500">Serial ID: {link.serial}</p>
                  )}
                  <p className="text-sm text-slate-400">
                    Linked as a {link.role} on {new Date(link.linkedAt).toLocaleDateString()}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeLink(link.requestId)}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 transition-all hover:bg-red-500/20"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard
              label="Protected"
              value={protectedPeople.length}
              icon={User}
              iconWrapperClassName="bg-cyan-500/20"
              iconClassName="text-cyan-400"
            />
            <StatCard
              label="Pending"
              value={pendingRequests.length}
              icon={AlertTriangle}
              iconWrapperClassName="bg-amber-500/20"
              iconClassName="text-amber-400"
            />
            <StatCard
              label="Approved"
              value={approvedRequests.length}
              icon={CheckCircle}
              iconWrapperClassName="bg-emerald-500/20"
              iconClassName="text-emerald-400"
            />
            <StatCard
              label="Blocked"
              value={rejectedRequests.length}
              icon={Ban}
              iconWrapperClassName="bg-red-500/20"
              iconClassName="text-red-400"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <GlassPanel
              title="People You Protect"
              description="Linked dependents synced from the active guardian records."
            >
              <div className="space-y-4">
                {protectedPeople.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-900/30 px-4 py-8 text-center text-sm text-slate-400">
                    No linked dependents yet. Accept a linking request to populate this list.
                  </div>
                ) : (
                  protectedPeople.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between gap-4 rounded-xl bg-slate-900/50 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700">
                          <User className="h-6 w-6 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{person.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                            {person.email && (
                              <span className="inline-flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" />
                                {person.email}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1.5">
                              <Link2 className="h-3.5 w-3.5" />
                              {person.serial}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">
                            Linked on {formatTimestamp(person.linkedAt)}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                        Active Link
                      </span>
                    </div>
                  ))
                )}
              </div>
            </GlassPanel>

            <GlassPanel
              title="Pending Transaction Alerts"
              description="New money requests from dependents appear here automatically."
            >
              <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <p className="py-8 text-center text-slate-400">
                    No pending transaction requests right now.
                  </p>
                ) : (
                  pendingRequests.slice(0, 3).map((request) => (
                    <div
                      key={request.id}
                      className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-white">
                            {request.linkNickname || request.dependentName || request.dependentSerial}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-white">
                            {formatCurrency(request.amount)}
                          </p>
                          <p className="mt-1 text-sm text-slate-300">{request.title}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatTimestamp(request.createdAt)}
                          </p>
                        </div>
                        <MessageSquareText className="h-5 w-5 text-amber-300" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassPanel>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-6">
          <GlassPanel
            title="Pending Transaction Requests"
            description="Approve or reject each money request. Rejection reason is optional."
          >
            <div className="space-y-4">
              {isTransactionsLoading ? (
                <p className="py-8 text-center text-slate-400">Loading transaction requests...</p>
              ) : pendingRequests.length === 0 ? (
                <p className="py-8 text-center text-slate-400">No pending transaction requests.</p>
              ) : (
                pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-xl border border-amber-500/20 bg-slate-900/50 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-semibold text-white">{request.title}</p>
                          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
                            Pending
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {formatCurrency(request.amount)}
                        </p>
                        <p className="text-sm text-slate-300">
                          <span className="font-medium text-white">Requested by:</span>{' '}
                          {request.linkNickname || request.dependentName || request.dependentSerial}
                        </p>
                        {request.dependentEmail && (
                          <p className="text-sm text-slate-400">{request.dependentEmail}</p>
                        )}
                        <p className="text-sm text-slate-300">
                          <span className="font-medium text-white">Reason:</span> {request.reason}
                        </p>
                        {request.details && (
                          <p className="text-sm text-slate-400">{request.details}</p>
                        )}
                        <p className="text-xs text-slate-500">
                          Submitted {formatTimestamp(request.createdAt)}
                        </p>
                      </div>

                      <div className="w-full max-w-sm space-y-3 lg:min-w-[18rem]">
                        <label className="block text-sm font-medium text-slate-300">
                          Optional rejection reason
                        </label>
                        <textarea
                          rows={3}
                          value={rejectionDrafts[request.id] || ''}
                          onChange={(event) =>
                            setRejectionDrafts((current) => ({
                              ...current,
                              [request.id]: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                          placeholder="Explain why you are rejecting this request."
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => approveRequest(request.id)}
                            className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(request.id)}
                            className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassPanel>

          <GlassPanel
            title="Recent Decisions"
            description="Approved and rejected transaction requests with timestamps and reasons."
          >
            <div className="space-y-3">
              {recentReviewedRequests.length === 0 ? (
                <p className="py-8 text-center text-slate-400">No reviewed transaction requests yet.</p>
              ) : (
                recentReviewedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-lg bg-slate-900/50 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          {request.status === 'approved' ? (
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <Ban className="h-5 w-5 text-red-400" />
                          )}
                          <p className="font-medium text-white">{request.title}</p>
                        </div>
                        <p className="mt-1 text-sm text-slate-300">
                          {request.linkNickname || request.dependentName || request.dependentSerial} requested{' '}
                          {formatCurrency(request.amount)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Reviewed {formatTimestamp(request.resolvedAt ?? request.updatedAt ?? request.createdAt)}
                        </p>
                        {request.rejectionReason && (
                          <p className="mt-2 text-sm text-red-200">
                            Reason: {request.rejectionReason}
                          </p>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          request.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-red-500/15 text-red-300'
                        }`}
                      >
                        {request.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    </div>
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
                  <DollarSign className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">Transaction Alerts</p>
                    <p className="text-sm text-slate-400">Get notified for new dependent requests</p>
                  </div>
                </div>
                <input
                  type="number"
                  defaultValue={100}
                  className="w-24 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-right text-white"
                />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-4">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">View Transaction History</p>
                    <p className="text-sm text-slate-400">Access full transaction history of protected persons</p>
                  </div>
                </div>
                <button className="relative h-6 w-12 rounded-full bg-cyan-500">
                  <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white" />
                </button>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">Block High-Risk Transactions</p>
                    <p className="text-sm text-slate-400">Automatically block transactions flagged as high risk</p>
                  </div>
                </div>
                <button className="relative h-6 w-12 rounded-full bg-cyan-500">
                  <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white" />
                </button>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-4">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">Emergency Lock</p>
                    <p className="text-sm text-slate-400">Immediately block all transactions for a protected person</p>
                  </div>
                </div>
                <button className="rounded-lg bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600">
                  Enable
                </button>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
