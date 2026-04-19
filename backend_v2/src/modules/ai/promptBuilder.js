export const buildPrompt = (type, payload) => {
  if (type === "text") {
    return `Analyze this message: ${payload.text}`;
  }

  if (type === "url") {
    return `Analyze this URL: ${payload.url}`;
  }
};