export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text();

  if (!rawBody) {
    return {} as T;
  }

  if (contentType.includes("application/json")) {
    return JSON.parse(rawBody) as T;
  }

  throw new Error(
    `Expected JSON but received ${contentType || "an unknown response type"}. ` +
      "Please verify the API server is running and the frontend is calling the correct endpoint."
  );
}
