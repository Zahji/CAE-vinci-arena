import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useNavigate } from 'react-router-dom';
import SelectionMemberList from './SelectionMemberList';
import { SelectionContext } from '../../../../contexts/SelectionContext';
import { UserContext } from '../../../../contexts/UserContext';
import type { SelectionContextType, UserContextType } from '../../../../types';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: vi.fn() };
});

/**
 * Builds a member object for tests.
 * @param {number} id - the member id
 * @param {string} tag - the member tag
 * @param {string} speciality - the member speciality
 * @return {object} the member
 */
const makeMember = (id: number, tag: string, speciality = 'Mage') => ({
  id,
  email: `${tag}@test.com`,
  tag,
  speciality,
  profilePicture: '',
  date: '',
});

/**
 * Builds a team object for tests.
 * @return {object} the team
 */
const makeTeam = () => ({
  id: 10,
  name: 'Team A',
  manager: makeMember(1, 'mgr'),
  secondManager: null,
  managersCount: 1,
  membersCount: 3,
});

/**
 * Builds a team membership for tests.
 * @param {number} id - the member id
 * @param {string} tag - the member tag
 * @return {object} the membership
 */
const makeMembership = (id: number, tag: string) => ({
  id,
  member: makeMember(id, tag),
  team: makeTeam(),
  status: 'ACCEPTED' as const,
});

/**
 * Builds a selection object for tests.
 * @param {number} memberId - the selected member id
 * @return {object} the selection
 */
const makeSelection = (memberId: number) => ({
  matchId: 1,
  teamId: 10,
  memberId,
  memberTag: `tag${memberId}`,
  memberSpeciality: 'Mage',
});

/**
 * Builds a selection context value for tests.
 * @param {Partial<SelectionContextType>} overrides - fields to override
 * @return {SelectionContextType} the context value
 */
const buildContext = (
  overrides: Partial<SelectionContextType> = {},
): SelectionContextType => ({
  match: null,
  memberships: [makeMembership(2, 'alice'), makeMembership(3, 'bob')],
  selections: [makeSelection(2)],
  statusSelection: 1,
  unavailableMemberIds: new Set(),
  loading: false,
  error: null,
  actionError: null,
  isSelected: (id) => id === 2,
  canModify: true,
  handleToggle: vi.fn(),
  clearActionError: vi.fn(),
  ...overrides,
});

const defaultUserContext: UserContextType = {
  authenticatedUser: {
    id: 99,
    email: 'test@test.com',
    tag: 'test',
    token: 'tok',
    teamId: undefined,
  },
  setAuthenticatedUser: vi.fn(),
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  clearUser: vi.fn(),
  refreshUser: vi.fn(),
  jwtData: vi.fn().mockReturnValue(null),
};

/**
 * Shows the component inside both contexts.
 * @param {SelectionContextType} ctx - the selection context
 * @param {UserContextType} userCtx - the user context
 * @return {void}
 */
const renderWith = (ctx: SelectionContextType, userCtx = defaultUserContext) =>
  render(
    <UserContext.Provider value={userCtx}>
      <SelectionContext.Provider value={ctx}>
        <SelectionMemberList />
      </SelectionContext.Provider>
    </UserContext.Provider>,
  );

