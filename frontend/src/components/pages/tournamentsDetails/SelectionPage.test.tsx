import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SelectionPage from './SelectionPage';

const mockUseParams = vi.fn();
const mockSelectionContextProvider = vi.fn(
  ({ children }: { children: React.ReactNode }) => <>{children}</>,
);
const mockSelectionPageContent = vi.fn((props: { tournamentId: number }) => {
  void props;
  return <div>Selection page content</div>;
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockUseParams(),
  };
});

vi.mock('../../../contexts/SelectionContext', () => ({
  SelectionContextProvider: (props: {
    tournamentId: number;
    matchId: number;
    teamId: number;
    children: React.ReactNode;
  }) => mockSelectionContextProvider(props),
}));

vi.mock('./SelectionPageContent', () => ({
  default: (props: { tournamentId: number }) => mockSelectionPageContent(props),
}));

describe('SelectionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders warning when route params are invalid', () => {
    mockUseParams.mockReturnValue({
      tournamentId: 'abc',
      matchId: '10',
      teamId: '20',
    });

    render(<SelectionPage />);

    expect(screen.getByText('Paramètres invalides.')).toBeTruthy();
    expect(mockSelectionContextProvider).not.toHaveBeenCalled();
    expect(mockSelectionPageContent).not.toHaveBeenCalled();
  });

  test('renders provider and content with numeric params when route params are valid', () => {
    mockUseParams.mockReturnValue({
      tournamentId: '7',
      matchId: '11',
      teamId: '42',
    });

    render(<SelectionPage />);

    expect(mockSelectionContextProvider).toHaveBeenCalledOnce();
    expect(mockSelectionContextProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        tournamentId: 7,
        matchId: 11,
        teamId: 42,
      }),
    );
    expect(mockSelectionPageContent).toHaveBeenCalledWith({
      tournamentId: 7,
    });
    expect(screen.getByText('Selection page content')).toBeTruthy();
  });
});
