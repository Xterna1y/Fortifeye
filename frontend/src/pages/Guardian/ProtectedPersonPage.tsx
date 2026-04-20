import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import GlassPanel from '../../components/ui/GlassPanel';
import PageHeader from '../../components/ui/PageHeader';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import StatCard from '../../components/ui/StatCard';
import useGuardianLinking from '../../hooks/useGuardianLinking';
import { guardianLinkingService } from '../../services/guardianLinkingService';
import { getStoredUser } from '../../utils/userSession';

interface GuardianRequestHistoryItem {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: 'guardian' | 'dependent';
  status: 'pending' | 'accepted' | 'rejected';
  nickname?: string | null;
  createdAt: string;
  respondedAt?: string;
  requesterName?: string | null;
  requesterEmail?: string | null;
  requesterSerial?: string | null;
  targetName?: string | null;
  targetEmail?: string | null;
  targetSerial?: string | null;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'settings'>('overview');
  const [requestHistory, setRequestHistory] = useState<GuardianRequestHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const user = getStoredUser();
  const {
    linkedAccounts,
    pendingOutgoingRequests,
    updateLinkNickname,
  } = useGuardianLinking();
  const [editingGuardianId, setEditingGuardianId] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState('');
  const [nicknameFeedback, setNicknameFeedback] = useState<string | null>(null);

