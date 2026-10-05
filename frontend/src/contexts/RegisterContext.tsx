import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarOption, RegisterContextType, UserContextType } from '../types';
import { UserContext } from './UserContext';

const AVATAR_URLS_CACHE_KEY = 'register_avatar_urls';

type HttpError = Error & {
  status?: number;
};

const mapUrlsToAvatarOptions = (urls: string[]): AvatarOption[] =>
  urls.map((url, index) => ({
    id: `avatar-${index + 1}`,
    label: `Avatar ${index + 1}`,
    src: url,
  }));

const preloadImages = (urls: string[]) => {
  urls.forEach((url) => {
    const image = new Image();
    image.src = url;
  });
};

const getRegisterErrorMessage = (err: unknown): string => {
  const httpError = err as HttpError;
  const status =
    typeof httpError?.status === 'number' ? httpError.status : undefined;
  const lowerMessage = err instanceof Error ? err.message.toLowerCase() : '';

  if (status === 400) {
    return "Echec d'inscription. Verifiez les champs et la specialite choisie.";
  }

  if (status === 409) {
    return 'Cette adresse email existe deja. Veuillez en utiliser une autre.';
  }

  if (
    lowerMessage.includes('failed to fetch') ||
    lowerMessage.includes('network')
  ) {
    return "Impossible de contacter le serveur. Veuillez verifier que l'API est lancee.";
  }

  if (
    lowerMessage.includes('409') ||
    lowerMessage.includes('conflict') ||
    lowerMessage.includes('duplicate') ||
    lowerMessage.includes('already')
  ) {
    return 'Cette adresse email existe deja. Veuillez en utiliser une autre.';
  }

  if (lowerMessage.includes('400') || lowerMessage.includes('bad request')) {
    return "Echec d'inscription. Verifiez les champs et la specialite choisie.";
  }

  if (typeof status === 'number') {
    return `Echec d'inscription (HTTP ${status}). Veuillez reessayer.`;
  }

  return "Echec d'inscription. Veuillez reessayer.";
};

const defaultRegisterContext: RegisterContextType = {
  email: '',
  password: '',
  tag: '',
  specialty: '',
  specialties: [],
  avatarOptions: [],
  selectedAvatarId: '',
  isPasswordVisible: false,
  successMessage: '',
  errorMessage: '',
  setEmail: () => {},
  setPassword: () => {},
  setTag: () => {},
  setSpecialty: () => {},
  setSelectedAvatarId: () => {},
  togglePasswordVisibility: () => {},
  submitRegistration: async () => {},
};

const RegisterContext = createContext<RegisterContextType>(
  defaultRegisterContext,
);

const RegisterContextProvider = ({ children }: { children: ReactNode }) => {
  const { registerUser }: UserContextType = useContext(UserContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tag, setTag] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [avatarOptions, setAvatarOptions] = useState<AvatarOption[]>([]);
  const [selectedAvatarId, setSelectedAvatarId] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const hydrateFromCache = () => {
      try {
        const cached = localStorage.getItem(AVATAR_URLS_CACHE_KEY);
        if (cached == null) {
          return;
        }

        const cachedUrls = JSON.parse(cached) as string[];
        if (cachedUrls.length === 0) {
          return;
        }

        const cachedOptions = mapUrlsToAvatarOptions(cachedUrls);
        setAvatarOptions(cachedOptions);
        setSelectedAvatarId(cachedOptions[0].id);
      } catch (err) {
        console.error('RegisterPage::hydrateFromCache::error: ', err);
      }
    };

    const loadProfilePictures = async () => {
      try {
        const response = await fetch('/api/profile-pictures');
        if (!response.ok) {
          throw new Error(
            `fetch error : ${response.status} : ${response.statusText}`,
          );
        }

        const urls: string[] = await response.json();
        const options = mapUrlsToAvatarOptions(urls);

        setAvatarOptions(options);
        if (options.length > 0) {
          setSelectedAvatarId(options[0].id);
          localStorage.setItem(AVATAR_URLS_CACHE_KEY, JSON.stringify(urls));
          preloadImages(urls);
        } else {
          setErrorMessage('Aucune photo de profil configurée en base.');
        }
      } catch (err) {
        console.error('RegisterPage::loadProfilePictures::error: ', err);
        setErrorMessage('Impossible de charger les photos de profil.');
      }
    };

    const loadSpecialties = async () => {
      try {
        const response = await fetch('/api/specialities');
        if (!response.ok) {
          throw new Error(
            `fetch error : ${response.status} : ${response.statusText}`,
          );
        }

        const specialtiesList: string[] = await response.json();
        setSpecialties(specialtiesList);
      } catch (err) {
        console.error('RegisterPage::loadSpecialties::error: ', err);
        setErrorMessage('Impossible de charger les specialités.');
      }
    };

    hydrateFromCache();
    void loadProfilePictures();
    void loadSpecialties();
  }, []);

  const submitRegistration = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Veuillez entrer une adresse email valide.');
      return;
    }

    if (!specialty) {
      setErrorMessage('Veuillez choisir une specialité.');
      return;
    }

    if (!selectedAvatarId) {
      setErrorMessage('Aucune photo de profil disponible.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setErrorMessage(
        'Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 minuscule et 1 chiffre.',
      );
      return;
    }

    try {
      const selectedAvatar = avatarOptions.find(
        (avatar) => avatar.id === selectedAvatarId,
      );

      await registerUser({
        email: trimmedEmail,
        password,
        tag,
        speciality: specialty,
        profile_picture: selectedAvatar?.src ?? '',
      });
      setSuccessMessage(
        'Compte créé avec succes. Redirection vers la connexion...',
      );
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      console.error('RegisterPage::error: ', err);
      setErrorMessage(getRegisterErrorMessage(err));
    }
  };

  const registerContextValue: RegisterContextType = {
    email,
    password,
    tag,
    specialty,
    specialties,
    avatarOptions,
    selectedAvatarId,
    isPasswordVisible,
    successMessage,
    errorMessage,
    setEmail,
    setPassword,
    setTag,
    setSpecialty,
    setSelectedAvatarId,
    togglePasswordVisibility: () =>
      setIsPasswordVisible((currentValue) => !currentValue),
    submitRegistration,
  };

  return (
    <RegisterContext.Provider value={registerContextValue}>
      {children}
    </RegisterContext.Provider>
  );
};

export { RegisterContext, RegisterContextProvider };
