import { buildPrompt } from "./promptBuilder.js";

const scoreRules = [
  {
    match: (eventSet) => eventSet.has("redirect"),
    score: 10,
    reason: "Redirect activity detected",
  },
  {
    match: (eventSet) =>
      eventSet.has("domain_change") || eventSet.has("redirect_to_unknown_domain"),
    score: 12,
    reason: "Redirect to an unknown or changed domain detected",
  },
  {
    match: (eventSet) => eventSet.has("login_form_detected"),
    score: 20,
    reason: "Sensitive credential form detected",
  },
  {
    match: (eventSet) => eventSet.has("credential_submission_attempt"),
    score: 20,
    reason: "Credential submission attempt detected",
  },
  {
    match: (eventSet) => eventSet.has("otp_field_detected"),
    score: 18,
    reason: "OTP capture attempt detected",
  },
  {
    match: (eventSet) => eventSet.has("popup_triggered"),
    score: 8,
    reason: "Suspicious popup activity detected",
  },
  {
    match: (eventSet) => eventSet.has("permission_request"),
    score: 10,
    reason: "Sensitive permission request detected",
  },
  {
    match: (eventSet) =>
      eventSet.has("download_attempt") || eventSet.has("apk_download_attempt"),
    score: 25,
    reason: "File download attempt detected",
  },
];

export const callGemini = async (prompt) => ({
  provider: "mock-gemini",
  prompt,
});

export const analyzeSandboxRisk = async (input) => {
  const prompt = buildPrompt("sandbox", input);
  await callGemini(prompt);

  const eventSet = new Set(input.events || []);
  let riskScore = 10;
  const reasons = [];

  for (const rule of scoreRules) {
    if (rule.match(eventSet, input)) {
      riskScore += rule.score;
      reasons.push(rule.reason);
    }
  }

  const currentUrl = (input.current_url || "").toLowerCase();
  const submittedUrl = (input.submitted_url || "").toLowerCase();

  if (
    input.device_type === "android" &&
    (eventSet.has("download_attempt") || eventSet.has("apk_download_attempt"))
  ) {
    riskScore += 10;
    reasons.push("APK download attempted on Android");
  }

  if (
    currentUrl.includes("login") ||
    currentUrl.includes("verify") ||
    submittedUrl.includes("short.ly")
  ) {
    riskScore += 8;
    reasons.push("Suspicious destination URL keywords or link shortener detected");
  }

  riskScore = Math.min(riskScore, 99);

  let risk_level = "safe";
  let verdict = "Low-risk session activity detected";
  let recommended_action = "Continue monitoring session";

  if (riskScore >= 70) {
    risk_level = "dangerous";
    verdict = "Likely phishing and malicious app distribution";
    recommended_action = "Terminate session and warn user";
  } else if (riskScore >= 40) {
    risk_level = "suspicious";
    verdict = "Suspicious activity detected";
    recommended_action = "Warn user and continue monitoring";
  }

  return {
    risk_score: riskScore,
    risk_level,
    verdict,
    reasons,
    recommended_action,
    generated_at: new Date().toISOString(),
    model: "mock-genkit-gemini-analyzer",
  };
};
