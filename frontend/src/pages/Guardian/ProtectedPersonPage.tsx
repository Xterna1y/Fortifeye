import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Eye,
  Link2,
  Lock,
  Mail,
  MessageSquare,
  PencilLine,
  Shield,
  User,
  XCircle,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GlassPanel from '../../components/ui/GlassPanel';
import PageHeader from '../../components/ui/PageHeader';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import StatCard from '../../components/ui/StatCard';
import useGuardianLinking from '../../hooks/useGuardianLinking';
import useTransactionRequests from '../../hooks/useTransactionRequests';
import { getStoredUser } from '../../utils/userSession';

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

function getDisplayName() {
  const user = getStoredUser();

  if (!user) {
    return 'there';
  }

  if (typeof user.name === 'string' && user.name.trim()) {
    return user.name.trim();
  }

  if (typeof user.email === 'string' && user.email.includes('@')) {
    return user.email.split('@')[0];
  }

  return 'there';
}

export default function ProtectedPersonPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'settings'>('overview');
  const {
    linkedAccounts,
    pendingOutgoingRequests,
    updateLinkNickname,
  } = useGuardianLinking();
  const {
    requests: transactionRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    isLoading: isTransactionsLoading,
    createRequest,
  } = useTransactionRequests();

  const [editingGuardianId, setEditingGuardianId] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [nicknameFeedback, setNicknameFeedback] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [detailsInput, setDetailsInput] = useState('');
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);
  const [requestTone, setRequestTone] = useState<'success' | 'error'>('success');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const tabs: Array<{ key: 'overview' | 'transactions' | 'settings'; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'transactions', label: 'Transaction Requests' },
    { key: 'settings', label: 'Privacy Settings' },
  ];

  useEffect(() => {
    const tab = searchParams.get('tab');

    if (tab === 'overview' || tab === 'transactions' || tab === 'settings') {
      setActiveTab(tab);
    }
  }, [searchParams]);

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

  useEffect(() => {
    if (!selectedLinkId && linkedGuardians[0]) {
      setSelectedLinkId(linkedGuardians[0].id);
    }
  }, [linkedGuardians, selectedLinkId]);

  const alerts = useMemo(() => {
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

    pendingOutgoingRequests.forEach((request) => {
      items.push({
        id: `link-${request.id}`,
        type: 'warning' as const,
        title: 'Link request pending',
        detail: `Waiting for ${request.targetSerial} to respond.`,
        timestamp: request.createdAt,
      });
    });

    transactionRequests.slice(0, 5).forEach((request) => {
      const guardianName =
        request.linkNickname || request.guardianName || request.guardianSerial || 'your guardian';

      items.push({
        id: `tx-${request.id}`,
        type:
          request.status === 'approved'
            ? ('success' as const)
            : request.status === 'rejected'
              ? ('warning' as const)
              : ('info' as const),
        title:
          request.status === 'approved'
            ? 'Transaction request approved'
            : request.status === 'rejected'
              ? 'Transaction request rejected'
              : 'Transaction request pending',
        detail:
          request.status === 'pending'
            ? `${guardianName} has not reviewed ${request.title} yet.`
            : request.status === 'approved'
              ? `${guardianName} approved ${request.title}.`
              : `${guardianName} rejected ${request.title}${request.rejectionReason ? `: ${request.rejectionReason}` : '.'}`,
        timestamp: request.resolvedAt ?? request.createdAt,
      });
    });

    return items.sort(
      (first, second) =>
        new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime(),
    );
  }, [linkedGuardians, pendingOutgoingRequests, transactionRequests]);

  const primaryGuardian = linkedGuardians[0];
  const selectedGuardian = linkedAccounts.find((link) => link.requestId === selectedLinkId);
  const selectedGuardianSettings = selectedGuardian?.guardianSettings;
  const isEmergencyLocked = selectedGuardianSettings?.emergencyLock ?? false;
  const displayName = getDisplayName();

  const startEditingNickname = (guardianId: string, currentNickname: string) => {
    setEditingGuardianId(guardianId);
    setNicknameInput(currentNickname);
    setNicknameFeedback(null);
  };

  const handleSaveNickname = async (guardianId: string) => {
    const success = await updateLinkNickname(guardianId, nicknameInput);

    if (success) {
      setNicknameFeedback('Guardian nickname updated.');
      setEditingGuardianId(null);
      setNicknameInput('');
      return;
    }

    setNicknameFeedback('Unable to update guardian nickname.');
  };

  const handleSubmitTransactionRequest = async () => {
    setRequestFeedback(null);

    if (!selectedLinkId) {
      setRequestTone('error');
      setRequestFeedback('Choose a guardian before submitting a request.');
      return;
    }

    if (isEmergencyLocked) {
      setRequestTone('error');
      setRequestFeedback('Your guardian has temporarily locked transaction requests.');
      return;
    }

    setIsSubmittingRequest(true);

    try {
      const createdRequest = await createRequest({
        linkId: selectedLinkId,
        amount: Number(amountInput),
        title: titleInput,
        reason: reasonInput,
        details: detailsInput,
      });

      if (createdRequest.status === 'rejected') {
        setRequestTone('error');
        setRequestFeedback(
          createdRequest.rejectionReason ||
            'This request was automatically blocked by your guardian safety settings.',
        );
      } else {
        setRequestTone('success');
        setRequestFeedback('Transaction request sent to your guardian.');
      }
      setAmountInput('');
      setTitleInput('');
      setReasonInput('');
      setDetailsInput('');
    } catch (error) {
      setRequestTone('error');
      setRequestFeedback(
        error instanceof Error ? error.message : 'Unable to submit transaction request.',
      );
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={`Welcome back, ${displayName}`}
        description="Track your live guardian protection status and request funds when you need them."
      />

      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 p-6">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10" />
        <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <span className="text-sm text-white/80">Protection Status</span>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-white/80" />
              <span className="text-xs text-white/80">
                {primaryGuardian ? 'Guardian Protected' : 'Protection Pending'}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-3xl font-bold text-white">
              {primaryGuardian
                ? primaryGuardian.name
                : pendingOutgoingRequests.length > 0
                  ? 'Waiting for response'
                  : 'No guardian linked'}
            </p>
            <p className="mt-2 text-sm text-white/70">
              {primaryGuardian
                ? `${primaryGuardian.email || primaryGuardian.serial} is actively linked to your account.`
                : pendingOutgoingRequests.length > 0
                  ? `You have ${pendingOutgoingRequests.length} guardian link request${pendingOutgoingRequests.length === 1 ? '' : 's'} pending.`
                  : 'Open the linking page to send a guardian request.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/guardian-link')}
            className="rounded-xl bg-white/20 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/30"
          >
            Open Linking Setup
          </button>
        </div>
      </div>

      <GlassPanel padding="sm" className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700">
              <User className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="font-medium text-white">
                {primaryGuardian ? `Your Guardian: ${primaryGuardian.name}` : 'No guardian linked yet'}
              </p>
              <p className="text-sm text-slate-400">
                {primaryGuardian
                  ? primaryGuardian.email || `Serial ID: ${primaryGuardian.serial}`
                  : pendingOutgoingRequests.length > 0
                    ? 'A guardian link request is still waiting for approval.'
                    : 'Send a link request to turn on live guardian protection.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {primaryGuardian ? (
              <>
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span className="text-sm text-emerald-400">Active Protection</span>
              </>
            ) : pendingOutgoingRequests.length > 0 ? (
              <>
                <Clock className="h-5 w-5 text-amber-400" />
                <span className="text-sm text-amber-400">Awaiting Response</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-slate-400" />
                <span className="text-sm text-slate-400">Not Linked</span>
              </>
            )}
          </div>
        </div>
      </GlassPanel>

      <SegmentedTabs activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <StatCard
              label="Guardian"
              value={linkedGuardians.length}
              icon={Shield}
              iconWrapperClassName="bg-cyan-500/20"
              iconClassName="text-cyan-400"
            />
            <StatCard
              label="Pending"
              value={pendingRequests.length}
              icon={Clock}
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
              icon={XCircle}
              iconWrapperClassName="bg-red-500/20"
              iconClassName="text-red-400"
            />
          </div>

          <GlassPanel
            title="Your Guardian"
            description="Live guardian records synced from the same database used by the linking flow."
          >
            <div className="space-y-4">
              {linkedGuardians.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-900/30 px-4 py-8 text-center text-sm text-slate-400">
                  No guardian has been linked yet.
                </div>
              ) : (
                linkedGuardians.map((guardian) => {
                  const isEditing = editingGuardianId === guardian.id;

                  return (
                    <div key={guardian.id} className="rounded-xl bg-slate-900/50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700">
                            <Shield className="h-6 w-6 text-cyan-300" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{guardian.name}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                              {guardian.email && (
                                <span className="inline-flex items-center gap-1.5">
                                  <Mail className="h-3.5 w-3.5" />
                                  {guardian.email}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1.5">
                                <Link2 className="h-3.5 w-3.5" />
                                {guardian.serial}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                              Linked on {formatTimestamp(guardian.linkedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                            Active
                          </span>
                          <button
                            type="button"
                            onClick={() => startEditingNickname(guardian.id, guardian.name)}
                            className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200 transition-all hover:bg-cyan-500/20"
                          >
                            <PencilLine className="h-3.5 w-3.5" />
                            Edit Nickname
                          </button>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/35 p-4">
                          <label className="mb-2 block text-sm font-medium text-slate-300">
                            Guardian Nickname
                          </label>
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                              type="text"
                              value={nicknameInput}
                              onChange={(event) => setNicknameInput(event.target.value)}
                              className="w-full rounded-xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                              placeholder="Enter a nickname"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleSaveNickname(guardian.id)}
                                className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingGuardianId(null);
                                  setNicknameInput('');
                                  setNicknameFeedback(null);
                                }}
                                className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-slate-600 hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {nicknameFeedback && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {nicknameFeedback}
                </div>
              )}
            </div>
          </GlassPanel>

          <GlassPanel
            title="Protection Alerts"
            description="Live updates from your guardian link and transaction-request activity."
          >
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <p className="py-8 text-center text-slate-400">No protection alerts yet.</p>
              ) : (
                alerts.map((alert) => (
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
                        <p className="mt-2 text-xs text-slate-500">{formatTimestamp(alert.timestamp)}</p>
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
        <div className="space-y-6">
          <GlassPanel
            title="Request a Transaction"
            description="Choose a guardian, set the amount, and explain why you need the money."
          >
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                {isEmergencyLocked && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    Your selected guardian has emergency lock enabled. New transaction requests are temporarily blocked.
                  </div>
                )}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Guardian
                  </label>
                  <select
                    value={selectedLinkId}
                    onChange={(event) => setSelectedLinkId(event.target.value)}
                    disabled={linkedGuardians.length === 0}
                    className="w-full rounded-xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                  >
                    {linkedGuardians.length === 0 ? (
                      <option value="">No guardian linked</option>
                    ) : (
                      linkedGuardians.map((guardian) => (
                        <option key={guardian.id} value={guardian.id}>
                          {guardian.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amountInput}
                      onChange={(event) => setAmountInput(event.target.value)}
                      className="w-full rounded-xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                      placeholder="250"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Request Title
                    </label>
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(event) => setTitleInput(event.target.value)}
                      className="w-full rounded-xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                      placeholder="School trip payment"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Reason
                  </label>
                  <input
                    type="text"
                    value={reasonInput}
                    onChange={(event) => setReasonInput(event.target.value)}
                    className="w-full rounded-xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="Need payment for next week's activity"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Additional Details
                  </label>
                  <textarea
                    value={detailsInput}
                    onChange={(event) => setDetailsInput(event.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-slate-700/70 bg-slate-950/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="Add any extra details your guardian should know."
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSubmitTransactionRequest}
                  disabled={isSubmittingRequest || linkedGuardians.length === 0 || isEmergencyLocked}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <MessageSquare className="h-5 w-5" />
                  {isSubmittingRequest
                    ? 'Sending Request...'
                    : isEmergencyLocked
                      ? 'Requests Locked by Guardian'
                      : 'Send to Guardian'}
                </button>

                {requestFeedback && (
                  <div
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      requestTone === 'success'
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        : 'border-red-500/30 bg-red-500/10 text-red-200'
                    }`}
                  >
                    {requestFeedback}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-5">
                <h3 className="text-lg font-semibold text-white">Before You Send</h3>
                <div className="mt-4 space-y-4 text-sm text-slate-300">
                  <p>Include the exact amount you need so your guardian can approve quickly.</p>
                  <p>Use the title for what the money is for, and the reason/details to explain why it matters.</p>
                  <p>Once your guardian approves or rejects, this page will update automatically.</p>
                </div>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel
            title="Your Transaction Requests"
            description="Live request history with guardian decisions and rejection reasons."
          >
            <div className="space-y-4">
              {isTransactionsLoading ? (
                <p className="py-8 text-center text-slate-400">Loading transaction requests...</p>
              ) : transactionRequests.length === 0 ? (
                <p className="py-8 text-center text-slate-400">No transaction requests yet.</p>
              ) : (
                transactionRequests.map((request) => {
                  const guardianName =
                    request.linkNickname || request.guardianName || request.guardianSerial || 'Guardian';

                  return (
                    <div
                      key={request.id}
                      className={`rounded-xl border p-4 ${
                        request.status === 'approved'
                          ? 'border-emerald-500/20 bg-emerald-500/10'
                          : request.status === 'rejected'
                            ? 'border-red-500/20 bg-red-500/10'
                            : 'border-amber-500/20 bg-slate-900/50'
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <p className="text-lg font-semibold text-white">{request.title}</p>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                request.status === 'approved'
                                  ? 'bg-emerald-500/15 text-emerald-300'
                                  : request.status === 'rejected'
                                    ? 'bg-red-500/15 text-red-300'
                                    : 'bg-amber-500/15 text-amber-300'
                              }`}
                            >
                              {request.status === 'pending'
                                ? 'Pending'
                                : request.status === 'approved'
                                  ? 'Approved'
                                  : 'Rejected'}
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-white">{formatCurrency(request.amount)}</p>
                          <p className="text-sm text-slate-300">
                            <span className="font-medium text-white">Reason:</span> {request.reason}
                          </p>
                          {request.details && (
                            <p className="text-sm text-slate-400">{request.details}</p>
                          )}
                          <p className="text-xs text-slate-500">
                            Sent to {guardianName} on {formatTimestamp(request.createdAt)}
                          </p>
                          {request.rejectionReason && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                              <span className="font-semibold">Guardian reason:</span> {request.rejectionReason}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 self-start">
                          {request.status === 'approved' ? (
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                          ) : request.status === 'rejected' ? (
                            <XCircle className="h-5 w-5 text-red-400" />
                          ) : (
                            <Clock className="h-5 w-5 text-amber-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </GlassPanel>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <GlassPanel
            title="Privacy Settings"
            description="These remain placeholder controls, but the transaction request flow above is fully live."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-4">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">Share Transaction History</p>
                    <p className="text-sm text-slate-400">Allow guardian to view your transaction history</p>
                  </div>
                </div>
                <button className="relative h-6 w-12 rounded-full bg-cyan-500 opacity-60">
                  <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white" />
                </button>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">Transaction Notifications</p>
                    <p className="text-sm text-slate-400">Get notified when your guardian reviews requests</p>
                  </div>
                </div>
                <button className="relative h-6 w-12 rounded-full bg-cyan-500 opacity-60">
                  <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white" />
                </button>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-4">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">Large Transaction Approval</p>
                    <p className="text-sm text-slate-400">Require guardian approval before large transfers</p>
                  </div>
                </div>
                <button className="relative h-6 w-12 rounded-full bg-cyan-500 opacity-60">
                  <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white" />
                </button>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel title="Guardian Contact">
            <div className="space-y-4">
              <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900/50 p-4 transition-colors hover:bg-slate-700/50">
                <MessageSquare className="h-5 w-5 text-cyan-400" />
                <span className="text-white">Message Guardian</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/guardian-link')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900/50 p-4 transition-colors hover:bg-slate-700/50"
              >
                <Link2 className="h-5 w-5 text-amber-400" />
                <span className="text-white">Manage Guardian Linking</span>
              </button>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
