import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useNavigate } from 'react-router-dom';
import MembersPage from '../membersList/MembersPage';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn() };
});

describe('MembersPage', () => {
  const initialMembers = [
    {
      id: 1,
      tag: 'Storm',
      speciality: 'exécuteur',
      profilePicture: 'url1',
      date: '2026-01-10',
      teamName: 'TEAM_IOTA',
      teamId: 2,
    },
  ];

  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(useNavigate).mockReturnValue(vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test('renders member cards after loading', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(initialMembers),
    });

    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByText('Storm')).toBeTruthy();
    });

    expect(screen.getByText('exécuteur')).toBeTruthy();
    expect(screen.getByText('TEAM_IOTA')).toBeTruthy();
  });

  test('does not render member cards while members are being fetched', () => {
    fetchMock.mockImplementation(
      () => new Promise(() => undefined) as Promise<Response>,
    );

    render(<MembersPage />);

    expect(screen.queryByText('Storm')).toBeNull();
  });

  test('displays an error message when loading fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByText(/erreur : erreur 500/i)).toBeTruthy();
    });
  });

  test('renders the empty state when no members are returned', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<MembersPage />);

    await waitFor(() => {
      expect(screen.getByText(/aucun membre trouvé/i)).toBeTruthy();
    });
  });
});
