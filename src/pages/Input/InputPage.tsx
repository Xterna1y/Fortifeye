import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  ArrowLeft, 
  MessageSquare, 
  Mic, 
  MicOff,
  Send,
  Loader2,
  AlertTriangle,
  XCircle,
  CheckCircle
} from 'lucide-react';

type AnalysisMode = 'text' | 'voice';
type AnalysisStatus = 'idle' | 'analyzing' | 'complete';

interface MockResult {
  risk_score: number;
  scam_detected: boolean;
  patterns: string[];
  explanation: string;
  recommended_action: 'allow' | 'warn' | 'block';
}

export default function InputPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AnalysisMode>('text');
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<MockResult | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
  };

  const handleAnalyze = () => {
    if (!text.trim() && !isRecording) return;
    
    setStatus('analyzing');
    
    // Simulate AI analysis
    setTimeout(() => {
      const mockResults: MockResult[] = [
        {
          risk_score: 85,
          scam_detected: true,
          patterns: ['urgency', 'authority', 'fear'],
          explanation: 'Message uses urgency tactics and impersonates authority (bank) to pressure immediate action. This is a common scam pattern.',
          recommended_action: 'block'
        },
        {
          risk_score: 45,
          scam_detected: false,
          patterns: ['slightly_promotional'],
          explanation: 'Message contains some promotional language but does not show clear signs of scams. Proceed with normal caution.',
          recommended_action: 'warn'
        },
        {
          risk_score: 15,
          scam_detected: false,
          patterns: [],
          explanation: 'Message appears to be from a legitimate source with no detected scam indicators.',
          recommended_action: 'allow'
        }
      ];
      
      // Randomly select a result for demo purposes
      const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
      setResult(randomResult);
      setStatus('complete');
    }, 2500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'block': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'warn': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      default: return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'block': return <XCircle className="w-5 h-5" />;
      case 'warn': return <AlertTriangle className="w-5 h-5" />;
      default: return <CheckCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Fortifeye</span>
            </div>
            
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mode Selection */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setMode('text')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              mode === 'text'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600/50'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            Text Analysis
          </button>
          <button
            onClick={() => setMode('voice')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              mode === 'voice'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600/50'
            }`}
          >
            <Mic className="w-5 h-5" />
            Voice Analysis
          </button>
        </div>

        {/* Input Area */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {mode === 'text' ? 'Enter Message to Analyze' : 'Record Voice Message'}
          </h2>
          
          {mode === 'text' ? (
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the suspicious message here... (e.g., 'Your account has been compromised. Transfer RM5000 immediately to secure your funds.')"
                className="w-full h-48 px-4 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none"
              />
              <p className="text-slate-500 text-xs mt-2">
                Include any details like sender, requested action, and urgency indicators
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className={`relative w-32 h-32 rounded-full flex items-center justify-center mb-6 ${
                isRecording 
                  ? 'bg-red-500/20 border-4 border-red-500 animate-pulse' 
                  : 'bg-slate-700/50 border border-slate-600'
              }`}>
                {isRecording ? (
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                ) : (
                  <Mic className="w-12 h-12 text-slate-400" />
                )}
              </div>
              
              <p className="text-slate-400 mb-2">
                {isRecording ? 'Recording in progress...' : 'Tap to start recording'}
              </p>
              
              {isRecording && (
                <p className="text-2xl font-mono text-white mb-4">{formatTime(recordingTime)}</p>
              )}
              
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-8 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  isRecording
                    ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
                    : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    Start Recording
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Analyze Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleAnalyze}
            disabled={status === 'analyzing' || (mode === 'text' && !text.trim()) || (mode === 'voice' && !isRecording && recordingTime === 0)}
            className="px-12 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {status === 'analyzing' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Analyze {mode === 'text' ? 'Text' : 'Recording'}
              </>
            )}
          </button>
        </div>

        {/* Results Display */}
        {status === 'complete' && result && (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Analysis Results</h2>
              <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${getActionColor(result.recommended_action)}`}>
                {getActionIcon(result.recommended_action)}
                <span className="font-medium uppercase">{result.recommended_action}</span>
              </div>
            </div>

            {/* Risk Score Gauge */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-slate-700"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(result.risk_score / 100) * 440} 440`}
                    className={result.risk_score >= 70 ? 'text-red-500' : result.risk_score >= 40 ? 'text-amber-500' : 'text-emerald-500'}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white">{result.risk_score}</span>
                  <span className="text-slate-400 text-sm">Risk Score</span>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-slate-900/50 rounded-xl p-5 mb-6">
              <h3 className="text-white font-medium mb-2">AI Analysis</h3>
              <p className="text-slate-300 leading-relaxed">{result.explanation}</p>
            </div>

            {/* Detected Patterns */}
            {result.patterns.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">Detected Patterns</h3>
                <div className="flex flex-wrap gap-2">
                  {result.patterns.map((pattern, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 text-sm rounded-full"
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStatus('idle');
                  setResult(null);
                  setText('');
                  setRecordingTime(0);
                }}
                className="flex-1 py-3 bg-slate-700/50 border border-slate-600/30 text-white font-medium rounded-xl hover:bg-slate-700/70 transition-all"
              >
                Analyze Another
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-medium rounded-xl hover:from-cyan-400 hover:to-emerald-400 transition-all"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
