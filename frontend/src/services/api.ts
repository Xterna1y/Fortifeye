import { API_BASE_URL, parseJsonResponse } from "../config/api";

export async function openSandbox(url: string) {
  const res = await fetch(`${API_BASE_URL}/sandbox/open`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  });

  return parseJsonResponse(res);
}

export async function scanText(text: string, userId?: string) {
  const res = await fetch(`${API_BASE_URL}/scan/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text, userId })
  });

  return parseJsonResponse(res);
}

export async function scanUrl(url: string, userId?: string) {
  const res = await fetch(`${API_BASE_URL}/scan/url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url, userId })
  });

  return parseJsonResponse(res);
}
