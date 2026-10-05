import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SelectionPageContent from './SelectionPageContent';
import { SelectionContext } from '../../../contexts/SelectionContext';
import type { Match, SelectionContextType } from '../../../types';

const navigateMock = vi.fn();
const clearActionErrorMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('./components/SelectionMemberList', () => ({
  default: () => <div>Selection members list</div>,
}));

vi.mock('../../../utils/dateUtils', () => ({
  formatDateTime: vi.fn(() => 'formatted-date-time'),
}));

const baseMatch: Match = {
  matchId: 10,
  round: 1,
  startTime: '2026-05-10T14:30:00',
  state: 'PLANIFIED',
  team1Name: 'TEAM_ALPHA',
  team2Name: 'TEAM_BETA',
};

const createSelectionContextValue = (
  overrides: Partial<SelectionContextType> = {},
): SelectionContextType => ({
  match: baseMatch,
  memberships: [],
  selections: [],
  statusSelection: 0,
  unavailableMemberIds: new Set<number>(),
  loading: false,
  error: null,
  actionError: null,
  isSelected: vi.fn(() => false),
  canModify: false,
  handleToggle: vi.fn(),
  clearActionError: clearActionErrorMock,
  ...overrides,
});

const renderComponent = (
  contextValue: SelectionContextType = createSelectionContextValue(),
) =>
  render(
    <SelectionContext.Provider value={contextValue}>
      <SelectionPageContent tournamentId={7} />
    </SelectionContext.Provider>,
  );

describe('SelectionPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders loading spinner when loading is true', () => {
    renderComponent(createSelectionContextValue({ loading: true }));

    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.queryByText('Selection members list')).toBeNull();
  });

  test('renders error alert when context has an error', () => {
    renderComponent(createSelectionContextValue({ error: 'Fetch failed' }));

    expect(screen.getByText('Fetch failed')).toBeTruthy();
    expect(screen.queryByText('Selection members list')).toBeNull();
  });

  test('renders match details and member list in default state', () => {
    renderComponent();

    expect(
      screen.getByText('Sélection des membres pour un match'),
    ).toBeTruthy();
    expect(screen.getByText('TEAM_ALPHA')).toBeTruthy();
    expect(screen.getByText('TEAM_BETA')).toBeTruthy();
    expect(screen.getByText('formatted-date-time')).toBeTruthy();
    expect(screen.getByText('Selection members list')).toBeTruthy();
  });

  test('falls back to dash when team names are missing', () => {
    renderComponent(
      createSelectionContextValue({
        match: {
          ...baseMatch,
          team1Name: undefined,
          team2Name: undefined,
        },
      }),
    );

    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  test('shows action error and calls clearActionError when closing alert', () => {
    renderComponent(
      createSelectionContextValue({
        actionError: 'Action failed',
      }),
    );

    expect(screen.getByText('Action failed')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(clearActionErrorMock).toHaveBeenCalledOnce();
  });

  test('navigates back to tournament bracket on back button click', () => {
    renderComponent();

    fireEvent.click(
      screen.getByRole('button', { name: /retour au planning/i }),
    );

    expect(navigateMock).toHaveBeenCalledWith('/tournaments/7/bracket');
  });
});