  const tabs: Array<{ key: 'overview' | 'requests' | 'settings'; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'requests', label: 'Request History' },
    { key: 'settings', label: 'Privacy Settings' },
  ];

  const loadHistory = useCallback(
    async (cancelled = false) => {
      setIsHistoryLoading(true);
      const nextHistory = await guardianLinkingService.getRequestHistory();
      if (!cancelled) {
        setRequestHistory(nextHistory);
        setIsHistoryLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    loadHistory(cancelled);
    const intervalId = window.setInterval(loadHistory, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [loadHistory]);

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

  const approvedCount = requestHistory.filter((request) => request.status === 'accepted').length;
  const blockedCount = requestHistory.filter((request) => request.status === 'rejected').length;
  const pendingCount = requestHistory.filter((request) => request.status === 'pending').length;
  const completedRequests = requestHistory.filter((request) => request.status !== 'pending');

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
        id: `pending-${request.id}`,
        type: 'warning' as const,
        title: 'Guardian request pending',
        detail: `Waiting for ${request.targetSerial} to respond.`,
        timestamp: request.createdAt,
      });
    });

    completedRequests.slice(0, 5).forEach((request) => {
      const counterpartyName =
        request.fromUserId === user?.id
          ? request.targetName || request.targetSerial || 'the other user'
          : request.requesterName || request.requesterSerial || 'the other user';

      items.push({
        id: `history-${request.id}`,
        type: request.status === 'accepted' ? ('success' as const) : ('info' as const),
        title:
          request.status === 'accepted'
            ? 'Guardian request approved'
            : 'Guardian request blocked',
        detail: `${counterpartyName} ${request.status === 'accepted' ? 'accepted' : 'rejected'} the request.`,
        timestamp: request.respondedAt ?? request.createdAt,
      });
    });

    return items.sort(
      (first, second) =>
        new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime(),
    );
  }, [completedRequests, linkedGuardians, pendingOutgoingRequests, user?.id]);

  const primaryGuardian = linkedGuardians[0];
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={`Welcome back, ${displayName}`}
        description="Track your live guardian protection status and request activity."
      />

      <div className="bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-2xl p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-4 mb-4">
            <span className="text-white/80 text-sm">Protection Status</span>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-white/80" />
              <span className="text-white/80 text-xs">
                {primaryGuardian ? 'Guardian Protected' : 'Protection Pending'}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-3xl font-bold text-white">
              {primaryGuardian ? primaryGuardian.name : pendingOutgoingRequests.length > 0 ? 'Waiting for response' : 'No guardian linked'}
            </p>
            <p className="mt-2 text-white/70 text-sm">
              {primaryGuardian
                ? `${primaryGuardian.email || primaryGuardian.serial} is actively linked to your account.`
                : pendingOutgoingRequests.length > 0
                  ? `You have ${pendingOutgoingRequests.length} guardian request${pendingOutgoingRequests.length === 1 ? '' : 's'} pending.`
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
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-white font-medium">
                {primaryGuardian ? `Your Guardian: ${primaryGuardian.name}` : 'No guardian linked yet'}
              </p>
              <p className="text-slate-400 text-sm">
                {primaryGuardian
                  ? primaryGuardian.email || `Serial ID: ${primaryGuardian.serial}`
                  : pendingOutgoingRequests.length > 0
                    ? 'A guardian request is still waiting for approval.'
                    : 'Send a request to turn on live guardian protection.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {primaryGuardian ? (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 text-sm">Active Protection</span>
              </>
            ) : pendingOutgoingRequests.length > 0 ? (
              <>
                <Clock className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 text-sm">Awaiting Response</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-slate-400" />
                <span className="text-slate-400 text-sm">Not Linked</span>
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
              value={pendingCount}
              icon={Clock}
              iconWrapperClassName="bg-amber-500/20"
              iconClassName="text-amber-400"
            />
            <StatCard
              label="Approved"
              value={approvedCount}
              icon={CheckCircle}
              iconWrapperClassName="bg-emerald-500/20"
              iconClassName="text-emerald-400"
            />
            <StatCard
              label="Blocked"
              value={blockedCount}
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
                    <div
                      key={guardian.id}
                      className="rounded-xl bg-slate-900/50 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                            <Shield className="w-6 h-6 text-cyan-300" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{guardian.name}</p>
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
                            <p className="text-slate-500 text-xs mt-2">
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
            description="Live alerts derived from your actual guardian link state and request history."
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

      {activeTab === 'requests' && (
        <div className="space-y-6">
          <GlassPanel
            title="Pending Requests"
            description="Outgoing guardian requests that still need a response."
          >
            <div className="space-y-4">
              {pendingOutgoingRequests.length === 0 ? (
                <p className="py-8 text-center text-slate-400">No pending guardian requests.</p>
              ) : (
                pendingOutgoingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-xl border border-amber-500/20 bg-slate-900/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">
                          Sent to {request.targetSerial}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Waiting for the other user to accept your guardian link request.
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          Sent {formatTimestamp(request.createdAt)}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
                        Pending
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassPanel>

          <GlassPanel
            title="Request History"
            description="Approved and blocked outcomes loaded from the backend request history."
          >
            <div className="space-y-3">
              {isHistoryLoading ? (
                <p className="py-8 text-center text-slate-400">Loading request history...</p>
              ) : completedRequests.length === 0 ? (
                <p className="py-8 text-center text-slate-400">No completed request history yet.</p>
              ) : (
                completedRequests.map((request) => {
                  const counterpartyName =
                    request.fromUserId === user?.id
                      ? request.targetName || request.targetSerial || 'Unknown user'
                      : request.requesterName || request.requesterSerial || 'Unknown user';

                  return (
                    <div
                      key={request.id}
                      className="flex items-center justify-between gap-4 rounded-lg bg-slate-900/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        {request.status === 'accepted' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <div>
                          <p className="text-white text-sm">
                            Request with {counterpartyName}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {formatTimestamp(request.respondedAt ?? request.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          request.status === 'accepted'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-red-500/15 text-red-300'
                        }`}
                      >
                        {request.status === 'accepted' ? 'Approved' : 'Blocked'}
                      </span>
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
            description="These controls are still frontend-only placeholders, but the status above is now live."
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-white font-medium">Share Transaction History</p>
                    <p className="text-slate-400 text-sm">Allow guardian to view your transaction history</p>
                  </div>
                </div>
                <button className="w-12 h-6 bg-cyan-500 rounded-full relative opacity-60">
                  <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-white font-medium">Transaction Notifications</p>
                    <p className="text-slate-400 text-sm">Get notified when guardian reviews your activity</p>
                  </div>
                </div>
                <button className="w-12 h-6 bg-cyan-500 rounded-full relative opacity-60">
                  <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-white font-medium">Large Transaction Approval</p>
                    <p className="text-slate-400 text-sm">Require guardian approval for transactions over a threshold</p>
                  </div>
                </div>
                <button className="w-12 h-6 bg-cyan-500 rounded-full relative opacity-60">
                  <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel title="Guardian Contact">
            <div className="space-y-4">
              <button className="w-full flex items-center justify-center gap-2 p-4 bg-slate-900/50 hover:bg-slate-700/50 rounded-xl transition-colors">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                <span className="text-white">Message Guardian</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/guardian-link')}
                className="w-full flex items-center justify-center gap-2 p-4 bg-slate-900/50 hover:bg-slate-700/50 rounded-xl transition-colors"
              >
                <Link2 className="w-5 h-5 text-amber-400" />
                <span className="text-white">Manage Guardian Linking</span>
              </button>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
