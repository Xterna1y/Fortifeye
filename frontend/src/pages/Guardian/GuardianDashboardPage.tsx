import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  DollarSign, 
  Lock, 
  AlertTriangle,
  CheckCircle,
  User,
  Ban,
  Link2,
  Mail,
} from 'lucide-react';
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

export default function GuardianDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'settings'>('overview');
  const [requestHistory, setRequestHistory] = useState<GuardianRequestHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const user = getStoredUser();
  const {
    linkedAccounts,
    pendingIncomingRequests,
    removeLink,
    acceptRequest,
    declineRequest,
  } = useGuardianLinking();
  const tabs: Array<{ key: 'overview' | 'requests' | 'settings'; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'requests', label: 'Link Requests' },
    { key: 'settings', label: 'Settings' },
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

  const pendingCount = requestHistory.filter((request) => request.status === 'pending').length;
  const approvedCount = requestHistory.filter((request) => request.status === 'accepted').length;
  const blockedCount = requestHistory.filter((request) => request.status === 'rejected').length;
  const completedRequests = requestHistory.filter((request) => request.status !== 'pending');

  const resolveCounterparty = (request: GuardianRequestHistoryItem) => {
    const isRequester = request.fromUserId === user?.id;

    return isRequester
      ? {
          name: request.targetName || request.targetSerial || 'Unknown user',
          email: request.targetEmail,
          serial: request.targetSerial,
          direction: 'Outgoing',
        }
      : {
          name: request.requesterName || request.requesterSerial || 'Unknown user',
          email: request.requesterEmail,
          serial: request.requesterSerial,
          direction: 'Incoming',
        };
  };

  const handleApproveRequest = async (requestId: string) => {
    await acceptRequest(requestId);
    await loadHistory();
  };

  const handleBlockRequest = async (requestId: string) => {
    await declineRequest(requestId);
    await loadHistory();
  };

  return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Guardian Dashboard"
          description="Monitor and protect your loved ones from financial scams."
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
                <div key={link.requestId} className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/50 p-4">
                  <div>
                    <p className="font-medium text-white">{link.nickname || link.name || link.serial}</p>
                    {link.email && (
                      <p className="text-sm text-slate-400">{link.email}</p>
                    )}
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="Protected" value={protectedPeople.length} icon={User} iconWrapperClassName="bg-cyan-500/20" iconClassName="text-cyan-400" />
              <StatCard label="Pending" value={pendingCount} icon={AlertTriangle} iconWrapperClassName="bg-amber-500/20" iconClassName="text-amber-400" />
              <StatCard label="Approved" value={approvedCount} icon={CheckCircle} iconWrapperClassName="bg-emerald-500/20" iconClassName="text-emerald-400" />
              <StatCard label="Blocked" value={blockedCount} icon={Ban} iconWrapperClassName="bg-red-500/20" iconClassName="text-red-400" />
            </div>

            {/* Protected People List */}
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
                    <div key={person.id} className="flex items-center justify-between gap-4 p-4 bg-slate-900/50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{person.name}</p>
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
                          <p className="text-slate-500 text-xs mt-2">
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
          </div>
        )}

        {/* Link Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <GlassPanel
              title="Pending Link Requests"
              description="Approve or reject linking requests from users who want to connect with you."
            >
              <div className="space-y-4">
                {pendingIncomingRequests.map((request) => (
                  <div key={request.id} className="p-4 bg-slate-900/50 rounded-xl border border-amber-500/20">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-medium">
                            {request.requesterName || request.requesterSerial}
                          </span>
                          <span className="rounded-full bg-cyan-500/15 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">
                            {request.requesterRole}
                          </span>
                        </div>
                        {request.requesterEmail && (
                          <p className="text-slate-400 text-sm">{request.requesterEmail}</p>
                        )}
                        <p className="mt-2 text-sm text-slate-500">
                          Requested on {formatTimestamp(request.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleBlockRequest(request.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                          Block
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingIncomingRequests.length === 0 && (
                  <p className="text-slate-400 text-center py-8">No pending link requests</p>
                )}
              </div>
            </GlassPanel>

            {/* Recent Activity */}
            <GlassPanel
              title="Recent Link Activity"
              description="Accepted and blocked requests are loaded from the linking request history."
            >
              <div className="space-y-3">
                {isHistoryLoading ? (
                  <p className="py-8 text-center text-slate-400">Loading request history...</p>
                ) : completedRequests.length === 0 ? (
                  <p className="py-8 text-center text-slate-400">No completed link activity yet.</p>
                ) : (
                  completedRequests.map((request) => {
                    const counterparty = resolveCounterparty(request);
                    return (
                      <div key={request.id} className="flex items-center justify-between gap-4 p-3 bg-slate-900/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {request.status === 'accepted' ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Ban className="w-5 h-5 text-red-400" />
                          )}
                          <div>
                            <p className="text-white text-sm">
                              {counterparty.direction} request with {counterparty.name}
                            </p>
                            <p className="text-slate-500 text-xs">
                              {counterparty.serial || 'No serial'} • {formatTimestamp(request.respondedAt ?? request.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          request.status === 'accepted'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-red-500/15 text-red-300'
                        }`}>
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

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <GlassPanel title="Guardian Settings">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-white font-medium">Transaction Alerts</p>
                      <p className="text-slate-400 text-sm">Get notified for transactions above threshold</p>
                    </div>
                  </div>
                  <input type="number" defaultValue={100} className="w-24 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-right" />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-white font-medium">View Transaction History</p>
                      <p className="text-slate-400 text-sm">Access full transaction history of protected persons</p>
                    </div>
                  </div>
                  <button className="w-12 h-6 bg-cyan-500 rounded-full relative">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-white font-medium">Block High-Risk Transactions</p>
                      <p className="text-slate-400 text-sm">Automatically block transactions flagged as high risk</p>
                    </div>
                  </div>
                  <button className="w-12 h-6 bg-cyan-500 rounded-full relative">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-white font-medium">Emergency Lock</p>
                      <p className="text-slate-400 text-sm">Immediately block all transactions for a protected person</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
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
