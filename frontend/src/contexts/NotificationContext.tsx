import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import {
  Notification as NotificationType,
  UserContextType,
  NotificationContextType,
} from '../types';
import { UserContext } from './UserContext';
import {
  fetchNotifications,
  markNotificationAsRead,
  acceptTeamInvitation,
  declineTeamInvitation,
} from '../services/notificationService';

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  error: null,
  decidedIds: new Set(),
  markAsRead: async () => {},
  handleAccept: async () => {},
  handleDecline: async () => null,
});

const NotificationContextProvider = ({ children }: { children: ReactNode }) => {
  const { authenticatedUser } = useContext<UserContextType>(UserContext);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [decidedIds, setDecidedIds] = useState<Set<number>>(new Set());

  const catchError = (err: unknown) => {
    if (err instanceof Error) setError(err.message);
    else setError('Une erreur inconnue est survenue');
  };

  const loadNotifications = useCallback(async () => {
    if (!authenticatedUser) return;
    try {
      const data = await fetchNotifications(authenticatedUser.token);
      setNotifications(data);
    } catch (err) {
      catchError(err);
    }
  }, [authenticatedUser]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(authenticatedUser!.token, id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n)),
      );
    } catch (err) {
      catchError(err);
    }
  };

  const handleAccept = async (membershipId: number, notificationId: number) => {
    try {
      await acceptTeamInvitation(authenticatedUser!.token, membershipId);
      await markAsRead(notificationId);
      await loadNotifications();
      setDecidedIds((prev) => new Set(prev).add(membershipId));
    } catch (err) {
      catchError(err);
    }
  };

  // Returns a validation error string, or null on success
  const handleDecline = async (
    declineId: number,
    declineNotificationId: number,
    reason: string,
  ): Promise<string | null> => {
    if (!reason.trim()) return 'Veuillez entrer une raison.';
    try {
      await declineTeamInvitation(authenticatedUser!.token, declineId, reason);
      await markAsRead(declineNotificationId);
      await loadNotifications();
      setDecidedIds((prev) => new Set(prev).add(declineId));
      return null;
    } catch (err) {
      catchError(err);
      return null;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        error,
        decidedIds,
        markAsRead,
        handleAccept,
        handleDecline,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export { NotificationContext, NotificationContextProvider };
