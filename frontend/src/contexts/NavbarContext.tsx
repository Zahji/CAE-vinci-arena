import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  NavbarContextType,
  UserContextType,
  Notification,
  Profile,
} from '../types';
import { UserContext } from './UserContext';

const defaultNavbarContext: NavbarContextType = {
  isAdmin: false,
  displayName: '',
  profilePictureUrl: '',
  hasUnread: false,
  menuAnchor: null,
  openProfileMenu: () => {},
  closeProfileMenu: () => {},
};

const NavbarContext = createContext<NavbarContextType>(defaultNavbarContext);

const NavbarContextProvider = ({ children }: { children: ReactNode }) => {
  const { authenticatedUser, jwtData } =
    useContext<UserContextType>(UserContext);

  const isAdmin = jwtData()?.isAdmin ?? false;
  const displayName = authenticatedUser?.tag ?? '';

  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');
  const [hasUnread, setHasUnread] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const fetchUnread = useCallback(async () => {
    if (!authenticatedUser) return;
    try {
      const response = await fetch('/api/notifications/', {
        headers: { Authorization: authenticatedUser.token },
      });
      if (!response.ok) return;
      const data: Notification[] = await response.json();
      setHasUnread(data.some((n) => !n.isRead));
    } catch {
      // silently fail
    }
  }, [authenticatedUser]);

  useEffect(() => {
    if (!authenticatedUser) return;
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [authenticatedUser, fetchUnread]);

  useEffect(() => {
    if (!authenticatedUser) {
      setProfilePictureUrl('');
      return;
    }

    const fetchMyProfilePicture = async () => {
      try {
        const response = await fetch('/api/users/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authenticatedUser.token,
          },
        });
        if (!response.ok) return;
        const profile: Profile = await response.json();
        setProfilePictureUrl(profile.profilePicture ?? '');
      } catch {
        setProfilePictureUrl('');
      }
    };

    void fetchMyProfilePicture();
  }, [authenticatedUser]);

  const openProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const closeProfileMenu = () => {
    setMenuAnchor(null);
  };

  return (
    <NavbarContext.Provider
      value={{
        isAdmin,
        displayName,
        profilePictureUrl,
        hasUnread,
        menuAnchor,
        openProfileMenu,
        closeProfileMenu,
      }}
    >
      {children}
    </NavbarContext.Provider>
  );
};

export { NavbarContext, NavbarContextProvider };
