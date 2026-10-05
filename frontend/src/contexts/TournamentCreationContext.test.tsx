import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import {
  TournamentCreationContext,
  TournamentCreationContextProvider,
} from './TournamentCreationContext';
import { TournamentContext } from './TournamentContext';

describe('TournamentCreationContext', () => {
  test('re-exports TournamentContext as a transitional alias', () => {
    expect(TournamentCreationContext).toBe(TournamentContext);
  });

  test('provider renders its children unchanged', () => {
    render(
      <TournamentCreationContextProvider>
        <div>child content</div>
      </TournamentCreationContextProvider>,
    );

    expect(screen.getByText('child content')).toBeTruthy();
  });
});
