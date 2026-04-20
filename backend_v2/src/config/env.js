import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const BACKEND_ROOT = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(BACKEND_ROOT, ".env") });

export const PORT = process.env.PORT || 5000;

const resolveFromBackendRoot = (value) => {
  if (!value) {
    return null;
  }

  return path.isAbsolute(value) ? value : path.resolve(BACKEND_ROOT, value);
};

export const FIREBASE_SERVICE_ACCOUNT_PATH = resolveFromBackendRoot(
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH
);
export const GOOGLE_APPLICATION_CREDENTIALS_PATH = resolveFromBackendRoot(
  process.env.GOOGLE_APPLICATION_CREDENTIALS
);
export const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
export const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
