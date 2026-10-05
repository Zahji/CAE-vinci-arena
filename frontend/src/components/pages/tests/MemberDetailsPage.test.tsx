import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useNavigate, useParams } from 'react-router-dom';
import MemberDetailsPage from '../membersDetails/MemberDetailsPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn(), useParams: vi.fn() };
});

describe('MemberDetailsPage', () => {
  const member = {
    id: 1,
    tag: 'Storm',
    speciality: 'exécuteur',
    profilePicture: 'url1',
    date: '2026-01-10',
    teamName: 'TEAM_IOTA',
    teamId: 2,
  };

  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(useNavigate).mockReturnValue(vi.fn());
    vi.mocked(useParams).mockReturnValue({ memberId: '1' });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(member),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test('renders the member details after loading', async () => {
    render(<MemberDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText('Storm')).toBeTruthy();
    });

    expect(screen.getByText('exécuteur')).toBeTruthy();
    expect(screen.getByText('TEAM_IOTA')).toBeTruthy();
  });

  test('displays the loading state while the member is being fetched', () => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(
      () => new Promise(() => undefined) as Promise<Response>,
    );

    render(<MemberDetailsPage />);

    expect(screen.getByRole('progressbar')).toBeTruthy();
  });

  test('displays an error message when loading fails', async () => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

    render(<MemberDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText(/erreur 500/i)).toBeTruthy();
    });
  });

  test('displays an error when memberId is invalid', async () => {
    vi.mocked(useParams).mockReturnValue({ memberId: 'abc' });

    render(<MemberDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText(/identifiant de membre invalide/i)).toBeTruthy();
    });
  });
});
