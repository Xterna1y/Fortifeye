export const allowedDeviceTypes = ["web", "android", "ios"];
export const allowedSessionModes = [
  "preview",
  "interactive",
  "interactive_monitored",
];
export const allowedEventTypes = [
  "redirect",
  "login_form_detected",
  "credential_submission_attempt",
  "otp_field_detected",
  "popup_triggered",
  "permission_request",
  "domain_change",
  "download_attempt",
];

export const isValidUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export const validateCreateSessionBody = (body = {}) => {
  const {
    url,
    device_type = "web",
    session_mode = "interactive_monitored",
    user_id = null,
  } = body;

  if (!url || typeof url !== "string" || !isValidUrl(url)) {
    throw createHttpError(400, "url is required and must be a valid URL");
  }

  if (!allowedDeviceTypes.includes(device_type)) {
    throw createHttpError(
      400,
      `device_type must be one of: ${allowedDeviceTypes.join(", ")}`,
    );
  }

  if (!allowedSessionModes.includes(session_mode)) {
    throw createHttpError(
      400,
      `session_mode must be one of: ${allowedSessionModes.join(", ")}`,
    );
  }

  if (user_id !== null && typeof user_id !== "string") {
    throw createHttpError(400, "user_id must be a string when provided");
  }

  return { url, device_type, session_mode, user_id };
};

export const validateEventBody = (body = {}) => {
  const { event_type, event_time, details = {} } = body;

  if (!allowedEventTypes.includes(event_type)) {
    throw createHttpError(
      400,
      `event_type must be one of: ${allowedEventTypes.join(", ")}`,
    );
  }

  if (event_time && Number.isNaN(Date.parse(event_time))) {
    throw createHttpError(
      400,
      "event_time must be a valid ISO timestamp when provided",
    );
  }

  if (details && typeof details !== "object") {
    throw createHttpError(400, "details must be an object");
  }

  return { event_type, event_time, details };
};
