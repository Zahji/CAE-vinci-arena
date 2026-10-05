import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { useNavigate } from 'react-router-dom';
import { MembersContext } from '../../../contexts/MembersContext';
import { MembersContextType } from '../../../types';
import MembersPageContent from './MembersPageContent';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn() };
});

const members = [
  {
    id: 1,
    tag: 'Storm',
    speciality: 'exécuteur',
    profilePicture: 'url1',
    date: '2026-01-10',
    teamName: 'TEAM_IOTA',
    teamId: 2,
    isBanned: false,
  },
  {
    id: 2,
    tag: 'Blaze',
    speciality: 'stratège',
    profilePicture: 'url2',
    date: '2026-02-15',
    teamName: null,
    teamId: null,
    isBanned: false,
  },
];

const renderWithContext = (value: Partial<MembersContextType>) => {
  vi.mocked(useNavigate).mockReturnValue(vi.fn());

  const defaults = {
    loading: false,
    error: null,
    membersList: members,
    filteredMembers: members,
    search: '',
    currentUserId: undefined,
    setSearch: vi.fn(),
    refreshMembers: async () => {},
  };

  const contextValue: MembersContextType = {
    ...defaults,
    ...value,
    filteredMembers: value.filteredMembers ?? defaults.filteredMembers,
  };

  return render(
    <MembersContext.Provider value={contextValue}>
      <MembersPageContent />
    </MembersContext.Provider>,
  );
};

describe('MembersPageContent', () => {
  test('does not render member cards while loading', () => {
    renderWithContext({ loading: true, filteredMembers: [] });

    expect(screen.queryByText('Storm')).toBeNull();
    expect(screen.queryByText('Blaze')).toBeNull();
  });

  test('renders the error state', () => {
    renderWithContext({ loading: false, error: 'Erreur réseau' });

    expect(screen.getByText(/erreur réseau/i)).toBeTruthy();
  });

  test('renders all member cards', () => {
    renderWithContext({});

    expect(screen.getByText('Storm')).toBeTruthy();
    expect(screen.getByText('Blaze')).toBeTruthy();
  });

  test('renders the empty state when filteredMembers is empty', () => {
    renderWithContext({ filteredMembers: [] });

    expect(screen.getByText(/aucun membre trouvé/i)).toBeTruthy();
  });

  test('calls setSearch when the search input changes', () => {
    const setSearch = vi.fn();
    renderWithContext({ setSearch });

    const input = screen.getByLabelText(/rechercher par tag/i);
    fireEvent.change(input, { target: { value: 'storm' } });

    expect(setSearch).toHaveBeenCalledWith('storm');
  });

  test('reflects the current search value in the input', () => {
    renderWithContext({ search: 'blaze' });

    const input = screen.getByLabelText(
      /rechercher par tag/i,
    ) as HTMLInputElement;
    expect(input.value).toBe('blaze');
  });
});
