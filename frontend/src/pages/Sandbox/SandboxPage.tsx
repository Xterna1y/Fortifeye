import { useMemo, useState } from "react";
import {
  Shield,
  Globe,
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  X,
  Maximize2,
  Minimize2,
  Copy,
  Clock,
  Fingerprint,
  WifiOff,
  History,
  Trash2,
  Search,
} from "lucide-react";
import {
  getAiModeLabel,
  getSandboxVerdict,
  isRealAiEnabled,
  isSandboxTestEventsEnabled,
  openSandbox,
  simulateSandboxThreat,
  type AnalysisResult,
} from "../../services/api";

type SessionStatus = "loading" | "active" | "blocked" | "error";
type HistoryStatus = "safe" | "blocked" | "warning";

interface SandboxSession {
  id: string;
  url: string;
  status: SessionStatus;
  startTime: string;
  blockedElements: number;
  verdict?: AnalysisResult;
  expiresAt?: string;
  error?: string;
}

interface HistoryItem {
  id: string;
  url: string;
  timestamp: string;
  blockedElements: number;
  status: HistoryStatus;
}

const formatNow = () =>
  new Date().toLocaleString([], {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });

const getSessionStatusFromVerdict = (verdict: AnalysisResult): SessionStatus =>
  verdict.recommended_action === "block" ? "blocked" : "active";

const getHistoryStatusFromVerdict = (verdict: AnalysisResult): HistoryStatus =>
  verdict.recommended_action === "block"
    ? "blocked"
    : verdict.recommended_action === "warn"
      ? "warning"
      : "safe";

