import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { beforeEach, describe, test, expect, vi } from 'vitest';
import LoginPage from '../LoginPage';
import { UserContext } from '../../../contexts/UserContext';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

describe('LoginPage', () => {
  const createContextValue = () => ({
    authenticatedUser: undefined,
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    refreshUser: vi.fn(),
    jwtData: vi.fn().mockReturnValue(null),
  });

  const renderLoginPage = (contextValue = createContextValue()) =>
    render(
      <MemoryRouter>
        <UserContext.Provider value={contextValue}>
          <LoginPage />
        </UserContext.Provider>
      </MemoryRouter>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getPasswordInput = () => {
    const passwordInput = document.querySelector('input#password');
    if (!passwordInput) {
      throw new Error('Password input not found');
    }
    return passwordInput as HTMLInputElement;
  };

  test('renders a form with email and password inputs', () => {
    renderLoginPage();

    const usernameInput = screen.getByLabelText(/email/i);
    const passwordInput = getPasswordInput();
    const rememberMeCheckbox = screen.getByLabelText(/se souvenir de moi/i);

    expect(usernameInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();
    expect(rememberMeCheckbox).toBeTruthy();
  });

  test('remember me checkbox is unchecked by default', () => {
    renderLoginPage();

    const rememberMeCheckbox = screen.getByLabelText(/se souvenir de moi/i);

    expect((rememberMeCheckbox as HTMLInputElement).checked).toBe(false);
  });

  test('calls loginUser and navigates to HomePage when the form is submitted', async () => {
    const loginUserMock = vi.fn();
    const navigateMock = vi.fn();
    const mockContextValue = {
      ...createContextValue(),
      loginUser: loginUserMock,
    };

    vi.mocked(useNavigate).mockReturnValue(navigateMock);

    renderLoginPage(mockContextValue);

    const usernameInput = screen.getByLabelText(/email/i);
    const passwordInput = getPasswordInput();
    const rememberMeCheckbox = screen.getByLabelText(/se souvenir de moi/i);
    const submitButton = screen.getByRole('button', {
      name: /s'authentifier/i,
    });

    fireEvent.change(usernameInput, { target: { value: 'test@user.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(rememberMeCheckbox);
    fireEvent.click(submitButton);

    expect(loginUserMock).toHaveBeenCalledWith(
      {
        email: 'test@user.com',
        password: 'password',
      },
      true,
    );

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/');
    });
  });

  test('calls console.error when loginUser throws an error', async () => {
    const loginUserMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('Login failed'));
    const consoleErrorMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const mockContextValue = {
      ...createContextValue(),
      loginUser: loginUserMock,
    };

    renderLoginPage(mockContextValue);

    const usernameInput = screen.getByLabelText(/email/i);
    const passwordInput = getPasswordInput();
    const submitButton = screen.getByRole('button', {
      name: /s'authentifier/i,
    });

    fireEvent.change(usernameInput, { target: { value: 'test@user.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(submitButton);

    expect(loginUserMock).toHaveBeenCalledWith(
      {
        email: 'test@user.com',
        password: 'password',
      },
      false,
    );

    // Verify that console.error was called
    await waitFor(() => {
      expect(consoleErrorMock).toHaveBeenCalledWith(
        'LoginPage::error: ',
        expect.any(Error),
      );
    });

    consoleErrorMock.mockRestore();
  });

  test('shows ban message when loginUser throws a 403 error', async () => {
    const error = Object.assign(new Error('Forbidden'), { status: 403 });
    const loginUserMock = vi.fn().mockRejectedValueOnce(error);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockContextValue = {
      ...createContextValue(),
      loginUser: loginUserMock,
    };

    renderLoginPage(mockContextValue);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@user.com' },
    });
    fireEvent.change(getPasswordInput(), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /s'authentifier/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Votre compte a été banni de la plateforme.'),
      ).toBeTruthy();
    });
  });

  test('shows generic error message when loginUser throws a non-403 error', async () => {
    const loginUserMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockContextValue = {
      ...createContextValue(),
      loginUser: loginUserMock,
    };

    renderLoginPage(mockContextValue);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@user.com' },
    });
    fireEvent.change(getPasswordInput(), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /s'authentifier/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Echec de connexion. Verifiez l'email et le mot de passe.",
        ),
      ).toBeTruthy();
    });
  });

  test('toggles password visibility', () => {
    renderLoginPage();

    const passwordInput = getPasswordInput();
    const toggleButton = screen.getByRole('button', {
      name: /display the password/i,
    });

    expect(passwordInput.type).toBe('password');

    fireEvent.click(toggleButton);

    expect(passwordInput.type).toBe('text');
    expect(
      screen.getByRole('button', { name: /hide the password/i }),
    ).toBeTruthy();
  });
});
