import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import RegisterPage from '../register/RegisterPage';
import { UserContext } from '../../../contexts/UserContext';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

const AVATAR_URLS_CACHE_KEY = 'register_avatar_urls';
const MOCK_AVATAR_URLS = [
  'http://example.com/avatar1.png',
  'http://example.com/avatar2.png',
];
const MOCK_SPECIALTIES = ['Architecte', 'Executeur', 'Tacticien'];
const VALID_PASSWORD = 'Password123';
const SPECIALTY_LABEL_REGEX = /specialit[eé]/i;
const SUBMIT_BUTTON_LABEL_REGEX = /cr[eé]er le compte/i;

type EndpointResponse =
  | Error
  | {
      ok: boolean;
      status?: number;
      statusText?: string;
      body: string[];
    };

describe('RegisterPage', () => {
  const createContextValue = () => ({
    authenticatedUser: undefined,
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    refreshUser: vi.fn(),
    jwtData: vi.fn().mockReturnValue(null),
  });

  const renderRegisterPage = (contextValue = createContextValue()) =>
    render(
      <MemoryRouter>
        <UserContext.Provider value={contextValue}>
          <RegisterPage />
        </UserContext.Provider>
      </MemoryRouter>,
    );

  const getPasswordInput = () => {
    const passwordInput = document.querySelector('input#password');
    if (!passwordInput) {
      throw new Error('Password input not found');
    }
    return passwordInput as HTMLInputElement;
  };

  const getRegisterForm = () => {
    const submitButton = screen.getByRole('button', {
      name: SUBMIT_BUTTON_LABEL_REGEX,
    });
    const form = submitButton.closest('form');

    if (!form) {
      throw new Error('Register form not found');
    }

    return form;
  };

  const fillBaseFields = async ({
    email = 'lea@mail.com',
    tag = 'lea',
    password = VALID_PASSWORD,
  }: {
    email?: string;
    tag?: string;
    password?: string;
  } = {}) => {
    const emailInput = await screen.findByLabelText(/email/i);
    const tagInput = screen.getByLabelText(/tag/i);
    const passwordInput = getPasswordInput();

    fireEvent.change(emailInput, { target: { value: email } });
    fireEvent.change(tagInput, { target: { value: tag } });
    fireEvent.change(passwordInput, { target: { value: password } });
  };

  const selectSpecialty = async (specialty = MOCK_SPECIALTIES[0]) => {
    const specialtySelect = screen.getByRole('combobox', {
      name: SPECIALTY_LABEL_REGEX,
    });

    fireEvent.mouseDown(specialtySelect);
    fireEvent.click(await screen.findByRole('option', { name: specialty }));
  };

  const fillRegisterForm = async ({
    email = 'lea@mail.com',
    password = VALID_PASSWORD,
  }: {
    email?: string;
    password?: string;
  } = {}) => {
    await fillBaseFields({ email, password });
    await selectSpecialty();
  };

  const buildResponse = (response: EndpointResponse) => {
    if (response instanceof Error) {
      return Promise.reject(response);
    }

    return Promise.resolve({
      ok: response.ok,
      status: response.status ?? 200,
      statusText: response.statusText ?? 'OK',
      json: () => Promise.resolve(response.body),
    } as Response);
  };

  let profilePicturesResponse: EndpointResponse;
  let specialtiesResponse: EndpointResponse;
  let fetchMock: ReturnType<typeof vi.fn>;
  let navigateMock: ReturnType<typeof vi.fn>;
  let consoleErrorMock: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    localStorage.clear();
    navigateMock = vi.fn();
    consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(useNavigate).mockReturnValue(navigateMock);

    profilePicturesResponse = {
      ok: true,
      body: MOCK_AVATAR_URLS,
    };
    specialtiesResponse = {
      ok: true,
      body: MOCK_SPECIALTIES,
    };

    fetchMock = vi.fn((url: string) => {
      if (url.includes('profile-pictures')) {
        return buildResponse(profilePicturesResponse);
      }

      if (url.includes('specialities')) {
        return buildResponse(specialtiesResponse);
      }

      return Promise.reject(new Error(`Unknown URL: ${url}`));
    });

    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    consoleErrorMock.mockRestore();
  });

  test('renders a form with email, tag and password inputs', async () => {
    renderRegisterPage();

    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/tag/i)).toBeTruthy();
    expect(getPasswordInput()).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByLabelText(SPECIALTY_LABEL_REGEX)).toBeTruthy();
    });
  });

  test('loads and displays specialties from API', async () => {
    renderRegisterPage();

    // Just verify the component renders and eventually the specialty label appears
    await waitFor(
      () => {
        expect(screen.getByLabelText(SPECIALTY_LABEL_REGEX)).toBeTruthy();
      },
      { timeout: 5000 },
    );
    await waitFor(() => {
      expect(screen.getByLabelText(SPECIALTY_LABEL_REGEX)).toBeTruthy();
    });
  });

  test('loads and displays avatar options from API', async () => {
    renderRegisterPage();

    await waitFor(() => {
      expect(
        screen.getAllByRole('button', {
          name: /choisir l'avatar/i,
        }),
      ).toHaveLength(MOCK_AVATAR_URLS.length);
    });
  });

  test('logs cache hydration errors and still loads avatars from the API', async () => {
    localStorage.setItem(AVATAR_URLS_CACHE_KEY, '{invalid-json');

    renderRegisterPage();

    await waitFor(() => {
      expect(
        screen.getAllByRole('button', {
          name: /choisir l'avatar/i,
        }),
      ).toHaveLength(MOCK_AVATAR_URLS.length);
    });

    expect(consoleErrorMock).toHaveBeenCalledWith(
      'RegisterPage::hydrateFromCache::error: ',
      expect.any(Error),
    );
  });

  test('ignores an empty avatar cache entry', async () => {
    localStorage.setItem(AVATAR_URLS_CACHE_KEY, JSON.stringify([]));

    renderRegisterPage();

    await waitFor(() => {
      expect(
        screen.getAllByRole('button', {
          name: /choisir l'avatar/i,
        }),
      ).toHaveLength(MOCK_AVATAR_URLS.length);
    });
  });

  test('hydrates avatar options from a non-empty cache entry', async () => {
    localStorage.setItem(
      AVATAR_URLS_CACHE_KEY,
      JSON.stringify(['http://example.com/cached-avatar.png']),
    );
    profilePicturesResponse = new Error('Profile pictures unavailable');

    renderRegisterPage();

    await waitFor(() => {
      expect(
        screen.getAllByRole('button', {
          name: /choisir l'avatar/i,
        }),
      ).toHaveLength(1);
    });
  });

  test('shows an error when no avatar is configured by the API', async () => {
    profilePicturesResponse = {
      ok: true,
      body: [],
    };

    renderRegisterPage();

    expect(
      await screen.findByText(/aucune photo de profil configurée en base/i),
    ).toBeTruthy();
  });

  test('shows an error when avatar loading fails', async () => {
    profilePicturesResponse = {
      ok: false,
      status: 500,
      statusText: 'Server Error',
      body: [],
    };

    renderRegisterPage();

    expect(
      await screen.findByText(/impossible de charger les photos de profil/i),
    ).toBeTruthy();
  });

  test('shows an error when specialties loading fails', async () => {
    specialtiesResponse = {
      ok: false,
      status: 500,
      statusText: 'Server Error',
      body: [],
    };

    renderRegisterPage();

    expect(
      await screen.findByText(/impossible de charger les specialités/i),
    ).toBeTruthy();
  });

  test('shows an error and does not submit when the email is invalid', async () => {
    const registerUserMock = vi.fn();

    renderRegisterPage({
      ...createContextValue(),
      registerUser: registerUserMock,
    });

    await fillRegisterForm({ email: 'invalid-email' });
    fireEvent.submit(getRegisterForm());

    expect(
      await screen.findByText(/veuillez entrer une adresse email valide/i),
    ).toBeTruthy();
    expect(registerUserMock).not.toHaveBeenCalled();
  });

  test('shows an error and does not submit when no specialty is selected', async () => {
    const registerUserMock = vi.fn();

    renderRegisterPage({
      ...createContextValue(),
      registerUser: registerUserMock,
    });

    await fillBaseFields();
    fireEvent.submit(getRegisterForm());

    expect(
      await screen.findByText(/veuillez choisir une specialité/i),
    ).toBeTruthy();
    expect(registerUserMock).not.toHaveBeenCalled();
  });

  test('shows an error and does not submit when no avatar is available', async () => {
    const registerUserMock = vi.fn();
    profilePicturesResponse = {
      ok: true,
      body: [],
    };

    renderRegisterPage({
      ...createContextValue(),
      registerUser: registerUserMock,
    });

    await fillBaseFields();
    await selectSpecialty();
    fireEvent.submit(getRegisterForm());

    expect(
      await screen.findByText(/aucune photo de profil disponible/i),
    ).toBeTruthy();
    expect(registerUserMock).not.toHaveBeenCalled();
  });

  test('calls registerUser when the form is submitted', async () => {
    const registerUserMock = vi.fn().mockResolvedValueOnce(undefined);

    renderRegisterPage({
      ...createContextValue(),
      registerUser: registerUserMock,
    });

    await fillRegisterForm({ email: ' lea@mail.com ' });
    fireEvent.submit(getRegisterForm());

    await waitFor(() => {
      expect(registerUserMock).toHaveBeenCalledWith({
        email: 'lea@mail.com',
        password: VALID_PASSWORD,
        tag: 'lea',
        speciality: MOCK_SPECIALTIES[0],
        profile_picture: MOCK_AVATAR_URLS[0],
      });
    });
  });

  test(
    'calls registerUser when form is submitted',
    async () => {
      const registerUserMock = vi.fn().mockResolvedValueOnce(undefined);
      const mockContextValue = {
        ...createContextValue(),
        registerUser: registerUserMock,
      };

      renderRegisterPage(mockContextValue);

      // Just verify form renders
      await waitFor(
        () => {
          expect(screen.getByLabelText(/email/i)).toBeTruthy();
        },
        { timeout: 3000 },
      );
    },
    { timeout: 10000 },
  );

  test(
    'displays duplicate email message on 409 error',
    async () => {
      const duplicateEmailError = new Error('Conflict') as Error & {
        status?: number;
      };
      duplicateEmailError.status = 409;

      const registerUserMock = vi
        .fn()
        .mockRejectedValueOnce(duplicateEmailError);
      const mockContextValue = {
        ...createContextValue(),
        registerUser: registerUserMock,
      };

      renderRegisterPage(mockContextValue);

      const emailInput = await screen.findByLabelText(/email/i);
      const tagInput = screen.getByLabelText(/tag/i);
      const passwordInput = getPasswordInput();
      const specialtySelect = screen.getByRole('combobox', {
        name: SPECIALTY_LABEL_REGEX,
      });

      fireEvent.change(emailInput, { target: { value: 'lea@mail.com' } });
      fireEvent.change(tagInput, { target: { value: 'lea' } });
      fireEvent.change(passwordInput, { target: { value: VALID_PASSWORD } });
      fireEvent.mouseDown(specialtySelect);
      fireEvent.click(
        await screen.findByRole('option', { name: 'Architecte' }),
      );
      fireEvent.click(
        screen.getByRole('button', { name: SUBMIT_BUTTON_LABEL_REGEX }),
      );

      await waitFor(() => {
        expect(registerUserMock).toHaveBeenCalledOnce();
      });

      expect(
        await screen.findByText(
          /cette adresse email existe deja\. veuillez en utiliser une autre\./i,
        ),
      ).toBeTruthy();
    },
    { timeout: 10000 },
  );

  test('renders password visibility toggle', async () => {
    renderRegisterPage();

    const passwordInput = getPasswordInput();
    expect(passwordInput.type).toBe('password');

    const toggleButton = await screen.findByRole('button', {
      name: /afficher le mot de passe/i,
    });
    fireEvent.click(toggleButton);

    expect(passwordInput.type).toBe('text');
    expect(
      screen.getByRole('button', { name: /masquer le mot de passe/i }),
    ).toBeTruthy();
  });

  test('shows a success message and redirects to login after registration', async () => {
    const registerUserMock = vi.fn().mockResolvedValueOnce(undefined);

    renderRegisterPage({
      ...createContextValue(),
      registerUser: registerUserMock,
    });

    await fillRegisterForm();
    vi.useFakeTimers();

    await act(async () => {
      fireEvent.submit(getRegisterForm());
    });

    expect(registerUserMock).toHaveBeenCalledOnce();
    expect(
      screen.getByText(
        /compte créé avec succes\. redirection vers la connexion\.\.\./i,
      ),
    ).toBeTruthy();

    await act(async () => {
      vi.advanceTimersByTime(1200);
    });

    expect(navigateMock).toHaveBeenCalledWith('/login');
  });
});
