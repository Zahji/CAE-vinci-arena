import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import {
  MembersContextType,
  UserContextType,
  UserPublicProfile,
} from '../types';
import { fetchAllMembers } from '../services/membersService';
import { UserContext } from './UserContext';

const defaultMembersContext: MembersContextType = {
  loading: true,
  error: null,
  membersList: null,
  filteredMembers: [],
  search: '',
  currentUserId: undefined,
  setSearch: () => {},
  refreshMembers: async () => {},
};

const MembersContext = createContext<MembersContextType>(defaultMembersContext);

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Une erreur inconnue est survenue';
};

const MembersContextProvider = ({ children }: { children: ReactNode }) => {
  const { authenticatedUser } = useContext<UserContextType>(UserContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [membersList, setMembersList] = useState<UserPublicProfile[] | null>(
    null,
  );
  const [search, setSearch] = useState('');

  const currentUserId = authenticatedUser?.id;

  const refreshMembers = useCallback(async () => {
    try {
      const members = await fetchAllMembers();
      setMembersList(members);
      setError(null);
    } catch (fetchError: unknown) {
      setError(getErrorMessage(fetchError));
    }
  }, []);

  useEffect(() => {
    const loadMembers = async () => {
      setLoading(true);
      await refreshMembers();
      setLoading(false);
    };

    void loadMembers();
  }, [refreshMembers]);

  const filteredMembers = useMemo(
    () =>
      (membersList ?? [])
        .filter((m) => m.tag.toLowerCase().startsWith(search.toLowerCase()))
        .sort((a, b) => {
          if (a.id === currentUserId) return -1;
          if (b.id === currentUserId) return 1;
          if (a.isBanned && !b.isBanned) return 1;
          if (!a.isBanned && b.isBanned) return -1;
          return a.tag.localeCompare(b.tag);
        }),
    [membersList, search, currentUserId],
  );

  const membersContextValue: MembersContextType = {
    loading,
    error,
    membersList,
    filteredMembers,
    search,
    currentUserId,
    setSearch,
    refreshMembers,
  };

  return (
    <MembersContext.Provider value={membersContextValue}>
      {children}
    </MembersContext.Provider>
  );
};

export { MembersContext, MembersContextProvider };
