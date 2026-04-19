const BASE_URL = "http://localhost:5002/api";

export async function openSandbox(url: string) {
  const res = await fetch(`${BASE_URL}/sandbox/open`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  });

  return res.json();
}

export async function scanText(text: string) {
  const res = await fetch(`${BASE_URL}/scan/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });

  return res.json();
}

export async function scanUrl(url: string) {
  const res = await fetch(`${BASE_URL}/scan/url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  });

  return res.json();
}