import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  ArrowLeft,
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { analyzeText, getAiModeLabel, isRealAiEnabled } from "../../services/api";

type AnalysisMode = "text" | "voice";
type AnalysisStatus = "idle" | "analyzing";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const getSpeechRecognitionConstructor = () =>
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function InputPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AnalysisMode>("text");
  const [text, setText] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const timerRef = useRef<number | null>(null);
  const supportsSpeechRecognition =
    typeof window !== "undefined" && Boolean(getSpeechRecognitionConstructor());

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();

      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = () => {
    setErrorMessage("");

    const Recognition = getSpeechRecognitionConstructor();

    if (!Recognition) {
      setErrorMessage(
        "Voice transcription is not available in this browser yet. Use text mode or switch to a browser with SpeechRecognition support.",
      );
      return;
    }

    setVoiceTranscript("");
    setInterimTranscript("");
    setRecordingTime(0);

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalizedText = "";
      let partialText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim() || "";

        if (!transcript) {
          continue;
        }

        if (result.isFinal) {
          finalizedText += `${transcript} `;
        } else {
          partialText += `${transcript} `;
        }
      }

      if (finalizedText.trim()) {
        setVoiceTranscript((previous) =>
          `${previous} ${finalizedText}`.trim(),
        );
      }

      setInterimTranscript(partialText.trim());
    };

    recognition.onerror = (event) => {
      stopTimer();
      setIsRecording(false);
      setErrorMessage(
        event.error
          ? `Voice transcription failed: ${event.error}`
          : "Voice transcription failed. Please try again.",
      );
    };

    recognition.onend = () => {
      stopTimer();
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);

    timerRef.current = window.setInterval(() => {
      setRecordingTime((previous) => previous + 1);
    }, 1000);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    stopTimer();
    setIsRecording(false);
  };

  const handleAnalyze = async () => {
    const content =
      mode === "voice"
        ? `${voiceTranscript} ${interimTranscript}`.trim()
        : text.trim();

    if (!content) {
      return;
    }

    if (isRecording) {
      stopRecording();
    }

    setStatus("analyzing");
    setErrorMessage("");

    try {
      const result = await analyzeText(content);

      navigate("/results", {
        state: {
          result,
          input: content,
          mode,
          source: getAiModeLabel(),
        },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Analysis failed. Please try again.",
      );
    } finally {
      setStatus("idle");
    }
  };

  const transcriptPreview = `${voiceTranscript} ${interimTranscript}`.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate("/dashboard")}
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

            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => setMode("text")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              mode === "text"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600/50"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            Text Analysis
          </button>
          <button
            onClick={() => setMode("voice")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              mode === "voice"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600/50"
            }`}
          >
            <Mic className="w-5 h-5" />
            Voice Analysis
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
            {isRealAiEnabled() ? "Live backend AI enabled" : "Mock frontend AI enabled"}
          </span>
          {mode === "voice" && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 border border-amber-500/30 text-amber-300">
              Browser speech-to-text test mode
            </span>
          )}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {mode === "text" ? "Enter Message to Analyze" : "Record Voice Message"}
          </h2>

          {mode === "text" ? (
            <div className="relative">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Paste the suspicious message here..."
                className="w-full h-48 px-4 py-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none"
              />
              <p className="text-slate-500 text-xs mt-2">
                This now sends your text to the backend AI scan route.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div
                className={`relative w-32 h-32 rounded-full flex items-center justify-center mb-6 ${
                  isRecording
                    ? "bg-red-500/20 border-4 border-red-500 animate-pulse"
                    : "bg-slate-700/50 border border-slate-600"
                }`}
              >
                {isRecording ? (
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" />
                    <div
                      className="w-3 h-3 bg-red-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-3 h-3 bg-red-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                ) : (
                  <Mic className="w-12 h-12 text-slate-400" />
                )}
              </div>

              <p className="text-slate-400 mb-2">
                {isRecording ? "Recording in progress..." : "Tap to start voice capture"}
              </p>

              {isRecording && (
                <p className="text-2xl font-mono text-white mb-4">
                  {formatTime(recordingTime)}
                </p>
              )}

              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-8 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  isRecording
                    ? "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                    : "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30"
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

              <div className="w-full mt-6 p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl">
                <p className="text-slate-400 text-sm mb-2">Transcript Preview</p>
                <p className="text-white whitespace-pre-wrap min-h-[72px]">
                  {transcriptPreview || "Your transcript will appear here."}
                </p>
              </div>

              {!supportsSpeechRecognition && (
                <p className="text-amber-300 text-sm mt-4 text-center">
                  This browser does not expose SpeechRecognition. Text mode will still
                  use the live backend AI.
                </p>
              )}
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={handleAnalyze}
            disabled={
              status === "analyzing" ||
              (mode === "text" && !text.trim()) ||
              (mode === "voice" && !transcriptPreview)
            }
            className="px-12 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {status === "analyzing" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Analyze {mode === "text" ? "Text" : "Transcript"}
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
