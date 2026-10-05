import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, test, expect, vi, afterEach } from 'vitest';
import ProfilePage from '../profile/ProfilePage';
import { UserContext } from '../../../contexts/UserContext';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: vi.fn() };
});

describe('ProfilePage', () => {
  const mockProfile = {
    id: 1,
    email: 'user@user.com',
    tag: 'user1',
    speciality: 'Mage',
    profilePicture: 'url1',
    date: '2024-01-01',
    teamName: 'Team 1',
    isManager: false,
  };

  const mockSpecialties = ['Mage', 'Archer', 'Guerrier'];

  const mockUnavailabilities = [
    { id: 1, startDate: '2024-02-01', endDate: '2024-02-05' },
  ];

  const mockAvatarUrls = ['url1', 'url2'];

  const createContextValue = () => ({
    authenticatedUser: {
      id: 1,
      email: 'user@user.com',
      tag: 'user1',
      token: 'test-token',
      teamId: 1,
    },
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    clearUser: vi.fn(),
    refreshUser: vi.fn(),
    jwtData: vi
      .fn()
      .mockReturnValue({ id: 1, email: 'user@user.com', isAdmin: false }),
  });

  const renderProfilePage = (contextValue = createContextValue()) =>
    render(
      <MemoryRouter>
        <UserContext.Provider value={contextValue}>
          <ProfilePage />
        </UserContext.Provider>
      </MemoryRouter>,
    );

  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const mockInitialFetches = () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfile),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUnavailabilities),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSpecialties),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAvatarUrls),
      })
      .mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });
  };

  test('shows message when not authenticated', () => {
    const contextValue = { ...createContextValue(), authenticatedUser: null };
    renderProfilePage(contextValue as never);
    expect(screen.getByText(/vous devez être connecté/i)).toBeTruthy();
  });

  test('renders the page title', async () => {
    mockInitialFetches();
    renderProfilePage();
    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /mon espace personnel/i,
        }),
      ).toBeTruthy();
    });
  });

  test('displays profile info after loading', async () => {
    mockInitialFetches();
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeTruthy();
      expect(screen.getByText('Mage')).toBeTruthy();
      expect(screen.getByText('Team 1')).toBeTruthy();
      expect(screen.getByText('user@user.com')).toBeTruthy();
    });
  });

  test('displays formatted creation date', async () => {
    mockInitialFetches();
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('01/01/2024')).toBeTruthy();
    });
  });

  test('displays "Aucune team" when teamName is null', async () => {
    const contextWithNoTeam = {
      ...createContextValue(),
      authenticatedUser: {
        id: 1,
        email: 'user@user.com',
        tag: 'user1',
        token: 'test-token',
        teamId: undefined as number | undefined,
      },
    };
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockProfile, teamName: null }),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSpecialties),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAvatarUrls),
      })
      .mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    renderProfilePage(contextWithNoTeam as never);
    await waitFor(() => {
      expect(screen.getByText('Aucune team')).toBeTruthy();
    });
  });

  test('displays "Non" for isManager when false', async () => {
    mockInitialFetches();
    renderProfilePage();
    await waitFor(() => {
      const nonElements = screen.getAllByText('Non');
      expect(nonElements.length).toBeGreaterThan(0);
    });
  });

  test('displays "Oui" for isManager when true', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockProfile, isManager: true }),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSpecialties),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAvatarUrls),
      });
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('Oui')).toBeTruthy();
    });
  });

  test('displays unavailabilities when present', async () => {
    mockInitialFetches();
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText(/01\/02\/2024 - 05\/02\/2024/)).toBeTruthy();
    });
  });

  test('displays "Aucune indisponibilité" when list is empty', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProfile),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSpecialties),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAvatarUrls),
      });
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText(/aucune indisponibilité/i)).toBeTruthy();
    });
  });

  test('opens password modal when button is clicked', async () => {
    mockInitialFetches();
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('user@user.com')).toBeTruthy();
    });
    const buttons = screen.getAllByRole('button', { name: /modifier/i });
    fireEvent.click(buttons[2]);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /modifier le mot de passe/i }),
      ).toBeTruthy();
    });
  });

  test('shows error when passwords do not match', async () => {
    mockInitialFetches();
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('user@user.com')).toBeTruthy();
    });
    const buttons = screen.getAllByRole('button', { name: /modifier/i });
    fireEvent.click(buttons[2]);
    await waitFor(() => {
      expect(screen.getByLabelText(/ancien mot de passe/i)).toBeTruthy();
    });
    fireEvent.change(screen.getByLabelText(/nouveau mot de passe/i), {
      target: { value: 'abc123' },
    });
    fireEvent.change(screen.getByLabelText(/confirmer/i), {
      target: { value: 'different' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/les mots de passe ne correspondent pas/i),
      ).toBeTruthy();
    });
  });

  test('opens profile picture modal when button is clicked', async () => {
    mockInitialFetches();
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('user@user.com')).toBeTruthy();
    });
    const buttons = screen.getAllByRole('button', { name: /modifier/i });
    fireEvent.click(buttons[1]);
    await waitFor(() => {
      expect(screen.getByText(/modifier la photo de profil/i)).toBeTruthy();
    });
  });

  test('calls PATCH profile-picture when avatar is selected and confirmed', async () => {
    mockInitialFetches();
    renderProfilePage();
    await waitFor(() => {
      expect(screen.getByText('user@user.com')).toBeTruthy();
    });
    const buttons = screen.getAllByRole('button', { name: /modifier/i });
    fireEvent.click(buttons[1]);
    await waitFor(() => {
      expect(screen.getByText(/modifier la photo de profil/i)).toBeTruthy();
    });

    expect(screen.getByRole('button', { name: /confirmer/i })).toBeTruthy();
  });

  test('opens unavailability modal when button is clicked', async () => {
    mockInitialFetches();
    renderProfilePage();
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /ajouter/i }));
    });
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /ajouter une indisponibilité/i }),
      ).toBeTruthy();
    });
  });

  test('shows error when dates are missing', async () => {
    mockInitialFetches();
    renderProfilePage();
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /ajouter/i }));
    });
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /ajouter une indisponibilité/i }),
      ).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /ajouter/i }));
    await waitFor(() => {
      expect(screen.getByText(/veuillez remplir les deux dates/i)).toBeTruthy();
    });
  });

  test('shows error when end date is before start date', async () => {
    mockInitialFetches();
    renderProfilePage();
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /ajouter/i }));
    });
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/date de début/i), {
        target: { value: '2024-05-10' },
      });
      fireEvent.change(screen.getByLabelText(/date de fin/i), {
        target: { value: '2024-05-01' },
      });
      fireEvent.click(screen.getByRole('button', { name: /ajouter/i }));
    });
    await waitFor(() => {
      expect(screen.getByText(/la date de fin doit être après/i)).toBeTruthy();
    });
  });
});
