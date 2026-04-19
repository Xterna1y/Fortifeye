export const callGemini = async (prompt) => {
  // TEMP MOCK (replace later)
  return {
    risk_score: 85,
    risk_level: "HIGH",
    scam_detected: true,
    patterns: ["urgency"],
    reasons: ["Message creates urgency"],
    explanation: "Likely scam",
    recommended_action: "block",
  };
};