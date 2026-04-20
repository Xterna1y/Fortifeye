import { API_BASE_URL, parseJsonResponse } from "../config/api";

export interface DashboardAlert {
  id: string;
  type: "warning" | "danger" | "success";
  message: string;
  createdAt: string;
}

export interface DashboardData {
  stats: {
    protected: number;
    blocked: number;
    verified: number;
    alerts: number;
  };
  recentAlerts: DashboardAlert[];
  summary: {
    messagesAnalyzed: number;
    callsScreened: number;
    threatsBlocked: number;
    safeTransactions: number;
  };
  riskOverview: {
    level: string;
    safeScore: number;
  };
  guardian: {
    hasGuardian: boolean;
  };
  safetyTip: string;
}

export async function getDashboardData(userId: string) {
  const response = await fetch(`${API_BASE_URL}/dashboard/${userId}`);
  return parseJsonResponse<DashboardData>(response);
}
