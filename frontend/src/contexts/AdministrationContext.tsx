import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AdministrationContextType,
  UserContextType,
  UserProfile,
} from '../types';
import { UserContext } from './UserContext';
import {
  demoteAdministrator,
  fetchAdministrators,
  fetchNonAdmins,
  promoteAdministrator,
} from '../services/administrationService';

const defaultAdministrationContext: AdministrationContextType = {
  loading: true,
  error: null,
  administrationList: null,
  nonAdmins: [],
  openPromoteModal: false,
  selectedUserId: '',
  promoteError: '',
  demoteError: '',
  currentUserId: undefined,
  refreshAdministrators: async () => {},
  openPromoteModalAndLoadUsers: async () => {},
  closePromoteModal: () => {},
  setSelectedUserId: () => {},
  promoteSelectedUser: async () => {},
  demoteUser: async () => {},
};

const AdministrationContext = createContext<AdministrationContextType>(
  defaultAdministrationContext,
);

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Une erreur inconnue est survenue';
};

const AdministrationContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { authenticatedUser, jwtData, refreshUser } =
    useContext<UserContextType>(UserContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [administrationList, setAdministrationList] = useState<
    UserProfile[] | null
  >(null);
  const [openPromoteModal, setOpenPromoteModal] = useState(false);
  const [nonAdmins, setNonAdmins] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [promoteError, setPromoteError] = useState('');
  const [demoteError, setDemoteError] = useState('');
  const navigate = useNavigate();
  const currentUserId = jwtData()?.id;

  const refreshAdministrators = useCallback(async () => {
    if (!authenticatedUser) {
      setAdministrationList(null);
      setError(null);
      return;
    }

    try {
      const administrators = await fetchAdministrators(authenticatedUser.token);
      setAdministrationList(administrators);
      setError(null);
    } catch (fetchError: unknown) {
      setError(getErrorMessage(fetchError));
    }
  }, [authenticatedUser]);

  useEffect(() => {
    const loadAdministrators = async () => {
      if (!authenticatedUser) {
        setAdministrationList(null);
        setNonAdmins([]);
        setOpenPromoteModal(false);
        setSelectedUserId('');
        setPromoteError('');
        setDemoteError('');
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      await refreshAdministrators();
      setLoading(false);
    };

    void loadAdministrators();
  }, [authenticatedUser, refreshAdministrators]);

  const openPromoteModalAndLoadUsers = async () => {
    if (!authenticatedUser) {
      return;
    }

    try {
      const users = await fetchNonAdmins(authenticatedUser.token);
      setNonAdmins(users);
      setSelectedUserId('');
      setPromoteError('');
      setOpenPromoteModal(true);
    } catch (fetchError: unknown) {
      setPromoteError(getErrorMessage(fetchError));
    }
  };

  const closePromoteModal = () => {
    setOpenPromoteModal(false);
    setSelectedUserId('');
    setPromoteError('');
  };

  const promoteSelectedUser = async () => {
    if (!authenticatedUser || selectedUserId === '') {
      return;
    }

    try {
      await promoteAdministrator(authenticatedUser.token, selectedUserId);
      closePromoteModal();
      await refreshAdministrators();
    } catch (promoteUserError: unknown) {
      setPromoteError(getErrorMessage(promoteUserError));
    }
  };

  const demoteUser = async (userId: number) => {
    if (!authenticatedUser) {
      return;
    }

    try {
      await demoteAdministrator(authenticatedUser.token, userId);
      setDemoteError('');
      if (userId === currentUserId) {
        await refreshUser();
        navigate('/');
      } else {
        await refreshAdministrators();
      }
    } catch (demoteUserError: unknown) {
      setDemoteError(getErrorMessage(demoteUserError));
    }
  };

  const administrationContextValue: AdministrationContextType = {
    loading,
    error,
    administrationList,
    nonAdmins,
    openPromoteModal,
    selectedUserId,
    promoteError,
    demoteError,
    currentUserId,
    refreshAdministrators,
    openPromoteModalAndLoadUsers,
    closePromoteModal,
    setSelectedUserId,
    promoteSelectedUser,
    demoteUser,
  };

  return (
    <AdministrationContext.Provider value={administrationContextValue}>
      {children}
    </AdministrationContext.Provider>
  );
};

export { AdministrationContext, AdministrationContextProvider };