export default function SandboxPage() {
  const [url, setUrl] = useState("");
  const [sessions, setSessions] = useState<SandboxSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageError, setPageError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const currentSession = useMemo(
    () => sessions.find((session) => session.id === activeSession) || null,
    [activeSession, sessions],
  );

  const filteredHistory = history.filter((item) =>
    item.url.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const upsertHistoryFromVerdict = (
    sessionId: string,
    sessionUrl: string,
    verdict: AnalysisResult,
  ) => {
    const nextHistoryItem: HistoryItem = {
      id: sessionId,
      url: sessionUrl,
      timestamp: formatNow(),
      blockedElements: verdict.patterns.length,
      status: getHistoryStatusFromVerdict(verdict),
    };

    setHistory((previous) => {
      const remaining = previous.filter((item) => item.id !== sessionId);
      return [nextHistoryItem, ...remaining];
    });
  };

  const applyVerdictToSession = (
    sessionId: string,
    verdict: AnalysisResult,
    sessionUrl?: string,
    error = "",
  ) => {
    setSessions((previous) =>
      previous.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              status: getSessionStatusFromVerdict(verdict),
              blockedElements: verdict.patterns.length,
              verdict,
              error,
            }
          : session,
      ),
    );

    const targetSessionUrl =
      sessionUrl || sessions.find((session) => session.id === sessionId)?.url;

    if (targetSessionUrl) {
      upsertHistoryFromVerdict(sessionId, targetSessionUrl, verdict);
    }
  };

  const handleOpenSandbox = async () => {
    if (!url.trim()) {
      return;
    }

    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    const temporarySession: SandboxSession = {
      id: `pending_${Date.now()}`,
      url: normalizedUrl,
      status: "loading",
      startTime: "Just now",
      blockedElements: 0,
    };

    setPageError("");
    setSessions((previous) => [temporarySession, ...previous]);
    setActiveSession(temporarySession.id);
    setShowUrlInput(false);
    setUrl("");

    try {
      const openedSession = await openSandbox(normalizedUrl);
      const verdict = await getSandboxVerdict(openedSession.session_id);
      const liveSession: SandboxSession = {
        id: openedSession.session_id,
        url: normalizedUrl,
        status: getSessionStatusFromVerdict(verdict),
        startTime: "Just now",
        blockedElements: verdict.patterns.length,
        verdict,
        expiresAt: openedSession.expires_at,
      };

      setSessions((previous) =>
        previous.map((session) =>
          session.id === temporarySession.id ? liveSession : session,
        ),
      );
      setActiveSession(openedSession.session_id);
      upsertHistoryFromVerdict(openedSession.session_id, normalizedUrl, verdict);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to open the sandbox session.";

      setPageError(message);
      setSessions((previous) =>
        previous.map((session) =>
          session.id === temporarySession.id
            ? {
                ...session,
                status: "error",
                error: message,
              }
            : session,
        ),
      );
    }
  };

  const handleCloseSession = (sessionId: string) => {
    setSessions((previous) => {
      const remaining = previous.filter((session) => session.id !== sessionId);

      if (activeSession === sessionId) {
        setActiveSession(remaining[0]?.id || null);
      }

      return remaining;
    });
  };

  const handleRefreshVerdict = async () => {
    if (!currentSession) {
      return;
    }

    setIsRefreshing(true);
    setPageError("");

    try {
      const verdict = await getSandboxVerdict(currentSession.id);
      applyVerdictToSession(currentSession.id, verdict, currentSession.url);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Failed to refresh the sandbox verdict.",
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRunThreatSimulation = async () => {
    if (!currentSession) {
      return;
    }

    setIsSimulating(true);
    setPageError("");

    try {
      const verdict = await simulateSandboxThreat(currentSession.id);
      applyVerdictToSession(currentSession.id, verdict, currentSession.url);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Failed to simulate sandbox threat events.",
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleReopenLink = (historyUrl: string) => {
    setUrl(historyUrl.replace("https://", "").replace("http://", ""));
    setShowUrlInput(true);
  };

  const handleCopyUrl = async () => {
    if (!currentSession) {
      return;
    }

    try {
      await navigator.clipboard.writeText(currentSession.url);
    } catch {
      setPageError("Failed to copy the current sandbox URL.");
    }
  };

  const getStatusIcon = (status: SessionStatus) => {
    switch (status) {
      case "loading":
        return <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />;
      case "active":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "blocked":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      default:
        return null;
    }
  };

  const getHistoryStatusColor = (status: HistoryStatus) => {
    switch (status) {
      case "safe":
        return "text-emerald-400 bg-emerald-500/20";
      case "blocked":
        return "text-red-400 bg-red-500/20";
      case "warning":
        return "text-orange-400 bg-orange-500/20";
      default:
        return "text-slate-400 bg-slate-500/20";
    }
  };

  const getHistoryStatusIcon = (status: HistoryStatus) => {
    switch (status) {
      case "safe":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "blocked":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Fortifeye</span>
              <span className="ml-2 px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full">
                Sandbox
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                {isRealAiEnabled() ? "Live backend AI" : "Mock frontend AI"}
              </span>
              {isSandboxTestEventsEnabled() && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  Threat simulator enabled
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showUrlInput && (
          <div className="mb-8">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                Open Link In Secure Sandbox
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                This page now opens a backend sandbox session and requests the AI
                verdict through the frontend.
              </p>

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="Enter URL (e.g. example.com)"
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 pl-10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    onKeyDown={(event) =>
                      event.key === "Enter" && handleOpenSandbox()
                    }
                  />
                  <Globe className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  onClick={handleOpenSandbox}
                  disabled={!url.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Shield className="w-5 h-5" />
                  Open In Sandbox
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Session isolation enabled</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                  <WifiOff className="w-4 h-4 text-slate-400" />
                  <span>Backend verdict fetch wired</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg text-sm text-slate-300">
                  <Fingerprint className="w-4 h-4 text-slate-400" />
                  <span>{getAiModeLabel()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {pageError && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{pageError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setShowHistory(false)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    !showHistory
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Sessions
                </button>
                <button
                  onClick={() => setShowHistory(true)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    showHistory
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  History
                </button>
              </div>

              {showHistory ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                      Link History
                    </h3>
                    {history.length > 0 && (
                      <button
                        onClick={handleClearHistory}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                        title="Clear history"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="relative mb-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search history..."
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 pl-9 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="space-y-2 max-h-[420px] overflow-y-auto">
                    {filteredHistory.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No history found</p>
                      </div>
                    ) : (
                      filteredHistory.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleReopenLink(item.url)}
                          className="w-full p-3 rounded-xl text-left bg-slate-700/30 border border-transparent hover:bg-slate-700/50 hover:border-slate-600 transition-all"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {getHistoryStatusIcon(item.status)}
                              <span className="text-white text-sm font-medium truncate">
                                {item.url.replace("https://", "").replace("http://", "")}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${getHistoryStatusColor(item.status)}`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.timestamp}
                            </span>
                            {item.blockedElements > 0 && (
                              <span className="flex items-center gap-1 text-orange-400">
                                <AlertTriangle className="w-3 h-3" />
                                {item.blockedElements} patterns
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Active Sessions
                  </h3>
                  <div className="space-y-2">
                    {sessions.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <ExternalLink className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No sessions yet</p>
                      </div>
                    ) : (
                      sessions.map((session) => (
                        <button
                          key={session.id}
                          onClick={() => {
                            setActiveSession(session.id);
                            setShowUrlInput(false);
                          }}
                          className={`w-full p-3 rounded-xl text-left transition-all ${
                            activeSession === session.id
                              ? "bg-cyan-500/20 border border-cyan-500/30"
                              : "bg-slate-700/30 border border-transparent hover:bg-slate-700/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusIcon(session.status)}
                                <span className="text-white text-sm font-medium truncate">
                                  {session.url.replace("https://", "").replace("http://", "")}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {session.startTime}
                                </span>
                                {session.blockedElements > 0 && (
                                  <span className="flex items-center gap-1 text-orange-400">
                                    <AlertTriangle className="w-3 h-3" />
                                    {session.blockedElements} patterns
                                  </span>
                                )}
                              </div>
                            </div>
                            <span
                              onClick={(event) => {
                                event.stopPropagation();
                                handleCloseSession(session.id);
                              }}
                              className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => setShowUrlInput(true)}
                    className="w-full mt-4 p-3 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white hover:border-slate-500 transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open New Link
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div
              className={`bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden ${
                isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""
              }`}
            >
              <div className="bg-slate-900/50 border-b border-slate-700/50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="ml-4 flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5 min-w-0">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span className="text-slate-400 text-sm truncate">
                      {currentSession?.url || "No session active"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFullscreen((previous) => !previous)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleRefreshVerdict}
                    disabled={!currentSession || isRefreshing}
                    className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                    />
                  </button>
                  <button
                    onClick={handleCopyUrl}
                    disabled={!currentSession}
                    className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="min-h-[540px] bg-slate-950 p-6">
                {!currentSession ? (
                  <div className="h-full min-h-[480px] flex flex-col items-center justify-center text-center">
                    <Globe className="w-16 h-16 text-slate-600 mb-4" />
                    <p className="text-white font-semibold">No Active Session</p>
                    <p className="text-slate-400 text-sm mt-2">
                      Open a URL above to test the sandbox verdict through the
                      frontend.
                    </p>
                  </div>
                ) : currentSession.status === "loading" ? (
                  <div className="h-full min-h-[480px] flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
                    <p className="text-slate-300">Opening backend sandbox session...</p>
                    <p className="text-slate-500 text-sm mt-2">
                      Requesting AI verdict
                    </p>
                  </div>
                ) : currentSession.status === "error" ? (
                  <div className="h-full min-h-[480px] flex flex-col items-center justify-center text-center">
                    <XCircle className="w-16 h-16 text-red-500 mb-4" />
                    <p className="text-white font-semibold">Sandbox Session Failed</p>
                    <p className="text-slate-400 text-sm mt-2 max-w-md">
                      {currentSession.error || "The backend sandbox request failed."}
                    </p>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div className="bg-slate-900/70 border border-slate-700/50 rounded-2xl p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-slate-400 text-sm mb-2">
                            Session Verdict
                          </p>
                          <h2 className="text-2xl font-bold text-white">
                            {currentSession.verdict?.verdict ||
                              "Sandbox analysis completed"}
                          </h2>
                          <p className="text-slate-400 mt-2 break-all">
                            {currentSession.url}
                          </p>
                        </div>
                        <div
                          className={`px-4 py-2 rounded-xl border ${
                            currentSession.status === "blocked"
                              ? "bg-red-500/15 border-red-500/30 text-red-300"
                              : currentSession.verdict?.recommended_action === "warn"
                                ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                                : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                          }`}
                        >
                          {currentSession.verdict?.recommended_action?.toUpperCase() ||
                            currentSession.status.toUpperCase()}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                        <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
                          <p className="text-slate-400 text-sm">Risk Score</p>
                          <p className="text-3xl font-bold text-white mt-1">
                            {currentSession.verdict?.risk_score ?? 0}
                          </p>
                        </div>
                        <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
                          <p className="text-slate-400 text-sm">Risk Level</p>
                          <p className="text-3xl font-bold text-white mt-1">
                            {currentSession.verdict?.risk_level || "N/A"}
                          </p>
                        </div>
                        <div className="bg-slate-800/70 rounded-xl p-4 border border-slate-700/50">
                          <p className="text-slate-400 text-sm">Detected Patterns</p>
                          <p className="text-3xl font-bold text-white mt-1">
                            {currentSession.blockedElements}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/70 border border-slate-700/50 rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-3">
                        Explanation
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        {currentSession.verdict?.explanation ||
                          "No explanation available yet."}
                      </p>

                      {currentSession.verdict?.patterns &&
                        currentSession.verdict.patterns.length > 0 && (
                          <div className="mt-5">
                            <h4 className="text-white font-medium mb-3">Patterns</h4>
                            <div className="flex flex-wrap gap-2">
                              {currentSession.verdict.patterns.map((pattern) => (
                                <span
                                  key={pattern}
                                  className="px-3 py-1 bg-red-500/15 border border-red-500/30 text-red-300 rounded-full text-sm"
                                >
                                  {pattern.replace(/_/g, " ")}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {currentSession.verdict?.reasons &&
                        currentSession.verdict.reasons.length > 0 && (
                          <div className="mt-5">
                            <h4 className="text-white font-medium mb-3">Reasons</h4>
                            <div className="space-y-2">
                              {currentSession.verdict.reasons.map((reason, index) => (
                                <div
                                  key={`${reason}-${index}`}
                                  className="px-4 py-3 rounded-xl border border-slate-700/50 bg-slate-800/60 text-slate-300"
                                >
                                  {reason}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    <div className="bg-slate-900/70 border border-slate-700/50 rounded-2xl p-6">
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={handleRefreshVerdict}
                          disabled={isRefreshing}
                          className="px-4 py-3 bg-slate-700/70 border border-slate-600/50 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                          />
                          Refresh Verdict
                        </button>
                        {isSandboxTestEventsEnabled() && (
                          <button
                            onClick={handleRunThreatSimulation}
                            disabled={isSimulating}
                            className="px-4 py-3 bg-gradient-to-r from-amber-500 to-red-500 text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isSimulating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <AlertTriangle className="w-4 h-4" />
                            )}
                            Run Threat Simulation
                          </button>
                        )}
                      </div>

                      <div className="mt-4 text-sm text-slate-400 space-y-2">
                        <p>
                          This page can now test the sandbox verdict path from the
                          frontend.
                        </p>
                        {isSandboxTestEventsEnabled() && (
                          <p>
                            Threat simulation is a removable dev helper for now. It
                            sends representative phishing events until you have a real
                            sandbox browser emitting them automatically.
                          </p>
                        )}
                        {currentSession.expiresAt && (
                          <p>Expires at: {new Date(currentSession.expiresAt).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-900/50 border-t border-slate-700/50 px-4 py-2 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Sandbox UI Connected
                  </span>
                  <span>{getAiModeLabel()}</span>
                </div>
                <div className="flex items-center gap-4">
                  {currentSession?.verdict?.model && (
                    <span className="text-slate-300">
                      Model: {currentSession.verdict.model}
                    </span>
                  )}
                  <span>Isolation: Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
