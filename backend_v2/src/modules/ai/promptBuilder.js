export const buildPrompt = (type, payload) => {
  if (type === "text") {
    return `Analyze this message: ${payload.text}`;
  }

  if (type === "url") {
    return `Analyze this URL: ${payload.url}`;
  }

  if (type === "sandbox") {
    return [
      "Analyze this sandbox session for phishing or malicious behavior.",
      `Submitted URL: ${payload.submitted_url}`,
      `Current URL: ${payload.current_url}`,
      `Page title: ${payload.page_title}`,
      `Device type: ${payload.device_type}`,
      `Observed events: ${(payload.events || []).join(", ") || "none"}`,
    ].join("\n");
  }
};
