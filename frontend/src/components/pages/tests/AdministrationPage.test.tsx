import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, test, expect, vi, afterEach } from 'vitest';
import { useNavigate } from 'react-router-dom';
import AdministrationPage from '../administration/AdministrationPage';
import { UserContext } from '../../../contexts/UserContext';
import { UserContextType, UserProfile } from '../../../types';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn() };
});

describe('AdministrationPage', () => {
  const mockAdmins: UserProfile[] = [
    {
      id: 1,
      email: 'admin@admin.com',
      tag: 'admin1',
      speciality: 'Mage',
      profilePicture: 'url1',
      date: '2024-01-01',
    },
  ];

  const mockNonAdmins: UserProfile[] = [
    {
      id: 2,
      email: 'user@user.com',
      tag: 'user1',
      speciality: 'Archer',
      profilePicture: 'url2',
      date: '2024-01-02',
    },
    {
      id: 3,
      email: 'user2@user.com',
      tag: 'user2',
      speciality: 'Guerrier',
      profilePicture: 'url3',
      date: '2024-01-03',
    },
  ];

  const mockOtherAdmin: UserProfile = {
    id: 2,
    email: 'admin2@admin.com',
    tag: 'admin2',
    speciality: 'Mage',
    profilePicture: 'url4',
    date: '2024-01-04',
  };

  const createContextValue = (): UserContextType => ({
    authenticatedUser: {
      id: 1,
      email: 'admin@admin.com',
      tag: 'admin1',
      token: 'test-token',
    },
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    refreshUser: vi.fn(),
    jwtData: vi
      .fn()
      .mockReturnValue({ id: 1, email: 'admin@admin.com', isAdmin: true }),
  });

  const renderAdministrationPage = (contextValue = createContextValue()) =>
    render(
      <UserContext.Provider value={contextValue}>
        <AdministrationPage />
      </UserContext.Provider>,
    );

  let fetchMock: ReturnType<typeof vi.fn>;
  let navigateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    navigateMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(useNavigate).mockReturnValue(navigateMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('renders the administration page title', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAdmins),
    });

    renderAdministrationPage();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: /administration/i }),
      ).toBeTruthy();
    });
  });

  test('displays "Aucun administrateur actuellement." when admin list is empty', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    renderAdministrationPage();

    await waitFor(() => {
      expect(
        screen.getByText(/aucun administrateur actuellement/i),
      ).toBeTruthy();
    });
  });

  test('displays table with admins when list is not empty', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAdmins),
    });

    renderAdministrationPage();

    await waitFor(() => {
      expect(screen.getByText('admin@admin.com')).toBeTruthy();
      expect(screen.getByText('admin1')).toBeTruthy();
    });
  });

  test('opens promote modal when button is clicked', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAdmins),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNonAdmins),
      });

    renderAdministrationPage();

    await waitFor(() => {
      const button = screen.getByRole('button', {
        name: /nommer un nouvel administrateur/i,
      });
      expect(button).toBeTruthy();
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /nommer un administrateur/i }),
      ).toBeTruthy();
    });
  });

  test('displays "Aucun utilisateur non-administrateur disponible." when no non-admins', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAdmins),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    renderAdministrationPage();

    await waitFor(() => {
      fireEvent.click(
        screen.getByRole('button', {
          name: /nommer un nouvel administrateur/i,
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/aucun utilisateur non-administrateur disponible/i),
      ).toBeTruthy();
    });
  });

  test('displays non-admin users in select dropdown', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAdmins),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNonAdmins),
      });

    renderAdministrationPage();

    // Click the open button
    const button = await screen.findByRole('button', {
      name: /nommer un nouvel administrateur/i,
    });
    fireEvent.click(button);

    // Wait for the dialog to appear
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /nommer un administrateur/i }),
      ).toBeTruthy();
    });

    // Open the select to render the options
    const selectInputs = screen.getAllByRole('combobox');
    const selectInput = selectInputs[selectInputs.length - 1];
    fireEvent.mouseDown(selectInput);

    // Now the options should be in the DOM
    await waitFor(() => {
      expect(screen.getByText(/user@user.com \(user1\)/)).toBeTruthy();
      expect(screen.getByText(/user2@user.com \(user2\)/)).toBeTruthy();
    });
  });

  test('disables confirm button when no user is selected', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAdmins),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNonAdmins),
      });

    renderAdministrationPage();

    const button = await screen.findByRole('button', {
      name: /nommer un nouvel administrateur/i,
    });
    fireEvent.click(button);

    // Wait for the dialog to render
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /nommer un administrateur/i }),
      ).toBeTruthy();
    });

    // The confirm button should be disabled when no user is selected
    const confirmButton = screen.getByRole('button', { name: /confirmer/i });
    expect((confirmButton as HTMLButtonElement).disabled).toBe(true);
  });

  test('promotes user to admin when confirmed', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAdmins),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNonAdmins),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([...mockAdmins, mockNonAdmins[0]]),
      });

    renderAdministrationPage();

    // Open modal
    const openButton = await screen.findByRole('button', {
      name: /nommer un nouvel administrateur/i,
    });
    fireEvent.click(openButton);

    // Wait for the dialog to appear
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /nommer un administrateur/i }),
      ).toBeTruthy();
    });

    // Find and open the select input
    const selectInputs = screen.getAllByRole('combobox');
    const selectInput = selectInputs[selectInputs.length - 1];
    fireEvent.mouseDown(selectInput);

    // Click on the first user option
    await waitFor(() => {
      const userOption = screen.getByText(/user@user.com \(user1\)/);
      fireEvent.click(userOption);
    });

    // Now the confirm button should be enabled and we click it
    const confirmButton = screen.getByRole('button', {
      name: /confirmer/i,
    });
    expect((confirmButton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(confirmButton);

    // Verify POST was called with the correct user ID
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/administrators/2'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  test('shows error message when not authenticated as admin', () => {
    const contextValue = {
      ...createContextValue(),
      jwtData: vi
        .fn()
        .mockReturnValue({ id: 1, email: 'user@user.com', isAdmin: false }),
    };

    renderAdministrationPage(contextValue);

    expect(screen.getByText(/vous devez être administrateur/i)).toBeTruthy();
  });

  test('shows error message when not authenticated', () => {
    const contextValue = {
      ...createContextValue(),
      authenticatedUser: undefined,
      jwtData: vi.fn().mockReturnValue(null),
    };

    renderAdministrationPage(contextValue);

    expect(screen.getByText(/vous devez être administrateur/i)).toBeTruthy();
  });

  test('shows a disabled demote button for the current user when they are the last admin', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAdmins),
    });

    renderAdministrationPage();

    await waitFor(() => {
      expect(screen.getByText('admin@admin.com')).toBeTruthy();
    });

    const button = screen.getByRole('button', { name: /rétrograder/i });
    expect(button).toBeTruthy();
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  test('shows demote button for all admins when multiple admins exist', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([...mockAdmins, mockOtherAdmin]),
    });

    renderAdministrationPage();

    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /rétrograder/i });
      expect(buttons).toHaveLength(2);
      expect((buttons[0] as HTMLButtonElement).disabled).toBe(false);
    });
  });

  test('calls DELETE when demote button is clicked for another admin', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([...mockAdmins, mockOtherAdmin]),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAdmins),
      });

    renderAdministrationPage();

    const demoteButtons = await screen.findAllByRole('button', {
      name: /rétrograder/i,
    });
    fireEvent.click(demoteButtons[1]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirmer/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/administrators/2'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  test('shows an error when demote returns 403', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([...mockAdmins, mockOtherAdmin]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

    renderAdministrationPage();

    const demoteButtons = await screen.findAllByRole('button', {
      name: /rétrograder/i,
    });
    fireEvent.click(demoteButtons[1]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirmer/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          /vous ne pouvez pas vous rétrograder si vous êtes le seul administrateur/i,
        ),
      ).toBeTruthy();
    });
  });

  test('calls refreshUser after self-demotion', async () => {
    const contextValue = createContextValue();
    const twoAdmins = [...mockAdmins, mockOtherAdmin];

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(twoAdmins),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 1,
            email: 'admin@admin.com',
            tag: 'admin1',
            token: 'new-token',
          }),
      });

    renderAdministrationPage(contextValue);

    const demoteButtons = await screen.findAllByRole('button', {
      name: /rétrograder/i,
    });
    fireEvent.click(demoteButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirmer/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/administrators/1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
      expect(contextValue.refreshUser).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith('/');
    });
  });
});