describe('SelectionMemberList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(vi.fn());
  });

  test('renders member rows with tags and specialities', () => {
    renderWith(buildContext());

    expect(screen.getByText('alice')).toBeTruthy();
    expect(screen.getByText('bob')).toBeTruthy();
  });

  test('shows selected count', () => {
    renderWith(buildContext());

    expect(screen.getByText(/membres sélectionnés.*1\/4/i)).toBeTruthy();
  });

  test('shows Retirer for selected member and Ajouter for non-selected', () => {
    renderWith(buildContext());

    expect(screen.getByRole('button', { name: /retirer/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /ajouter/i })).toBeTruthy();
  });

  test('togglePending adds member to pending set when Ajouter is clicked', async () => {
    const user = userEvent.setup();
    renderWith(buildContext());

    await user.click(screen.getByRole('button', { name: /ajouter/i }));

    expect(screen.getByText(/membres sélectionnés.*2\/4/i)).toBeTruthy();
  });

  test('togglePending removes member from pending set when Retirer is clicked', async () => {
    const user = userEvent.setup();
    renderWith(buildContext());

    await user.click(screen.getByRole('button', { name: /retirer/i }));

    expect(screen.getByText(/membres sélectionnés.*0\/4/i)).toBeTruthy();
  });

  test('Ajouter button is disabled when 4 effective members already selected', () => {
    const memberships = [1, 2, 3, 4, 5].map((id) =>
      makeMembership(id, `m${id}`),
    );
    const selections = [1, 2, 3, 4].map(makeSelection);
    const ctx = buildContext({
      memberships,
      selections,
      isSelected: (id) => [1, 2, 3, 4].includes(id),
    });

    renderWith(ctx);

    const addButton = screen.getByRole('button', { name: /ajouter/i });
    expect(addButton).toBeTruthy();
    expect(addButton.hasAttribute('disabled')).toBe(true);
  });

  test('handleConfirm shows error when no effective member selected', async () => {
    const user = userEvent.setup();
    renderWith(
      buildContext({
        memberships: [makeMembership(2, 'alice')],
        selections: [makeSelection(2)],
        isSelected: (id) => id === 2,
      }),
    );

    await user.click(screen.getByRole('button', { name: /retirer/i }));
    await user.click(
      screen.getByRole('button', { name: /confirmer la sélection/i }),
    );

    expect(
      screen.getByText(/vous devez sélectionner au moins 1 membre/i),
    ).toBeTruthy();
  });

  test('handleConfirm calls handleToggle to sync diff and shows success', async () => {
    const handleToggle = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWith(
      buildContext({
        memberships: [makeMembership(2, 'alice'), makeMembership(3, 'bob')],
        selections: [makeSelection(2)],
        isSelected: (id) => id === 2,
        handleToggle,
      }),
    );

    await user.click(screen.getByRole('button', { name: /ajouter/i }));
    await user.click(
      screen.getByRole('button', { name: /confirmer la sélection/i }),
    );

    await waitFor(() => {
      expect(handleToggle).toHaveBeenCalledWith(3);
      expect(screen.getByText(/sélection confirmée/i)).toBeTruthy();
    });
  });

  test('handleConfirm calls handleToggle to remove deselected member', async () => {
    const handleToggle = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderWith(
      buildContext({
        memberships: [makeMembership(2, 'alice'), makeMembership(3, 'bob')],
        selections: [makeSelection(2), makeSelection(3)],
        isSelected: (id) => [2, 3].includes(id),
        handleToggle,
      }),
    );

    await user.click(screen.getAllByRole('button', { name: /retirer/i })[0]);
    await user.click(
      screen.getByRole('button', { name: /confirmer la sélection/i }),
    );

    await waitFor(() => {
      expect(handleToggle).toHaveBeenCalledWith(2);
    });
  });

  test('handleConfirm shows conflicting tag when handleToggle throws', async () => {
    const handleToggle = vi
      .fn()
      .mockRejectedValue(new Error('conflit horaire'));
    const user = userEvent.setup();

    renderWith(
      buildContext({
        memberships: [makeMembership(2, 'alice'), makeMembership(3, 'bob')],
        selections: [],
        isSelected: () => false,
        handleToggle,
      }),
    );

    await user.click(screen.getAllByRole('button', { name: /ajouter/i })[0]);
    await user.click(
      screen.getByRole('button', { name: /confirmer la sélection/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/alice.*est déjà sélectionné/i)).toBeTruthy();
    });
  });

  test('shows only selected non-unavailable members when canModify is false', () => {
    const ctx = buildContext({
      canModify: false,
      memberships: [makeMembership(2, 'alice'), makeMembership(3, 'bob')],
      selections: [makeSelection(2)],
      isSelected: (id) => id === 2,
    });

    renderWith(ctx);

    expect(screen.getByText('alice')).toBeTruthy();
    expect(screen.queryByText('bob')).toBeNull();
  });

  test('does not show confirm button when canModify is false', () => {
    renderWith(buildContext({ canModify: false }));

    expect(
      screen.queryByRole('button', { name: /confirmer la sélection/i }),
    ).toBeNull();
  });

  test('shows member as unavailable with reduced opacity row', () => {
    const ctx = buildContext({
      unavailableMemberIds: new Set([2]),
    });

    renderWith(ctx);

    expect(screen.getByText('alice')).toBeTruthy();
  });

  test('unavailable member is excluded from pendingEffectiveCount', () => {
    const ctx = buildContext({
      selections: [makeSelection(2)],
      unavailableMemberIds: new Set([2]),
      isSelected: (id) => id === 2,
    });

    renderWith(ctx);

    expect(screen.getByText(/membres sélectionnés.*0\/4/i)).toBeTruthy();
  });

  test('handleConfirm shows plural error when multiple conflicting members', async () => {
    const handleToggle = vi
      .fn()
      .mockRejectedValue(new Error('conflit horaire'));
    const user = userEvent.setup();

    const memberships = [makeMembership(2, 'alice'), makeMembership(3, 'bob')];

    renderWith(
      buildContext({
        memberships,
        selections: [],
        isSelected: () => false,
        handleToggle,
      }),
    );

    const addButtons = screen.getAllByRole('button', { name: /ajouter/i });
    await user.click(addButtons[0]);
    await user.click(addButtons[1]);
    await user.click(
      screen.getByRole('button', { name: /confirmer la sélection/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/sont déjà sélectionnés/i)).toBeTruthy();
    });
  });
});
