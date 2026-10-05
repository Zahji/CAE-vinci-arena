import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import AdministrationActions from './AdministrationActions';

describe('AdministrationActions', () => {
  test('renders the page heading and calls the promote action', () => {
    const onOpenPromoteModal = vi.fn();

    render(<AdministrationActions onOpenPromoteModal={onOpenPromoteModal} />);

    expect(
      screen.getByRole('heading', { level: 1, name: /administration/i }),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', {
        name: /nommer un nouvel administrateur/i,
      }),
    );

    expect(onOpenPromoteModal).toHaveBeenCalledOnce();
  });
});
