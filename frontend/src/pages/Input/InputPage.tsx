import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Send,
  XCircle,
} from 'lucide-react';
import GlassPanel from '../../components/ui/GlassPanel';
import PageHeader from '../../components/ui/PageHeader';
import SegmentedTabs from '../../components/ui/SegmentedTabs';
import { scanText } from '../../services/api';

type AnalysisMode = 'text' | 'voice';
type AnalysisStatus = 'idle' | 'analyzing' | 'complete';

interface AnalysisResult {
  risk_score: number;
  scam_detected: boolean;
  patterns: string[];
  explanation: string;
  recommended_action: 'allow' | 'warn' | 'block';
  reasons?: string[];
}

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultItem>>;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const getStoredUser = () => {
  const storedUser = localStorage.getItem('fortifeye.user');
  return storedUser ? JSON.parse(storedUser) : null;
};

export default function InputPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AnalysisMode>('text');
  const [text, setText] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceInterim, setVoiceInterim] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const timerRef = useRef<number | null>(null);

  const modeTabs: Array<{ key: 'text' | 'voice'; label: string }> = [
    { key: 'text', label: 'Text Analysis' },
    { key: 'voice', label: 'Voice Analysis' },
  ];

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      recognitionRef.current?.stop();
    };
  }, []);

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecognition = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    return Recognition ? new Recognition() : null;
  };

  const startRecording = async () => {
    setErrorMessage(null);
    const recognition = getRecognition();

    if (!recognition) {
      setErrorMessage('Voice analysis needs a browser with SpeechRecognition support, such as Chrome.');
      return;
    }

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-MY';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      Array.from(event.results).forEach((result) => {
        const transcript = result[0]?.transcript || '';
        const isFinal = 'isFinal' in result ? Boolean((result as ArrayLike<SpeechRecognitionResultItem> & { isFinal?: boolean }).isFinal) : false;

        if (isFinal) {
          finalTranscript += `${transcript} `;
        } else {
          interimTranscript += transcript;
        }
      });

      if (finalTranscript.trim()) {
        setVoiceTranscript((previous) => `${previous} ${finalTranscript}`.trim());
      }

      setVoiceInterim(interimTranscript.trim());
    };

    recognition.onerror = (event) => {
      setErrorMessage(event.error ? `Voice capture failed: ${event.error}` : 'Voice capture failed.');
      setIsRecording(false);
      resetTimer();
    };

    recognition.onend = () => {
      setIsRecording(false);
      resetTimer();
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsRecording(true);
      setRecordingTime(0);
      setVoiceInterim('');

      timerRef.current = window.setInterval(() => {
        setRecordingTime((previous) => previous + 1);
      }, 1000);
    } catch (error) {
      setErrorMessage('Unable to start voice recording right now.');
      setIsRecording(false);
      resetTimer();
    }
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    resetTimer();
  };

  const handleAnalyze = async () => {
    const content = mode === 'text' ? text.trim() : `${voiceTranscript} ${voiceInterim}`.trim();
    if (!content) {
      return;
    }

    setStatus('analyzing');
    setErrorMessage(null);

    try {
      const currentUser = getStoredUser();
      const payload =
        mode === 'voice'
          ? `Voice transcript:\n${content}`
          : content;

      const data = await scanText(payload, currentUser?.id);
      setResult(data as AnalysisResult);
      setStatus('complete');
    } catch (error) {
      console.error('Analysis error:', error);
      setErrorMessage('An error occurred during analysis. Please make sure the backend is running.');
      setStatus('idle');
    }
  };

  const resetAnalysis = () => {
    setStatus('idle');
    setResult(null);
    setText('');
    setVoiceTranscript('');
    setVoiceInterim('');
    setRecordingTime(0);
    setErrorMessage(null);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'block':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'warn':
        return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      default:
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'block':
        return <XCircle className="w-5 h-5" />;
      case 'warn':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const voiceContent = `${voiceTranscript} ${voiceInterim}`.trim();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader
        title="Analyze Message or Call"
        description="Paste suspicious text or speak into the mic and Fortifeye will score the risk instantly."
        action={
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-700/70 bg-slate-900/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-slate-600 hover:text-white sm:w-auto"
          >
            Back to Dashboard
          </button>
        }
      />

      <div className="mb-6 flex justify-center lg:justify-start">
        <SegmentedTabs activeTab={mode} onChange={setMode} tabs={modeTabs} className="w-full justify-center sm:w-auto sm:justify-start" />
      </div>

      <GlassPanel padding="lg" className="mb-6">
        <h2 className="mb-4 text-xl font-semibold text-white">
          {mode === 'text' ? 'Enter Message to Analyze' : 'Record Voice Message'}
        </h2>

        {mode === 'text' ? (
          <div className="relative">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste the suspicious message here... (e.g., 'Your account has been compromised. Transfer RM5000 immediately to secure your funds.')"
              className="h-52 min-h-[14rem] w-full resize-y rounded-xl border border-slate-600/50 bg-slate-900/50 px-4 py-4 text-base leading-relaxed text-white placeholder-slate-500 transition-all focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
            <p className="mt-2 text-xs text-slate-500">
              Include any details like sender, requested action, and urgency indicators.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 sm:py-10">
            <div
              className={`relative mb-6 flex h-32 w-32 items-center justify-center rounded-full ${
                isRecording
                  ? 'animate-pulse border-4 border-red-500 bg-red-500/20'
                  : 'border border-slate-600 bg-slate-700/50'
              }`}
            >
              {isRecording ? (
                <div className="flex items-center justify-center gap-1">
                  <div className="h-3 w-3 animate-bounce rounded-full bg-red-500" />
                  <div className="h-3 w-3 animate-bounce rounded-full bg-red-500" style={{ animationDelay: '0.1s' }} />
                  <div className="h-3 w-3 animate-bounce rounded-full bg-red-500" style={{ animationDelay: '0.2s' }} />
                </div>
              ) : (
                <Mic className="h-12 w-12 text-slate-400" />
              )}
            </div>

            <p className="mb-2 text-slate-400">
              {isRecording ? 'Listening and transcribing...' : 'Tap to start recording'}
            </p>

            {isRecording && <p className="mb-4 text-2xl font-mono text-white">{formatTime(recordingTime)}</p>}

            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 rounded-xl px-8 py-3 font-medium transition-all ${
                isRecording
                  ? 'border border-red-500/30 bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="h-5 w-5" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" />
                  Start Recording
                </>
              )}
            </button>

            <div className="mt-6 w-full rounded-xl border border-slate-700/60 bg-slate-900/50 p-4 text-left">
              <p className="mb-2 text-sm font-medium text-white">Transcript</p>
              <p className="min-h-20 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                {voiceContent || 'Your spoken transcript will appear here while you record.'}
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}
      </GlassPanel>

      <div className="mb-8 flex justify-center lg:justify-start">
        <button
          onClick={handleAnalyze}
          disabled={status === 'analyzing' || (mode === 'text' && !text.trim()) || (mode === 'voice' && !voiceContent)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-8 py-4 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:from-cyan-400 hover:to-emerald-400 hover:shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[18rem]"
        >
          {status === 'analyzing' ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Analyze {mode === 'text' ? 'Text' : 'Voice Transcript'}
            </>
          )}
        </button>
      </div>

      {status === 'complete' && result && (
        <GlassPanel padding="lg">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Analysis Results</h2>
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 ${getActionColor(result.recommended_action)}`}>
              {getActionIcon(result.recommended_action)}
              <span className="font-medium uppercase">{result.recommended_action}</span>
            </div>
          </div>

          <div className="mb-8 flex items-center justify-center lg:justify-start">
            <div className="relative h-40 w-40">
              <svg className="h-full w-full -rotate-90 transform">
                <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-700" />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(result.risk_score / 100) * 440} 440`}
                  className={
                    result.risk_score >= 70 ? 'text-red-500' : result.risk_score >= 40 ? 'text-amber-500' : 'text-emerald-500'
                  }
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">{result.risk_score}</span>
                <span className="text-sm text-slate-400">Risk Score</span>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-xl bg-slate-900/50 p-5">
            <h3 className="mb-2 font-medium text-white">AI Analysis</h3>
            <p className="leading-relaxed text-slate-300">{result.explanation}</p>
          </div>

          {result.patterns.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 font-medium text-white">Detected Patterns</h3>
              <div className="flex flex-wrap gap-2">
                {result.patterns.map((pattern, index) => (
                  <span
                    key={index}
                    className="rounded-full border border-red-500/30 bg-red-500/20 px-3 py-1 text-sm text-red-400"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.reasons && result.reasons.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 font-medium text-white">Reasons</h3>
              <div className="space-y-2">
                {result.reasons.map((reason, index) => (
                  <div key={index} className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
                    {reason}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              onClick={resetAnalysis}
              className="flex-1 rounded-xl border border-slate-600/30 bg-slate-700/50 py-3 font-medium text-white transition-all hover:bg-slate-700/70"
            >
              Analyze Another
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-3 font-medium text-white transition-all hover:from-cyan-400 hover:to-emerald-400"
            >
              Return to Dashboard
            </button>
          </div>
        </GlassPanel>
      )}
    </main>
  );
}
