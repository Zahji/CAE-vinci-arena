import { useContext } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { RegisterContext, RegisterContextProvider } from './RegisterContext';
import { UserContext } from './UserContext';
import { RegisterContextType, UserContextType } from '../types';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('RegisterContext', () => {
  let contextValue: RegisterContextType | undefined;
  let fetchMock: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockSuccessfulInitialFetches = () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ['avatar1.png'],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ['Architecte'],
      });
  };

  const ContextConsumer = () => {
    contextValue = useContext(RegisterContext);
    return null;
  };

  const createUserContextValue = (): UserContextType => ({
    authenticatedUser: undefined,
    registerUser: vi.fn().mockResolvedValue(undefined),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    refreshUser: vi.fn(),
    jwtData: vi.fn().mockReturnValue(null),
  });

  const createWrapper =
    (userContextValue = createUserContextValue()) =>
    ({ children }: { children: React.ReactNode }) => (
      <UserContext.Provider value={userContextValue}>
        <RegisterContextProvider>{children}</RegisterContextProvider>
      </UserContext.Provider>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  test('default context no-op methods are safe without provider', async () => {
    render(<ContextConsumer />);

    expect(contextValue).toBeDefined();

    expect(() =>
      contextValue?.setEmail('no-provider@example.com'),
    ).not.toThrow();
    expect(() => contextValue?.setPassword('Password123')).not.toThrow();
    expect(() => contextValue?.setTag('tag')).not.toThrow();
    expect(() => contextValue?.setSpecialty('Architecte')).not.toThrow();
    expect(() => contextValue?.setSelectedAvatarId('avatar-1')).not.toThrow();
    expect(() => contextValue?.togglePasswordVisibility()).not.toThrow();

    await expect(contextValue?.submitRegistration()).resolves.toBeUndefined();
  });

  test('initializes with default values', () => {
    render(<ContextConsumer />, {
      wrapper: createWrapper(),
    });

    expect(contextValue).toBeDefined();
    expect(contextValue?.email).toBe('');
    expect(contextValue?.password).toBe('');
    expect(contextValue?.tag).toBe('');
    expect(contextValue?.specialty).toBe('');
    expect(contextValue?.isPasswordVisible).toBe(false);
  });

  test('setEmail updates email value', () => {
    render(<ContextConsumer />, {
      wrapper: createWrapper(),
    });

    act(() => {
      contextValue?.setEmail('test@example.com');
    });

    expect(contextValue?.email).toBe('test@example.com');
  });

  test('setPassword updates password value', () => {
    render(<ContextConsumer />, {
      wrapper: createWrapper(),
    });

    act(() => {
      contextValue?.setPassword('SecurePassword123');
    });

    expect(contextValue?.password).toBe('SecurePassword123');
  });

  test('setTag updates tag value', () => {
    render(<ContextConsumer />, {
      wrapper: createWrapper(),
    });

    act(() => {
      contextValue?.setTag('mytag');
    });

    expect(contextValue?.tag).toBe('mytag');
  });

  test('setSpecialty updates specialty value', () => {
    render(<ContextConsumer />, {
      wrapper: createWrapper(),
    });

    act(() => {
      contextValue?.setSpecialty('Architecte');
    });

    expect(contextValue?.specialty).toBe('Architecte');
  });

  test('togglePasswordVisibility toggles visibility', () => {
    render(<ContextConsumer />, {
      wrapper: createWrapper(),
    });

    const initialState = contextValue?.isPasswordVisible;

    act(() => {
      contextValue?.togglePasswordVisibility();
    });

    expect(contextValue?.isPasswordVisible).toBe(!initialState);
  });

  test('loads avatar options on mount', async () => {
    const mockAvatarData = [
      { id: 'avatar-1', label: 'Avatar 1', src: 'avatar1.png' },
      { id: 'avatar-2', label: 'Avatar 2', src: 'avatar2.png' },
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAvatarData,
    });

    render(<ContextConsumer />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(contextValue?.avatarOptions).toHaveLength(2);
    });

    expect(contextValue?.selectedAvatarId).toBe('avatar-1');
  });

  test('loads specialties on mount', async () => {
    const mockAvatarData = [
      { id: 'avatar-1', label: 'Avatar 1', src: 'avatar1.png' },
    ];
    const mockSpecialties = ['Architecte', 'Tacticien', 'Executeur'];

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAvatarData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSpecialties,
      });

    render(<ContextConsumer />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(contextValue?.specialties).toEqual(mockSpecialties);
    });
  });

  test('hydrates avatar options from cache when present', async () => {
    localStorage.setItem(
      'register_avatar_urls',
      JSON.stringify(['cached-1.png', 'cached-2.png']),
    );

    mockSuccessfulInitialFetches();

    render(<ContextConsumer />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(contextValue?.avatarOptions).toHaveLength(2);
      expect(contextValue?.avatarOptions[0].src).toBe('cached-1.png');
      expect(contextValue?.selectedAvatarId).toBe('avatar-1');
    });
  });

  test('ignores cached avatar list when cache array is empty', async () => {
    localStorage.setItem('register_avatar_urls', JSON.stringify([]));

    mockSuccessfulInitialFetches();

    render(<ContextConsumer />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(contextValue?.avatarOptions).toHaveLength(1);
      expect(contextValue?.avatarOptions[0].src).toBe('avatar1.png');
    });
  });

  test('handles invalid cache payload gracefully', async () => {
    localStorage.setItem('register_avatar_urls', '{invalid-json');

    mockSuccessfulInitialFetches();

    render(<ContextConsumer />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(contextValue?.avatarOptions).toHaveLength(1);
    });
  });

  test('sets error when profile pictures request is not ok', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ['Architecte'],
      });

    render(<ContextConsumer />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(contextValue?.errorMessage).toBe(
        'Impossible de charger les photos de profil.',
      );
    });
  });

  test('sets error when profile pictures list is empty', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ['Architecte'],
      });

    render(<ContextConsumer />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(contextValue?.errorMessage).toBe(
        'Aucune photo de profil configurée en base.',
      );
    });
  });

  test('sets error when specialties request is not ok', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ['avatar1.png'],
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

    render(<ContextConsumer />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(contextValue?.errorMessage).toBe(
        'Impossible de charger les specialités.',
      );
    });
  });

  test('submitRegistration calls registerUser on success', async () => {
    const registerUserMock = vi.fn().mockResolvedValue(undefined);
    const mockUserContext = createUserContextValue();
    mockUserContext.registerUser = registerUserMock;

    mockSuccessfulInitialFetches();

    render(<ContextConsumer />, {
      wrapper: createWrapper(mockUserContext),
    });

    await waitFor(() => {
      expect(contextValue?.avatarOptions).toHaveLength(1);
      expect(contextValue?.specialties).toEqual(['Architecte']);
    });

    act(() => {
      contextValue?.setEmail('test@example.com');
      contextValue?.setPassword('Password123');
      contextValue?.setTag('testuser');
      contextValue?.setSpecialty('Architecte');
      contextValue?.setSelectedAvatarId('avatar-1');
    });

    await act(async () => {
      await contextValue?.submitRegistration();
    });

    expect(registerUserMock).toHaveBeenCalled();
  });

  test('submitRegistration returns password validation error for weak password', async () => {
    const registerUserMock = vi.fn().mockResolvedValue(undefined);
    const mockUserContext = createUserContextValue();
    mockUserContext.registerUser = registerUserMock;

    mockSuccessfulInitialFetches();

    render(<ContextConsumer />, {
      wrapper: createWrapper(mockUserContext),
    });

    await waitFor(() => {
      expect(contextValue?.avatarOptions).toHaveLength(1);
      expect(contextValue?.specialties).toEqual(['Architecte']);
    });

    act(() => {
      contextValue?.setEmail('test@example.com');
      contextValue?.setPassword('weakpass');
      contextValue?.setTag('testuser');
      contextValue?.setSpecialty('Architecte');
      contextValue?.setSelectedAvatarId('avatar-1');
    });

    await act(async () => {
      await contextValue?.submitRegistration();
    });

    expect(registerUserMock).not.toHaveBeenCalled();
    expect(contextValue?.errorMessage).toBe(
      'Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 minuscule et 1 chiffre.',
    );
  });

  test('submitRegistration validates email format', async () => {
    const registerUserMock = vi.fn().mockResolvedValue(undefined);
    const mockUserContext = createUserContextValue();
    mockUserContext.registerUser = registerUserMock;

    mockSuccessfulInitialFetches();

    render(<ContextConsumer />, {
      wrapper: createWrapper(mockUserContext),
    });

    await waitFor(() => {
      expect(contextValue?.avatarOptions).toHaveLength(1);
    });

    act(() => {
      contextValue?.setEmail('invalid-email');
      contextValue?.setPassword('Password123');
      contextValue?.setTag('testuser');
      contextValue?.setSpecialty('Architecte');
      contextValue?.setSelectedAvatarId('avatar-1');
    });

    await act(async () => {
      await contextValue?.submitRegistration();
    });

    expect(registerUserMock).not.toHaveBeenCalled();
    expect(contextValue?.errorMessage).toBe(
      'Veuillez entrer une adresse email valide.',
    );
  });

  test('submitRegistration requires specialty', async () => {
    const registerUserMock = vi.fn().mockResolvedValue(undefined);
    const mockUserContext = createUserContextValue();
    mockUserContext.registerUser = registerUserMock;

    mockSuccessfulInitialFetches();

    render(<ContextConsumer />, {
      wrapper: createWrapper(mockUserContext),
    });

    await waitFor(() => {
      expect(contextValue?.avatarOptions).toHaveLength(1);
    });

    act(() => {
      contextValue?.setEmail('test@example.com');
      contextValue?.setPassword('Password123');
      contextValue?.setTag('testuser');
      contextValue?.setSelectedAvatarId('avatar-1');
    });

    await act(async () => {
      await contextValue?.submitRegistration();
    });

    expect(registerUserMock).not.toHaveBeenCalled();
    expect(contextValue?.errorMessage).toBe('Veuillez choisir une specialité.');
  });

  test('submitRegistration requires selected avatar', async () => {
    const registerUserMock = vi.fn().mockResolvedValue(undefined);
    const mockUserContext = createUserContextValue();
    mockUserContext.registerUser = registerUserMock;

    mockSuccessfulInitialFetches();

    render(<ContextConsumer />, {
      wrapper: createWrapper(mockUserContext),
    });

    await waitFor(() => {
      expect(contextValue?.avatarOptions).toHaveLength(1);
    });

    act(() => {
      contextValue?.setEmail('test@example.com');
      contextValue?.setPassword('Password123');
      contextValue?.setTag('testuser');
      contextValue?.setSpecialty('Architecte');
      contextValue?.setSelectedAvatarId('');
    });

    await act(async () => {
      await contextValue?.submitRegistration();
    });

    expect(registerUserMock).not.toHaveBeenCalled();
    expect(contextValue?.errorMessage).toBe(
      'Aucune photo de profil disponible.',
    );
  });

  test('submitRegistration maps status 400 errors', async () => {
    const registerUserMock = vi
      .fn()
      .mockRejectedValue(
        Object.assign(new Error('invalid payload'), { status: 400 }),
      );
    const mockUserContext = createUserContextValue();
    mockUserContext.registerUser = registerUserMock;

    mockSuccessfulInitialFetches();

    render(<ContextConsumer />, {
      wrapper: createWrapper(mockUserContext),
    });

    await waitFor(() => {
      expect(contextValue?.avatarOptions).toHaveLength(1);
    });

    act(() => {
      contextValue?.setEmail('test@example.com');
      contextValue?.setPassword('Password123');
      contextValue?.setTag('testuser');
      contextValue?.setSpecialty('Architecte');
      contextValue?.setSelectedAvatarId('avatar-1');
    });

    await act(async () => {
      await contextValue?.submitRegistration();
    });

    expect(contextValue?.errorMessage).toBe(
      "Echec d'inscription. Verifiez les champs et la specialite choisie.",
    );
  });

  test('submitRegistration maps status 409 errors', async () => {
    const registerUserMock = vi
      .fn()
      .mockRejectedValue(
        Object.assign(new Error('duplicate email'), { status: 409 }),
      );
    const mockUserContext = createUserContextValue();
    mockUserContext.registerUser = registerUserMock;

    mockSuccessfulInitialFetches();

    render(<ContextConsumer />, {
      wrapper: createWrapper(mockUserContext),
    });

    await waitFor(() => {
      expect(contextValue?.avatarOptions).toHaveLength(1);
    });

    act(() => {
      contextValue?.setEmail('test@example.com');
      contextValue?.setPassword('Password123');
      contextValue?.setTag('testuser');
      contextValue?.setSpecialty('Architecte');
      contextValue?.setSelectedAvatarId('avatar-1');
    });

    await act(async () => {
      await contextValue?.submitRegistration();
    });

    expect(contextValue?.errorMessage).toBe(
      'Cette adresse email existe deja. Veuillez en utiliser une autre.',
    );
  });

  test('submitRegistration maps network-like errors', async () => {
    const registerUserMock = vi
      .fn()
      .mockRejectedValue(new Error('Failed to fetch from API'));
    const mockUserContext = createUserContextValue();
    mockUserContext.registerUser = registerUserMock;

    mockSuccessfulInitialFetches();

    render(<ContextConsumer />, {
      wrapper: createWrapper(mockUserContext),
    });

    await waitFor(() => {
      expect(contextValue?.avatarOptions).toHaveLength(1);
    });

    act(() => {
      contextValue?.setEmail('test@example.com');
      contextValue?.setPassword('Password123');
      contextValue?.setTag('testuser');
      contextValue?.setSpecialty('Architecte');
      contextValue?.setSelectedAvatarId('avatar-1');
    });

    await act(async () => {
      await contextValue?.submitRegistration();
    });

    expect(contextValue?.errorMessage).toBe(
      "Impossible de contacter le serveur. Veuillez verifier que l'API est lancee.",
    );
  });

  test('submitRegistration maps conflict-like message errors', async () => {
    const registerUserMock = vi
      .fn()
      .mockRejectedValue(new Error('duplicate email already exists'));
    const mockUserContext = createUserContextValue();
    mockUserContext.registerUser = registerUserMock;

    mockSuccessfulInitialFetches();

    render(<ContextConsumer />, {
      wrapper: createWrapper(mockUserContext),
    });

    await waitFor(() => {
      expect(contextValue?.avatarOptions).toHaveLength(1);
    });

    act(() => {
      contextValue?.setEmail('test@example.com');
      contextValue?.setPassword('Password123');
      contextValue?.setTag('testuser');
      contextValue?.setSpecialty('Architecte');
      contextValue?.setSelectedAvatarId('avatar-1');
    });

    await act(async () => {
      await contextValue?.submitRegistration();
    });

    expect(contextValue?.errorMessage).toBe(
      'Cette adresse email existe deja. Veuillez en utiliser une autre.',
    );
  });

  test('submitRegistration sends empty profile picture when avatar id has no match', async () => {
    const registerUserMock = vi.fn().mockResolvedValue(undefined);
    const mockUserContext = createUserContextValue();
    mockUserContext.registerUser = registerUserMock;

    mockSuccessfulInitialFetches();

    render(<ContextConsumer />, {
      wrapper: createWrapper(mockUserContext),
    });

    await waitFor(() => {
      expect(contextValue?.avatarOptions).toHaveLength(1);
    });

    act(() => {
      contextValue?.setEmail('test@example.com');
      contextValue?.setPassword('Password123');
      contextValue?.setTag('testuser');
      contextValue?.setSpecialty('Architecte');
      contextValue?.setSelectedAvatarId('avatar-999');
    });

    await act(async () => {
      await contextValue?.submitRegistration();
    });

    expect(registerUserMock).toHaveBeenCalledWith(
      expect.objectContaining({ profile_picture: '' }),
    );
  });

  test('submitRegistration maps bad request error message to 400-friendly text', async () => {
    const registerUserMock = vi
      .fn()
      .mockRejectedValue(new Error('400 bad request while creating user'));
    const mockUserContext = createUserContextValue();
    mockUserContext.registerUser = registerUserMock;

    mockSuccessfulInitialFetches();

    render(<ContextConsumer />, {
      wrapper: createWrapper(mockUserContext),
    });

    await waitFor(() => {
      expect(contextValue?.avatarOptions).toHaveLength(1);
      expect(contextValue?.specialties).toEqual(['Architecte']);
    });

    act(() => {
      contextValue?.setEmail('test@example.com');
      contextValue?.setPassword('Password123');
      contextValue?.setTag('testuser');
      contextValue?.setSpecialty('Architecte');
      contextValue?.setSelectedAvatarId('avatar-1');
    });

    await act(async () => {
      await contextValue?.submitRegistration();
    });

    expect(contextValue?.errorMessage).toBe(
      "Echec d'inscription. Verifiez les champs et la specialite choisie.",
    );
  });

  test('submitRegistration maps numeric HTTP status to generic HTTP error text', async () => {
    const statusError = Object.assign(new Error('server down'), {
      status: 503,
    });
    const registerUserMock = vi.fn().mockRejectedValue(statusError);
    const mockUserContext = createUserContextValue();
    mockUserContext.registerUser = registerUserMock;

    mockSuccessfulInitialFetches();

    render(<ContextConsumer />, {
      wrapper: createWrapper(mockUserContext),
    });

    await waitFor(() => {
      expect(contextValue?.avatarOptions).toHaveLength(1);
      expect(contextValue?.specialties).toEqual(['Architecte']);
    });

    act(() => {
      contextValue?.setEmail('test@example.com');
      contextValue?.setPassword('Password123');
      contextValue?.setTag('testuser');
      contextValue?.setSpecialty('Architecte');
      contextValue?.setSelectedAvatarId('avatar-1');
    });

    await act(async () => {
      await contextValue?.submitRegistration();
    });

    expect(contextValue?.errorMessage).toBe(
      "Echec d'inscription (HTTP 503). Veuillez reessayer.",
    );
  });

  test('submitRegistration maps unknown thrown values to fallback error text', async () => {
    const registerUserMock = vi.fn().mockRejectedValue('unexpected failure');
    const mockUserContext = createUserContextValue();
    mockUserContext.registerUser = registerUserMock;

    mockSuccessfulInitialFetches();

    render(<ContextConsumer />, {
      wrapper: createWrapper(mockUserContext),
    });

    await waitFor(() => {
      expect(contextValue?.avatarOptions).toHaveLength(1);
      expect(contextValue?.specialties).toEqual(['Architecte']);
    });

    act(() => {
      contextValue?.setEmail('test@example.com');
      contextValue?.setPassword('Password123');
      contextValue?.setTag('testuser');
      contextValue?.setSpecialty('Architecte');
      contextValue?.setSelectedAvatarId('avatar-1');
    });

    await act(async () => {
      await contextValue?.submitRegistration();
    });

    expect(contextValue?.errorMessage).toBe(
      "Echec d'inscription. Veuillez reessayer.",
    );
  });

  test('setSelectedAvatarId updates selected avatar', () => {
    render(<ContextConsumer />, {
      wrapper: createWrapper(),
    });

    act(() => {
      contextValue?.setSelectedAvatarId('avatar-3');
    });

    expect(contextValue?.selectedAvatarId).toBe('avatar-3');
  });
});
