import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, 
  ArrowLeft, 
  AlertTriangle, 
  XCircle, 
  CheckCircle,
  Info,
  Share2,
  RefreshCw
} from 'lucide-react';

interface AnalysisResult {
  risk_score: number;
  scam_detected: boolean;
  patterns: string[];
  explanation: string;
  recommended_action: 'allow' | 'warn' | 'block';
  timestamp?: string;
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // In a real app, this would come from navigation state
  const result: AnalysisResult = location.state?.result || {
    risk_score: 72,
    scam_detected: true,
    patterns: ['urgency', 'authority_impersonation'],
    explanation: 'This message shows classic scam indicators: urgent language demanding immediate action, authority impersonation (bank), and requests for personal financial information.',
    recommended_action: 'block'
  };

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'block':
        return {
          icon: XCircle,
          color: 'text-red-400',
          bg: 'bg-red-500/20',
          border: 'border-red-500/30',
          bgGradient: 'from-red-500/30'
        };
      case 'warn':
        return {
          icon: AlertTriangle,
          color: 'text-amber-400',
          bg: 'bg-amber-500/20',
          border: 'border-amber-500/30',
          bgGradient: 'from-amber-500/30'
        };
      default:
        return {
          icon: CheckCircle,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/20',
          border: 'border-emerald-500/30',
          bgGradient: 'from-emerald-500/30'
        };
    }
  };

  const actionConfig = getActionConfig(result.recommended_action);
  const ActionIcon = actionConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={() => navigate('/input')}
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
        {/* Main Result Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden mb-6">
          {/* Status Banner */}
          <div className={`px-8 py-6 bg-gradient-to-r ${actionConfig.bgGradient} to-transparent border-b ${actionConfig.border}`}>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 ${actionConfig.bg} border ${actionConfig.border} rounded-2xl flex items-center justify-center`}>
                <ActionIcon className={`w-8 h-8 ${actionConfig.color}`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {result.recommended_action === 'block' ? 'Scam Detected!' : 
                   result.recommended_action === 'warn' ? 'Caution Advised' : 'Safe to Proceed'}
                </h1>
                <p className="text-slate-400">
                  {result.recommended_action === 'block' 
                    ? 'This message has been identified as a potential scam'
                    : result.recommended_action === 'warn'
                    ? 'This message shows some suspicious elements'
                    : 'No significant scam indicators detected'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Risk Score Display */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="85"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-slate-700"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="85"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(result.risk_score / 100) * 534} 534`}
                    className={result.risk_score >= 70 ? 'text-red-500' : result.risk_score >= 40 ? 'text-amber-500' : 'text-emerald-500'}
                    style={{ transition: 'stroke-dasharray 1s ease-out' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold text-white">{result.risk_score}</span>
                  <span className="text-slate-400 text-sm">Risk Score</span>
                </div>
              </div>
            </div>

            {/* Action Recommendation */}
            <div className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl border ${actionConfig.bg} ${actionConfig.border} mb-8`}>
              <ActionIcon className={`w-6 h-6 ${actionConfig.color}`} />
              <span className={`text-lg font-semibold ${actionConfig.color}`}>
                Recommended Action: {result.recommended_action.toUpperCase()}
              </span>
            </div>

            {/* Explanation */}
            <div className="bg-slate-900/50 rounded-xl p-6 mb-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-cyan-400" />
                AI Analysis Summary
              </h3>
              <p className="text-slate-300 leading-relaxed">{result.explanation}</p>
            </div>

            {/* Detected Patterns */}
            {result.patterns.length > 0 && (
              <div className="mb-8">
                <h3 className="text-white font-semibold mb-3">Detected Threat Patterns</h3>
                <div className="flex flex-wrap gap-2">
                  {result.patterns.map((pattern, index) => (
                    <span 
                      key={index}
                      className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-sm rounded-full font-medium"
                    >
                      ⚠️ {pattern.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Warning Message */}
            {result.recommended_action === 'block' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-medium mb-1">Do not proceed with this transaction!</p>
                    <p className="text-red-400/70 text-sm">
                      If you've already transferred any money, contact your bank immediately and report this to the authorities.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/input')}
                className="flex-1 py-4 bg-slate-700/50 border border-slate-600/30 text-white font-semibold rounded-xl hover:bg-slate-700/70 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Analyze Another
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-emerald-400 transition-all flex items-center justify-center gap-2"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
            <h4 className="text-white font-semibold mb-2">What to do next?</h4>
            <ul className="text-slate-400 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                Do not share personal information
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                Verify the sender through official channels
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                Report suspicious messages to your bank
              </li>
            </ul>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
            <h4 className="text-white font-semibold mb-2">Need help?</h4>
            <ul className="text-slate-400 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                Call the official bank hotline
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                Report to the authorities
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                Enable Guardian Mode for extra protection
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
