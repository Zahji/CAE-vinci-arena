import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import FormMessages from './FormMessages';
import { RegisterContext } from '../../../../contexts/RegisterContext';
import { RegisterContextType } from '../../../../types';

describe('FormMessages', () => {
  const createContextValue = (
    errorMessage = '',
    successMessage = '',
  ): RegisterContextType => ({
    email: '',
    password: '',
    tag: '',
    specialty: '',
    specialties: [],
    avatarOptions: [],
    selectedAvatarId: '',
    isPasswordVisible: false,
    successMessage,
    errorMessage,
    setEmail: vi.fn(),
    setPassword: vi.fn(),
    setTag: vi.fn(),
    setSpecialty: vi.fn(),
    setSelectedAvatarId: vi.fn(),
    togglePasswordVisibility: vi.fn(),
    submitRegistration: vi.fn(),
  });

  test('renders nothing when there are no messages', () => {
    const contextValue = createContextValue();

    const { container } = render(
      <RegisterContext.Provider value={contextValue}>
        <FormMessages />
      </RegisterContext.Provider>,
    );

    const alerts = container.querySelectorAll('[role="alert"]');
    expect(alerts).toHaveLength(0);
  });

  test('renders error alert when errorMessage is present', () => {
    const contextValue = createContextValue('Une erreur est survenue', '');

    render(
      <RegisterContext.Provider value={contextValue}>
        <FormMessages />
      </RegisterContext.Provider>,
    );

    expect(screen.getByText('Une erreur est survenue')).toBeTruthy();
  });

  test('renders success alert when successMessage is present', () => {
    const contextValue = createContextValue('', 'Inscription réussie!');

    render(
      <RegisterContext.Provider value={contextValue}>
        <FormMessages />
      </RegisterContext.Provider>,
    );

    expect(screen.getByText('Inscription réussie!')).toBeTruthy();
  });

  test('displays error message only', () => {
    const contextValue = createContextValue('Erreur!', '');

    render(
      <RegisterContext.Provider value={contextValue}>
        <FormMessages />
      </RegisterContext.Provider>,
    );

    expect(screen.getByText('Erreur!')).toBeTruthy();
    expect(screen.queryByText('Inscription réussie!')).toBeFalsy();
  });

  test('displays success message only', () => {
    const contextValue = createContextValue('', 'Succès!');

    render(
      <RegisterContext.Provider value={contextValue}>
        <FormMessages />
      </RegisterContext.Provider>,
    );

    expect(screen.getByText('Succès!')).toBeTruthy();
    expect(screen.queryByText('Erreur!')).toBeFalsy();
  });
});
