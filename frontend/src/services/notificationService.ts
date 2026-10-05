import { Notification } from '../types';

const API_URL = '/api/notifications';

export const fetchNotifications = async (
  token: string,
): Promise<Notification[]> => {
  const response = await fetch(`${API_URL}/`, {
    headers: { Authorization: token },
  });
  if (!response.ok) throw new Error(`Erreur ${response.status}`);
  return response.json();
};

export const markNotificationAsRead = async (
  token: string,
  notificationId: number,
): Promise<void> => {
  const response = await fetch(`${API_URL}/${notificationId}/read`, {
    method: 'POST',
    headers: { Authorization: token },
  });
  if (!response.ok) throw new Error(`Erreur ${response.status}`);
};

export const acceptTeamInvitation = async (
  token: string,
  membershipId: number,
): Promise<void> => {
  const response = await fetch(
    `/api/teams/memberships/${membershipId}/accept`,
    {
      method: 'PATCH',
      headers: { Authorization: token },
    },
  );
  if (!response.ok) throw new Error(`Erreur ${response.status}`);
};

export const declineTeamInvitation = async (
  token: string,
  membershipId: number,
  reason: string,
): Promise<void> => {
  const response = await fetch(
    `/api/teams/memberships/${membershipId}/refuse?reason=${encodeURIComponent(reason)}`,
    {
      method: 'PATCH',
      headers: { Authorization: token },
    },
  );
  if (!response.ok) throw new Error(`Erreur ${response.status}`);
};
