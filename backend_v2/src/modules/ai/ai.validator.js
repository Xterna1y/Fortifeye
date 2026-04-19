export const validateAIResponse = (data) => {
  return (
    data &&
    ["safe", "suspicious", "dangerous"].includes(data.risk_level) &&
    typeof data.risk_score === "number" &&
    typeof data.verdict === "string" &&
    typeof data.recommended_action === "string"
  );
};
