import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  AvatarOption,
  Profile,
  ProfileContextType,
  Unavailability,
  UserContextType,
} from '../types';
import { UserContext } from './UserContext';
import {
  fetchProfile,
  fetchUnavailabilities,
  fetchSpecialities,
  fetchAvatars,
  updatePassword,
  addUnavailability,
  updateSpeciality,
  updateProfilePicture,
} from '../services/profileService';

const defaultProfileContext: ProfileContextType = {
  profile: null,
  specialties: [],
  unavailabilities: [],
  avatarOptions: [],
  loading: true,
  error: null,
  openPasswordModal: false,
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  passwordError: '',
  passwordSuccess: '',
  openUnavailModal: false,
  startDate: '',
  endDate: '',
  unavailError: '',
  openSpecialityModal: false,
  newSpeciality: '',
  specialityError: '',
  openPictureModal: false,
  selectedAvatarSrc: '',
  pictureError: '',
  setOpenPasswordModal: () => {},
  setOldPassword: () => {},
  setNewPassword: () => {},
  setConfirmPassword: () => {},
  handlePasswordUpdate: async () => {},
  setOpenUnavailModal: () => {},
  setStartDate: () => {},
  setEndDate: () => {},
  handleAddUnavailability: async () => {},
  setOpenSpecialityModal: () => {},
  setNewSpeciality: () => {},
  handleUpdateSpeciality: async () => {},
  setOpenPictureModal: () => {},
  setSelectedAvatarSrc: () => {},
  handleUpdatePicture: async () => {},
};

const ProfileContext = createContext<ProfileContextType>(defaultProfileContext);

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return 'Une erreur inconnue est survenue';
};

const ProfileContextProvider = ({ children }: { children: ReactNode }) => {
  const { authenticatedUser } = useContext<UserContextType>(UserContext);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>(
    [],
  );
  const [openUnavailModal, setOpenUnavailModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [unavailError, setUnavailError] = useState('');

  const [openSpecialityModal, setOpenSpecialityModal] = useState(false);
  const [newSpeciality, setNewSpeciality] = useState('');
  const [specialityError, setSpecialityError] = useState('');

  const [openPictureModal, setOpenPictureModal] = useState(false);
  const [avatarOptions, setAvatarOptions] = useState<AvatarOption[]>([]);
  const [selectedAvatarSrc, setSelectedAvatarSrc] = useState('');
  const [pictureError, setPictureError] = useState('');

  useEffect(() => {
    if (!authenticatedUser) return;

    const loadData = async () => {
      try {
        const profileData = await fetchProfile(authenticatedUser.token);
        setProfile(profileData);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }

      try {
        const unavails = await fetchUnavailabilities(authenticatedUser.token);
        setUnavailabilities(unavails);
      } catch (err: unknown) {
        console.error('Erreur lors du chargement des indisponibilités:', err);
      }

      try {
        const specs = await fetchSpecialities();
        setSpecialties(specs);
      } catch (err) {
        console.error('Erreur lors du chargement des spécialités:', err);
      }

      try {
        const avatars = await fetchAvatars();
        setAvatarOptions(avatars);
      } catch (err) {
        console.error('Erreur lors du chargement des avatars:', err);
      }
    };

    void loadData();
  }, [authenticatedUser]);

  const handlePasswordUpdate = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setPasswordError(
        'Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 minuscule et 1 chiffre.',
      );
      return;
    }
    try {
      await updatePassword(authenticatedUser!.token, oldPassword, newPassword);
      setPasswordSuccess('Mot de passe modifié avec succès !');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOpenPasswordModal(false);
    } catch (err: unknown) {
      setPasswordError(getErrorMessage(err));
    }
  };

  const handleAddUnavailability = async () => {
    setUnavailError('');
    if (!startDate || !endDate) {
      setUnavailError('Veuillez remplir les deux dates.');
      return;
    }
    if (endDate < startDate) {
      setUnavailError('La date de fin doit être après la date de début.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (startDate < today || endDate < today) {
      setUnavailError('Les dates ne peuvent pas être dans le passé.');
      return;
    }
    try {
      const data = await addUnavailability(
        authenticatedUser!.token,
        startDate,
        endDate,
      );
      setUnavailabilities([...unavailabilities, data]);
      setStartDate('');
      setEndDate('');
      setOpenUnavailModal(false);
    } catch (err: unknown) {
      setUnavailError(getErrorMessage(err));
    }
  };

  const handleUpdateSpeciality = async () => {
    setSpecialityError('');
    if (!newSpeciality) {
      setSpecialityError('Veuillez choisir une spécialité.');
      return;
    }
    try {
      await updateSpeciality(authenticatedUser!.token, newSpeciality);
      setProfile(profile ? { ...profile, speciality: newSpeciality } : null);
      setOpenSpecialityModal(false);
    } catch (err: unknown) {
      setSpecialityError(getErrorMessage(err));
    }
  };

  const handleUpdatePicture = async () => {
    setPictureError('');
    if (!selectedAvatarSrc) {
      setPictureError('Veuillez choisir une photo.');
      return;
    }
    try {
      await updateProfilePicture(authenticatedUser!.token, selectedAvatarSrc);
      setProfile(
        profile ? { ...profile, profilePicture: selectedAvatarSrc } : null,
      );
      setOpenPictureModal(false);
    } catch (err: unknown) {
      setPictureError(getErrorMessage(err));
    }
  };

  const profileContextValue: ProfileContextType = {
    profile,
    specialties,
    unavailabilities,
    avatarOptions,
    loading,
    error,
    openPasswordModal,
    oldPassword,
    newPassword,
    confirmPassword,
    passwordError,
    passwordSuccess,
    openUnavailModal,
    startDate,
    endDate,
    unavailError,
    openSpecialityModal,
    newSpeciality,
    specialityError,
    openPictureModal,
    selectedAvatarSrc,
    pictureError,
    setOpenPasswordModal,
    setOldPassword,
    setNewPassword,
    setConfirmPassword,
    handlePasswordUpdate,
    setOpenUnavailModal,
    setStartDate,
    setEndDate,
    handleAddUnavailability,
    setOpenSpecialityModal,
    setNewSpeciality,
    handleUpdateSpeciality,
    setOpenPictureModal,
    setSelectedAvatarSrc,
    handleUpdatePicture,
  };

  return (
    <ProfileContext.Provider value={profileContextValue}>
      {children}
    </ProfileContext.Provider>
  );
};

export { ProfileContext, ProfileContextProvider };
