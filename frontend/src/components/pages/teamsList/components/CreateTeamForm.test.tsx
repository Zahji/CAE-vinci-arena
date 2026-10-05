import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import CreateTeamForm from './CreateTeamForm';

describe('CreateTeamForm', () => {
  const defaultProps = {
    newTeamName: '',
    acceptManagerRole: false,
    creating: false,
    createError: null,
    onNameChange: vi.fn(),
    onAcceptManagerRoleChange: vi.fn(),
    onClearCreateError: vi.fn(),
    onSubmit: vi.fn(),
  };

  test('renders the text field and the checkbox', () => {
    render(<CreateTeamForm {...defaultProps} />);

    expect(screen.getByRole('textbox')).toBeTruthy();
    expect(screen.getByRole('checkbox', { hidden: true })).toBeTruthy();
  });

  test('disables the create button when the checkbox is not checked', () => {
    render(<CreateTeamForm {...defaultProps} acceptManagerRole={false} />);

    const button = screen.getByRole('button', {
      name: /créer une team/i,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  test('disables the create button when creating is true', () => {
    render(
      <CreateTeamForm
        {...defaultProps}
        acceptManagerRole={true}
        creating={true}
      />,
    );

    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  test('calls onNameChange and clears the error when typing in the field', () => {
    const onNameChange = vi.fn();
    const onClearCreateError = vi.fn();

    render(
      <CreateTeamForm
        {...defaultProps}
        onNameChange={onNameChange}
        onClearCreateError={onClearCreateError}
      />,
    );

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Ma Team' },
    });

    expect(onNameChange).toHaveBeenCalledWith('Ma Team');
    expect(onClearCreateError).toHaveBeenCalledOnce();
  });

  test('calls onAcceptManagerRoleChange when the checkbox is clicked', () => {
    const onAcceptManagerRoleChange = vi.fn();

    render(
      <CreateTeamForm
        {...defaultProps}
        onAcceptManagerRoleChange={onAcceptManagerRoleChange}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox'));
    expect(onAcceptManagerRoleChange).toHaveBeenCalledWith(true);
  });

  test('calls onSubmit when the create button is clicked', () => {
    const onSubmit = vi.fn();

    render(
      <CreateTeamForm
        {...defaultProps}
        acceptManagerRole={true}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /créer une team/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  test('displays the error message when createError is set', () => {
    render(
      <CreateTeamForm {...defaultProps} createError="Nom déjà existant" />,
    );

    expect(screen.getByText('Nom déjà existant')).toBeTruthy();
  });

  test('calls onClearCreateError when the error alert is closed', () => {
    const onClearCreateError = vi.fn();

    render(
      <CreateTeamForm
        {...defaultProps}
        createError="Nom déjà existant"
        onClearCreateError={onClearCreateError}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClearCreateError).toHaveBeenCalledOnce();
  });
});
