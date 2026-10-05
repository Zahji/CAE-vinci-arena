import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import TournamentActions from './TournamentActions';

describe('TournamentActions', () => {
  test('renders the page heading', () => {
    render(<TournamentActions />);

    expect(
      screen.getByRole('heading', { level: 1, name: /tournois/i }),
    ).toBeTruthy();
  });
});
