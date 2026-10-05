import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import RegisterFormContainer from './RegisterFormContainer';
import { RegisterContext } from '../../../../contexts/RegisterContext';
import { RegisterContextType } from '../../../../types';

describe('RegisterFormContainer', () => {
  const mockAvatarOptions = [
    {
      id: 'avatar-1',
      label: 'Avatar 1',
      src: 'http://example.com/avatar1.png',
    },
  ];

  const createContextValue = (): RegisterContextType => ({
    email: 'test@example.com',
    password: 'TestPassword123',
    tag: 'testuser',
    specialty: 'Architecte',
    specialties: ['Architecte', 'Tacticien'],
    avatarOptions: mockAvatarOptions,
    selectedAvatarId: 'avatar-1',
    isPasswordVisible: false,
    successMessage: '',
    errorMessage: '',
    setEmail: vi.fn(),
    setPassword: vi.fn(),
    setTag: vi.fn(),
    setSpecialty: vi.fn(),
    setSelectedAvatarId: vi.fn(),
    togglePasswordVisibility: vi.fn(),
    submitRegistration: vi.fn(),
  });

  const renderContainer = (contextValue = createContextValue()) =>
    render(
      <BrowserRouter>
        <RegisterContext.Provider value={contextValue}>
          <RegisterFormContainer />
        </RegisterContext.Provider>
      </BrowserRouter>,
    );

  test('renders page heading', () => {
    renderContainer();

    expect(
      screen.getByRole('heading', { level: 1, name: /s'inscrire/i }),
    ).toBeTruthy();
  });

  test('renders login link', () => {
    renderContainer();

    const loginLink = screen.getByRole('link', { name: /connectez-vous/i });
    expect(loginLink).toBeTruthy();
    expect((loginLink as HTMLAnchorElement).href).toContain('/login');
  });

  test('renders form with all child components', () => {
    renderContainer();

    expect(screen.getByDisplayValue('test@example.com')).toBeTruthy();
    expect(screen.getByDisplayValue('testuser')).toBeTruthy();
    expect(screen.getByDisplayValue('TestPassword123')).toBeTruthy();
    expect(screen.getByDisplayValue('Architecte')).toBeTruthy();
    expect(screen.getByText(/choisir une photo de profil/i)).toBeTruthy();
  });

  test('renders submit button', () => {
    renderContainer();

    expect(
      screen.getByRole('button', { name: /créer le compte/i }),
    ).toBeTruthy();
  });

  test('renders all form components', () => {
    const { container } = renderContainer();

    expect(container.querySelector('form')).toBeTruthy();
    expect(screen.getByDisplayValue('test@example.com')).toBeTruthy();
  });

  test('contains proper structure with avatars', () => {
    renderContainer();

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(1);
  });
});
