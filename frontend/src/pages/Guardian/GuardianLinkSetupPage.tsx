import { useState } from 'react';
import {
  CheckCircle,
  Copy,
  Link2,
  MailPlus,
  Loader2,
  XCircle,
} from 'lucide-react';
import GlassPanel from '../../components/ui/GlassPanel';
import PageHeader from '../../components/ui/PageHeader';
import useGuardianLinking from '../../hooks/useGuardianLinking';

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

export default function GuardianLinkSetupPage() {
  const {
    isLoading,
    currentRole,
    currentSerial,
    targetRole,
    linkedAccounts,
    pendingIncomingRequests,
    pendingOutgoingRequests,
    sendRequest,
    acceptRequest,
    declineRequest,
  } = useGuardianLinking();
  
  const [targetSerialInput, setTargetSerialInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopySerial = async () => {
    try {
      await navigator.clipboard.writeText(currentSerial);
      setFeedbackTone('success');
      setFeedback('Serial ID copied.');
    } catch {
      setFeedbackTone('error');
      setFeedback('Could not copy the serial ID from this browser.');
    }
  };

  const handleSendRequest = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    const result = await sendRequest(targetSerialInput);
    setIsSubmitting(false);

    if (!result.ok) {
      setFeedbackTone('error');
      setFeedback(result.error ?? 'Unable to send request.');
      return;
    }

    setFeedbackTone('success');
    setFeedback(`Link request sent to ${targetSerialInput.trim().toUpperCase()}.`);
    setTargetSerialInput('');
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Guardian Linking Setup"
        description="Share your unique Serial ID with others to link your accounts. Once linked, guardians can monitor their dependents' safety."
      />

      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <GlassPanel
          title="Your Serial ID"
          description={`Share this ID with the person you want to link with.`}
        >
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5">
            <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Your unique serial</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-2xl font-bold tracking-[0.18em] text-white">{currentSerial}</p>
              <button
                type="button"
                onClick={handleCopySerial}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700/70 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-200 transition-all hover:border-slate-600"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Current Identity: <span className="font-semibold text-cyan-400 capitalize">{currentRole}</span>
          </p>
        </GlassPanel>

        <GlassPanel
          title="Send a Link Request"
          description={`Enter the Serial ID of the user you want to connect with.`}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Target Serial ID
              </label>
              <input
                type="text"
                value={targetSerialInput}
                onChange={(event) => setTargetSerialInput(event.target.value.toUpperCase())}
                placeholder="FE-XXXXXX"
                className="w-full rounded-xl border border-slate-600/60 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleSendRequest}
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <MailPlus className="h-5 w-5" />}
              Send Link Request
            </button>
            {feedback && (
              <div
                className={`rounded-xl border px-4 py-3 text-sm ${
                  feedbackTone === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-red-500/30 bg-red-500/10 text-red-200'
                }`}
              >
                {feedback}
              </div>
            )}
          </div>
        </GlassPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <GlassPanel title="Incoming Requests" description="Requests sent to you appear here.">
          <div className="space-y-4">
            {pendingIncomingRequests.length === 0 ? (
              <p className="text-sm text-slate-400">No incoming requests right now.</p>
            ) : (
              pendingIncomingRequests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-amber-500/20 bg-slate-900/50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-white">{request.requesterName || request.requesterEmail}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Requested on {formatTimestamp(request.createdAt)} to be your {request.requesterRole === 'guardian' ? 'Guardian' : 'Dependent'}.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const name = window.prompt("Enter a nickname for this person:", request.requesterName || "");
                          if (name !== null) {
                            acceptRequest(request.id, name);
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => declineRequest(request.id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                      >
                        <XCircle className="h-4 w-4" />
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassPanel>

        <div className="space-y-6">
          <GlassPanel title="Linked Accounts" description="Users you are currently connected with.">
            <div className="space-y-4">
              {linkedAccounts.length === 0 ? (
                <p className="text-sm text-slate-400">No linked accounts yet.</p>
              ) : (
                linkedAccounts.map((link) => (
                  <div key={link.requestId} className="rounded-2xl border border-emerald-500/20 bg-slate-900/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{link.nickname || link.serial}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          Linked {formatTimestamp(link.linkedAt)} as your {link.role}.
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassPanel>

          <GlassPanel title="Outgoing Requests" description="Requests you have sent and are awaiting a response.">
            <div className="space-y-4">
              {pendingOutgoingRequests.length === 0 ? (
                <p className="text-sm text-slate-400">No pending outgoing requests.</p>
              ) : (
                pendingOutgoingRequests.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15">
                        <Link2 className="h-5 w-5 text-cyan-300" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{request.targetSerial}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          Sent {formatTimestamp(request.createdAt)}. Awaiting response.
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassPanel>
        </div>
      </div>
    </main>
  );
}
