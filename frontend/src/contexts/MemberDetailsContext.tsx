import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useParams } from 'react-router-dom';
import {
  MemberDetailsContextType,
  Unavailability,
  UserContextType,
  UserPublicProfile,
} from '../types';
import {
  fetchMemberById,
  banMember,
  fetchMemberUnavailabilities,
} from '../services/membersService';
import { UserContext } from './UserContext';

const defaultMemberDetailsContext: MemberDetailsContextType = {
  loading: true,
  error: null,
  member: null,
  unavailabilities: [],
  canViewUnavailabilities: false,
  openBanModal: false,
  banError: '',
  setOpenBanModal: () => {},
  handleBanMember: async () => {},
};

const MemberDetailsContext = createContext<MemberDetailsContextType>(
  defaultMemberDetailsContext,
);

/**
 * Gets a message from an error.
 * @param {unknown} error - the error
 * @return {string} the message
 */
const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return 'Une erreur inconnue est survenue';
};

/**
 * Provides member details, unavailabilities and ban actions to its children.
 * @return {JSX.Element} the provider
 */
const MemberDetailsContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { memberId } = useParams();
  const { authenticatedUser } = useContext<UserContextType>(UserContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [member, setMember] = useState<UserPublicProfile | null>(null);
  const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>(
    [],
  );
  const [canViewUnavailabilities, setCanViewUnavailabilities] = useState(false);
  const [openBanModal, setOpenBanModal] = useState(false);
  const [banError, setBanError] = useState('');

  const parsedId = Number(memberId);

  const loadMember = useCallback(async () => {
    if (isNaN(parsedId)) {
      setError('Identifiant de membre invalide');
      return;
    }
    try {
      const fetched = await fetchMemberById(parsedId);
      setMember(fetched);
      setError(null);
    } catch (fetchError: unknown) {
      const msg = getErrorMessage(fetchError);
      setError(msg === 'Erreur 404' ? 'Membre introuvable.' : msg);
    }
    if (authenticatedUser?.token) {
      try {
        const unavails = await fetchMemberUnavailabilities(
          parsedId,
          authenticatedUser.token,
        );
        setUnavailabilities(unavails);
        setCanViewUnavailabilities(true);
      } catch {
        setUnavailabilities([]);
        setCanViewUnavailabilities(false);
      }
    }
  }, [parsedId, authenticatedUser?.token]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await loadMember();
      setLoading(false);
    };
    void fetchData();
  }, [loadMember]);

  const handleBanMember = async () => {
    if (!authenticatedUser || !member) return;
    try {
      await banMember(authenticatedUser.token, member.id);
      setOpenBanModal(false);
      setBanError('');
      await loadMember();
    } catch (err: unknown) {
      setBanError(getErrorMessage(err));
    }
  };

  const memberDetailsContextValue: MemberDetailsContextType = {
    loading,
    error,
    member,
    unavailabilities,
    canViewUnavailabilities,
    openBanModal,
    banError,
    setOpenBanModal,
    handleBanMember,
  };

  return (
    <MemberDetailsContext.Provider value={memberDetailsContextValue}>
      {children}
    </MemberDetailsContext.Provider>
  );
};

export { MemberDetailsContext, MemberDetailsContextProvider };
