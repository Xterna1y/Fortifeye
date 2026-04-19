export const validateAIResponse = (data) => {
  return (
    data &&
    ["LOW", "MEDIUM", "HIGH"].includes(data.risk_level) &&
    ["allow", "warn", "block"].includes(data.recommended_action)
  );
};