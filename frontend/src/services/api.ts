export type RecommendedAction = "allow" | "warn" | "block";

export interface AnalysisResult {
  risk_score: number;
  risk_level?: "LOW" | "MEDIUM" | "HIGH";
  scam_detected: boolean;
  patterns: string[];
  verdict?: string;
  reasons?: string[];
  explanation: string;
  recommended_action: RecommendedAction;
  model?: string;
  generated_at?: string;
}

export interface SandboxSessionOpenResponse {
  session_id: string;
  status: string;
  sandbox_url: string;
  expires_at: string;
}

interface SandboxVerdictResponse {
  session_id: string;
  verdict: AnalysisResult;
}

interface SandboxLegacyEventPayload {
  event_type: string;
  event_time?: string;
  details?: Record<string, unknown>;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);
const USE_REAL_AI = import.meta.env.VITE_USE_REAL_AI !== "false";
const ENABLE_SANDBOX_TEST_EVENTS =
  import.meta.env.VITE_ENABLE_SANDBOX_TEST_EVENTS !== "false";

const wait = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const uniquePatterns = (patterns: string[]) => [...new Set(patterns)];

const buildMockAnalysis = (input: string): AnalysisResult => {
  const lowered = input.toLowerCase();
  const patterns: string[] = [];

  if (/urgent|immediately|act now|asap/.test(lowered)) {
    patterns.push("urgency");
  }

  if (/blocked|suspended|compromised|warning|penalty/.test(lowered)) {
    patterns.push("fear");
  }

  if (/bank|police|government|support|security team/.test(lowered)) {
    patterns.push("authority_impersonation");
  }

  if (/transfer|payment|wallet|refund|crypto|pay now/.test(lowered)) {
    patterns.push("financial_pressure");
  }

  if (/password|login|verify account|username/.test(lowered)) {
    patterns.push("credential_request");
  }

  if (/otp|verification code|security code|one time password/.test(lowered)) {
    patterns.push("otp_request");
  }

  const score = Math.min(
    100,
    patterns.reduce((total, pattern) => {
      const weights: Record<string, number> = {
        urgency: 15,
        fear: 15,
        authority_impersonation: 20,
        financial_pressure: 20,
        credential_request: 25,
        otp_request: 30,
      };

      return total + (weights[pattern] || 0);
    }, 0) + (patterns.length >= 2 ? 10 : 0) + (patterns.length >= 3 ? 20 : 0),
  );

  const riskLevel = score >= 71 ? "HIGH" : score >= 41 ? "MEDIUM" : "LOW";
  const recommendedAction: RecommendedAction =
    riskLevel === "HIGH" ? "block" : riskLevel === "MEDIUM" ? "warn" : "allow";

  return {
    risk_score: score,
    risk_level: riskLevel,
    scam_detected: score >= 71 || (score >= 41 && patterns.length >= 2),
    patterns: uniquePatterns(patterns),
    verdict:
      riskLevel === "HIGH"
        ? "High-risk scam indicators detected"
        : riskLevel === "MEDIUM"
          ? "Moderate scam risk detected"
          : "Low scam risk detected",
    reasons:
      patterns.length > 0
        ? uniquePatterns(patterns).slice(0, 4).map((pattern) =>
            `${pattern.replace(/_/g, " ")} detected in the message`,
          )
        : ["No strong scam indicators detected in the message"],
    explanation:
      patterns.length > 0
        ? `Mock analysis detected ${uniquePatterns(patterns)
            .map((pattern) => pattern.replace(/_/g, " "))
            .join(", ")} patterns.`
        : "Mock analysis did not detect strong scam indicators.",
    recommended_action: recommendedAction,
    model: "mock-frontend",
  };
};

const buildMockSandboxVerdict = (): AnalysisResult => ({
  risk_score: 92,
  risk_level: "HIGH",
  scam_detected: true,
  patterns: ["redirect", "credential_harvesting", "otp_capture"],
  verdict: "High-risk phishing flow detected",
  reasons: [
    "Redirect to an unknown domain was observed",
    "A credential capture step was detected",
    "An OTP capture step was detected",
  ],
  explanation:
    "Mock sandbox analysis detected a chained redirect, credential capture, and OTP phishing pattern.",
  recommended_action: "block",
  model: "mock-sandbox",
});

const parseErrorMessage = async (response: Response) => {
  try {
    const payload = await response.json();

    if (typeof payload?.error === "string") {
      return payload.error;
    }

    if (typeof payload?.message === "string") {
      return payload.message;
    }
  } catch {
    // Ignore JSON parsing failures and fall back to status text.
  }

  return response.statusText || "Request failed";
};

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json() as Promise<T>;
};

export const isRealAiEnabled = () => USE_REAL_AI;
export const isSandboxTestEventsEnabled = () => ENABLE_SANDBOX_TEST_EVENTS;
export const getAiModeLabel = () =>
  USE_REAL_AI ? "live-backend-ai" : "mock-frontend-ai";

export async function analyzeText(text: string): Promise<AnalysisResult> {
  if (!USE_REAL_AI) {
    await wait(900);
    return buildMockAnalysis(text);
  }

  return requestJson<AnalysisResult>("/scan/text", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function openSandbox(
  url: string,
): Promise<SandboxSessionOpenResponse> {
  if (!USE_REAL_AI) {
    await wait(700);

    return {
      session_id: `mock_${Date.now()}`,
      status: "active",
      sandbox_url: `https://sandbox.example.com/session/mock_${Date.now()}`,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  return requestJson<SandboxSessionOpenResponse>("/sandbox/open", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

export async function getSandboxVerdict(
  sessionId: string,
): Promise<AnalysisResult> {
  if (!USE_REAL_AI) {
    await wait(700);
    return buildMockSandboxVerdict();
  }

  const response = await requestJson<SandboxVerdictResponse>(
    `/sandbox/session/${sessionId}/verdict`,
  );
  return response.verdict;
}

export async function addSandboxEvent(
  sessionId: string,
  event: SandboxLegacyEventPayload,
): Promise<void> {
  if (!USE_REAL_AI) {
    await wait(250);
    return;
  }

  await requestJson("/sandbox/event", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      event,
    }),
  });
}

export async function simulateSandboxThreat(
  sessionId: string,
): Promise<AnalysisResult> {
  if (!ENABLE_SANDBOX_TEST_EVENTS) {
    throw new Error("Sandbox test events are disabled");
  }

  if (!USE_REAL_AI) {
    await wait(900);
    return buildMockSandboxVerdict();
  }

  await addSandboxEvent(sessionId, {
    event_type: "domain_change",
    details: {
      new_url: "https://secure-bank-verification.example",
      page_title: "Secure Bank Verification",
    },
  });
  await addSandboxEvent(sessionId, {
    event_type: "login_form_detected",
    details: {
      page_title: "Secure Bank Verification",
    },
  });
  await addSandboxEvent(sessionId, {
    event_type: "otp_field_detected",
    details: {
      page_title: "Secure Bank Verification",
    },
  });

  return getSandboxVerdict(sessionId);
}
