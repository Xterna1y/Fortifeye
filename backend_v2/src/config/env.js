import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 5000;
export const FIREBASE_SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;