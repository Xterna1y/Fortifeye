import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Ban,
  Bell,
  CheckCircle,
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
import {
  getGuardianTransactionRequests,
  updateTransactionRequestStatus,
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

export default function GuardianDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'settings'>('overview');
  const [requests, setRequests] = useState<TransactionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [decisionDrafts, setDecisionDrafts] = useState<Record<string, string>>({});
  const [isSubmittingDecision, setIsSubmittingDecision] = useState<Record<string, boolean>>({});
  const {
    linkedAccounts,
    pendingIncomingRequests,
    currentRole,
    removeLink,
    updateLinkNickname,
    isLoading: isLinkingLoading,
  } = useGuardianLinking();

  const refreshGuardianRequests = async () => {
    try {
      const storedUser = localStorage.getItem('fortifeye.user');
      const user = storedUser ? JSON.parse(storedUser) : null;

      if (!user?.id) {
        setRequests([]);
        return;
      }

      const guardianRequests = await getGuardianTransactionRequests(user.id);
      setRequests(guardianRequests);
    } catch (error) {
      console.error('Failed to load guardian transaction requests:', error);
    }
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'overview' || tab === 'requests' || tab === 'settings') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await refreshGuardianRequests();
      } finally {
        setIsLoading(false);
      }
    };

    load();

    const intervalId = window.setInterval(() => {
      refreshGuardianRequests();
    }, 10000);

    const handleFocus = () => {
      refreshGuardianRequests();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const protectedPeople = useMemo(
    () => linkedAccounts.filter((link) => link.role === 'dependent'),
    [linkedAccounts],
  );

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === 'pending'),
    [requests],
  );

  const approvedRequests = useMemo(
    () => requests.filter((request) => request.status === 'approved'),
    [requests],
  );

  const blockedRequests = useMemo(
    () => requests.filter((request) => request.status === 'denied'),
    [requests],
  );

  const handleRequestDecision = async (requestId: string, status: 'approved' | 'denied') => {
    setIsSubmittingDecision((current) => ({ ...current, [requestId]: true }));
    try {
      const decisionReason = decisionDrafts[requestId]?.trim() || undefined;
      const updatedRequest = await updateTransactionRequestStatus(
        requestId,
        status,
        decisionReason,
      );
      setRequests((current) =>
        current.map((request) => (request.id === requestId ? updatedRequest : request)),
      );
      setDecisionDrafts((current) => ({ ...current, [requestId]: '' }));
      await refreshGuardianRequests();
    } catch (error) {
      console.error(`Failed to ${status} guardian alert:`, error);
    } finally {
      setIsSubmittingDecision((current) => ({ ...current, [requestId]: false }));
    }
  };

  const handleEditNickname = async (
    requestId: string,
    currentNickname?: string,
    fallbackName?: string,
  ) => {
    const nickname = window.prompt(
      'Update the dependent nickname for this linked user:',
      currentNickname || fallbackName || '',
    );

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

  const handleTabChange = (tab: 'overview' | 'requests' | 'settings') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  if (isLinkingLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" />;
  }

  if (currentRole !== 'guardian') {
    return <Navigate to="/protected" replace />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Guardian Dashboard"
        description="Review incoming requests from your linked dependents and manage the people you protect."
      />

      <SegmentedTabs activeTab={activeTab} onChange={handleTabChange} tabs={tabs} />

      <GlassPanel
        title="Guardian Access"
        description={
          protectedPeople.length > 0
            ? `You currently protect ${protectedPeople.length} linked dependent${protectedPeople.length === 1 ? '' : 's'}.`
            : 'No dependent links are active yet.'
        }
        className="mb-6"
        titleAction={
          <Button onClick={() => navigate('/guardian-link')} variant="secondary">
            Open Linking Setup
          </Button>
        }
      >
        <p className="text-sm text-slate-400">
          Incoming link requests: {pendingIncomingRequests.length}. Pending transaction reviews:{' '}
          {pendingRequests.length}.
        </p>

        {protectedPeople.length > 0 ? (
          <div className="mt-4 space-y-3">
            {protectedPeople.map((link) => (
              <div
                key={link.requestId}
                className="flex flex-col gap-3 rounded-xl border border-slate-700/60 bg-slate-900/50 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">
                      {link.nickname || link.name || link.serial}
                    </p>
                    <StatusBadge tone="success">Linked</StatusBadge>
                  </div>
                  <p className="text-sm text-slate-400">
                    {link.email || link.serial} • linked as your dependent on{' '}
                    {new Date(link.linkedAt).toLocaleDateString()}.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEditNickname(link.requestId, link.nickname, link.name)}
                    variant="secondary"
                    className="px-3 py-2 text-xs"
                  >
                    Edit nickname
                  </Button>
                  <Button
                    onClick={() => removeLink(link.requestId)}
                    variant="danger"
                    className="px-3 py-2 text-xs"
                  >
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
              title="No dependents linked yet"
              description="Accept a dependent linking request to populate this guardian dashboard."
            />
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
              value={blockedRequests.length}
              icon={Ban}
              iconWrapperClassName="bg-red-500/20"
              iconClassName="text-red-400"
            />
          </div>

          <GlassPanel
            title="People You Protect"
            description="Accepted dependent links connected to this guardian account."
          >
            <div className="space-y-4">
              {protectedPeople.length === 0 ? (
                <EmptyState
                  icon={Shield}
                  title="No protected users yet"
                  description="Accepted dependent links will show up here once another user connects to this guardian."
                />
              ) : (
                protectedPeople.map((person) => (
                  <div
                    key={person.requestId}
                    className="flex flex-col gap-4 rounded-xl bg-slate-900/50 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700">
                        <User className="h-6 w-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {person.nickname || person.name || person.serial}
                        </p>
                        <p className="text-sm text-slate-400">{person.email || person.serial}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Linked {formatRelativeTime(person.linkedAt)}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
                      Active Link
                    </span>
                  </div>
                ))
              )}
            </div>
          </GlassPanel>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-6">
          <GlassPanel
            title="Incoming Transaction Requests"
            description="Guardians review dependent requests here. Approval and denial reasons are optional."
          >
            <div className="space-y-4">
              {pendingRequests.length === 0 ? (
                <p className="py-8 text-center text-slate-400">
                  {isLoading ? 'Loading incoming requests...' : 'No incoming transaction requests.'}
                </p>
              ) : (
                pendingRequests.map((request) => {
                  const dependentName = request.title || request.message || 'Dependent request';

                  return (
                    <div
                      key={request.id}
                      className="rounded-xl border border-amber-500/20 bg-slate-900/50 p-4"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-3">
                            <span className="font-medium text-white">{dependentName}</span>
                            <span className="text-sm text-slate-500">
                              {formatRelativeTime(request.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300">
                            {request.message || 'A dependent sent a transaction request.'}
                          </p>
                          <p className="mt-3 text-2xl font-bold text-white">
                            {Number.isFinite(request.amount)
                              ? `RM${request.amount.toLocaleString()}`
                              : 'Amount unavailable'}
                          </p>
                        </div>

                        <div className="w-full max-w-md space-y-3">
                          <label className="block text-sm font-medium text-slate-300">
                            Optional decision reason
                          </label>
                          <textarea
                            rows={3}
                            value={decisionDrafts[request.id] || ''}
                            onChange={(event) =>
                              setDecisionDrafts((current) => ({
                                ...current,
                                [request.id]: event.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                            placeholder="Explain your approval or denial if needed."
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => handleRequestDecision(request.id, 'approved')}
                              className="flex-1"
                              disabled={Boolean(isSubmittingDecision[request.id])}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleRequestDecision(request.id, 'denied')}
                              variant="danger"
                              className="flex-1"
                              disabled={Boolean(isSubmittingDecision[request.id])}
                            >
                              <Ban className="h-4 w-4" />
                              Deny
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </GlassPanel>

          <GlassPanel
            title="Reviewed Requests"
            description="Recent approvals and denials from this guardian account."
          >
            <div className="space-y-3">
              {approvedRequests.length === 0 && blockedRequests.length === 0 ? (
                <p className="py-8 text-center text-slate-400">No reviewed requests yet.</p>
              ) : (
                [...approvedRequests, ...blockedRequests]
                  .sort(
                    (first, second) =>
                      new Date(second.updatedAt || second.createdAt || 0).getTime() -
                      new Date(first.updatedAt || first.createdAt || 0).getTime(),
                  )
                  .map((request) => (
                    <div key={request.id} className="rounded-lg bg-slate-900/50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            {request.status === 'approved' ? (
                              <CheckCircle className="h-5 w-5 text-emerald-400" />
                            ) : (
                              <Ban className="h-5 w-5 text-red-400" />
                            )}
                            <p className="text-sm text-white">
                              {request.title || request.message || 'Reviewed transaction request'}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatRelativeTime(request.updatedAt || request.createdAt)}
                          </p>
                          {request.decisionReason && (
                            <p className="mt-2 text-sm text-slate-300">
                              Reason: {request.decisionReason}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            request.status === 'approved'
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}
                        >
                          {request.status === 'approved' ? 'Approved' : 'Denied'}
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
          <GlassPanel title="Protected People Settings">
            <div className="space-y-4">
              {protectedPeople.length === 0 ? (
                <EmptyState
                  icon={User}
                  title="No linked dependents yet"
                  description="Dependent nicknames and link management will appear here after someone connects to this guardian."
                />
              ) : (
                protectedPeople.map((person) => (
                  <div
                    key={person.requestId}
                    className="flex flex-col gap-3 rounded-xl bg-slate-900/50 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {person.nickname || person.name || person.serial}
                      </p>
                      <p className="text-sm text-slate-400">{person.email || person.serial}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          handleEditNickname(person.requestId, person.nickname, person.name)
                        }
                        variant="secondary"
                        className="px-3 py-2 text-xs"
                      >
                        Edit nickname
                      </Button>
                      <Button
                        onClick={() => removeLink(person.requestId)}
                        variant="danger"
                        className="px-3 py-2 text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassPanel>

          <GlassPanel title="Guardian Notifications">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">Pending Reviews</p>
                    <p className="text-sm text-slate-400">
                      Incoming dependent requests waiting for action.
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-amber-400">
                  {pendingRequests.length}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">Reviewed Requests</p>
                    <p className="text-sm text-slate-400">
                      Approvals and denials stay synced with the request history.
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-emerald-400">
                  {approvedRequests.length + blockedRequests.length}
                </span>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
