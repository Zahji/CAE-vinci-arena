import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { UserProfile } from '../../../../types';
import AdministratorsTable from './AdministratorsTable';

describe('AdministratorsTable', () => {
  const administrators: UserProfile[] = [
    {
      id: 1,
      email: 'admin@admin.com',
      tag: 'admin',
      speciality: 'Mage',
      profilePicture: 'avatar-1',
      date: '2024-01-01',
    },
    {
      id: 2,
      email: 'other@admin.com',
      tag: 'other',
      speciality: 'Archer',
      profilePicture: 'avatar-2',
      date: '2024-01-02',
    },
  ];

  test('renders the empty state when there is no administrator', () => {
    render(
      <AdministratorsTable
        administrationList={[]}
        demoteError=""
        currentUserId={1}
        onDemoteUser={vi.fn()}
      />,
    );

    expect(screen.getByText(/aucun administrateur actuellement/i)).toBeTruthy();
  });

  test('renders the table, shows demotion errors, and both users have a demote button', async () => {
    const onDemoteUser = vi.fn();

    render(
      <AdministratorsTable
        administrationList={administrators}
        demoteError="Demotion impossible"
        currentUserId={1}
        onDemoteUser={onDemoteUser}
      />,
    );

    expect(screen.getByText(/demotion impossible/i)).toBeTruthy();
    expect(screen.getByText('admin@admin.com')).toBeTruthy();
    expect(screen.getByText('other@admin.com')).toBeTruthy();

    const buttons = screen.getAllByRole('button', { name: /rétrograder/i });
    expect(buttons).toHaveLength(2);

    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirmer/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));
    expect(onDemoteUser).toHaveBeenCalledWith(2);
  });

  test('shows the self-demotion message when demoting oneself', async () => {
    render(
      <AdministratorsTable
        administrationList={administrators}
        demoteError=""
        currentUserId={1}
        onDemoteUser={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole('button', { name: /rétrograder/i });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(
        screen.getByText(/vous n'aurez plus accès à cette page/i),
      ).toBeTruthy();
    });
  });

  test('shows the standard message when demoting another admin', async () => {
    render(
      <AdministratorsTable
        administrationList={administrators}
        demoteError=""
        currentUserId={1}
        onDemoteUser={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole('button', { name: /rétrograder/i });
    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(screen.getByText(/rétrograder cet administrateur/i)).toBeTruthy();
    });
  });

  test('closes the dialog without calling onDemoteUser when cancel is clicked', async () => {
    const onDemoteUser = vi.fn();

    render(
      <AdministratorsTable
        administrationList={administrators}
        demoteError=""
        currentUserId={1}
        onDemoteUser={onDemoteUser}
      />,
    );

    const buttons = screen.getAllByRole('button', { name: /rétrograder/i });
    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /annuler/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));

    expect(onDemoteUser).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /confirmer/i })).toBeNull();
    });
  });

  test('disables the demote button for the current user when they are the last admin', () => {
    const onDemoteUser = vi.fn();
    const singleAdmin = [administrators[0]];

    render(
      <AdministratorsTable
        administrationList={singleAdmin}
        demoteError=""
        currentUserId={1}
        onDemoteUser={onDemoteUser}
      />,
    );

    const button = screen.getByRole('button', { name: /rétrograder/i });
    expect(button).toBeTruthy();
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  test('enables the demote button for the current user when other admins exist', async () => {
    const onDemoteUser = vi.fn();

    render(
      <AdministratorsTable
        administrationList={administrators}
        demoteError=""
        currentUserId={1}
        onDemoteUser={onDemoteUser}
      />,
    );

    const buttons = screen.getAllByRole('button', { name: /rétrograder/i });
    const selfButton = buttons[0];
    expect(selfButton.hasAttribute('disabled')).toBe(false);

    fireEvent.click(selfButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirmer/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));
    expect(onDemoteUser).toHaveBeenCalledWith(1);
  });
});
