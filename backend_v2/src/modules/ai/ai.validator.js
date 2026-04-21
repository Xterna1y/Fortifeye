const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"];
const RECOMMENDED_ACTIONS = ["allow", "warn", "block"];

const isFiniteNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);

const isString = (value) => typeof value === "string";

const isStringArray = (value) =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export const validateAIResponse = (data) => {
  if (!data || typeof data !== "object") {
    return false;
  }

  return (
    isFiniteNumber(data.risk_score) &&
    data.risk_score >= 0 &&
    data.risk_score <= 100 &&
    RISK_LEVELS.includes(data.risk_level) &&
    typeof data.scam_detected === "boolean" &&
    isStringArray(data.patterns) &&
    isString(data.verdict) &&
    isStringArray(data.reasons) &&
    isString(data.explanation) &&
    RECOMMENDED_ACTIONS.includes(data.recommended_action)
  );
};
