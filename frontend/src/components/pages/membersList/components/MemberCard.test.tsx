import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import MemberCard from './MemberCard';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: vi.fn() };
});

describe('MemberCard', () => {
  const member = {
    id: 1,
    tag: 'Storm',
    speciality: 'exécuteur',
    profilePicture: 'url1',
    date: '2026-01-10',
    teamName: 'TEAM_IOTA',
    teamId: 2,
    isBanned: false,
  };

  const renderCard = (isCurrentUser = false) =>
    render(
      <MemoryRouter>
        <MemberCard member={member} isCurrentUser={isCurrentUser} />
      </MemoryRouter>,
    );

  test('renders the member tag', () => {
    renderCard();

    expect(screen.getByText('Storm')).toBeTruthy();
  });

  test('renders the member speciality', () => {
    renderCard();

    expect(screen.getByText('exécuteur')).toBeTruthy();
  });

  test('renders the team name when the member has a team', () => {
    renderCard();

    expect(screen.getByText('TEAM_IOTA')).toBeTruthy();
  });

  test('renders "Aucune team" when the member has no team', () => {
    render(
      <MemoryRouter>
        <MemberCard
          member={{ ...member, teamName: null, teamId: null }}
          isCurrentUser={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Aucune team')).toBeTruthy();
  });

  test('renders the formatted creation date', () => {
    renderCard();

    expect(screen.getByText(/10\/01\/2026/)).toBeTruthy();
  });

  test('applies blue background when isCurrentUser is true', () => {
    const { container } = renderCard(true);

    const card = container.firstChild as HTMLElement;
    expect(card).toBeTruthy();
  });

  test('navigates to the member details page when clicked', () => {
    const navigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigate);

    renderCard();

    fireEvent.click(screen.getByText('Storm'));

    expect(navigate).toHaveBeenCalledWith('/members/1');
  });

  test('applies grey background when member is banned', () => {
    render(
      <MemoryRouter>
        <MemberCard
          member={{ ...member, isBanned: true }}
          isCurrentUser={false}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Storm')).toBeTruthy();
  });

  test('applies grayscale filter on avatar when member is banned', () => {
    render(
      <MemoryRouter>
        <MemberCard
          member={{ ...member, isBanned: true }}
          isCurrentUser={false}
        />
      </MemoryRouter>,
    );
    const avatar = screen.getByRole('img', { name: /storm/i });
    expect(avatar).toBeTruthy();
  });

  test('navigates to /profile when the current user clicks on their card', () => {
    const navigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(navigate);

    renderCard(true);

    fireEvent.click(screen.getByText('Storm'));

    expect(navigate).toHaveBeenCalledWith('/profile');
  });
});
