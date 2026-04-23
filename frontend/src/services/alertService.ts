import { API_BASE_URL, parseJsonResponse } from '../config/api';

export interface GuardianAlert {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  riskLevel?: string;
  status?: 'pending' | 'approved' | 'blocked';
  guardianId?: string;
  dependentId?: string;
  sessionId?: string;
  createdAt?: string;
}

export async function getGuardianAlerts(guardianId: string) {
  const response = await fetch(`${API_BASE_URL}/alerts/guardian/${guardianId}`);
  return parseJsonResponse<GuardianAlert[]>(response);
}

export async function updateGuardianAlertStatus(
  alertId: string,
  status: 'approved' | 'blocked',
) {
  const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  return parseJsonResponse<GuardianAlert>(response);
}

export async function createGuardianAlert(payload: {
  title?: string;
  message: string;
  type?: string;
  riskLevel?: string;
  guardianId: string;
  dependentId: string;
}) {
  const response = await fetch(`${API_BASE_URL}/alerts/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<GuardianAlert>(response);
}
