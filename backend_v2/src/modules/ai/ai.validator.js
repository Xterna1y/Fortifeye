export const validateAIResponse = (data) => {
  return (
    data &&
    Number.isFinite(data.risk_score) &&
    data.risk_score >= 0 &&
    data.risk_score <= 100 &&
    ["LOW", "MEDIUM", "HIGH"].includes(data.risk_level) &&
    typeof data.scam_detected === "boolean" &&
    Array.isArray(data.patterns) &&
    data.patterns.every((pattern) => typeof pattern === "string") &&
    typeof data.verdict === "string" &&
    Array.isArray(data.reasons) &&
    data.reasons.every((reason) => typeof reason === "string") &&
    typeof data.explanation === "string" &&
    ["allow", "warn", "block"].includes(data.recommended_action)
  );
};
