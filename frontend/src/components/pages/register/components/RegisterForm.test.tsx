import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import RegisterForm from './RegisterForm';
import { RegisterContext } from '../../../../contexts/RegisterContext';
import { RegisterContextType } from '../../../../types';

describe('RegisterForm', () => {
  const createContextValue = (): RegisterContextType => ({
    email: 'test@example.com',
    password: 'TestPassword123',
    tag: 'testuser',
    specialty: 'Architecte',
    specialties: ['Architecte', 'Tacticien', 'Executeur'],
    avatarOptions: [],
    selectedAvatarId: '',
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

  test('renders all form fields', () => {
    const contextValue = createContextValue();

    render(
      <RegisterContext.Provider value={contextValue}>
        <RegisterForm />
      </RegisterContext.Provider>,
    );

    expect(screen.getByDisplayValue('test@example.com')).toBeTruthy();
    expect(screen.getByDisplayValue('testuser')).toBeTruthy();
    expect(screen.getByDisplayValue('TestPassword123')).toBeTruthy();
    expect(screen.getByDisplayValue('Architecte')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /créer le compte/i }),
    ).toBeTruthy();
  });

  test('displays context values in form fields', () => {
    const contextValue = createContextValue();

    render(
      <RegisterContext.Provider value={contextValue}>
        <RegisterForm />
      </RegisterContext.Provider>,
    );

    expect(
      (screen.getByDisplayValue('test@example.com') as HTMLInputElement).value,
    ).toBe('test@example.com');
    expect(
      (screen.getByDisplayValue('testuser') as HTMLInputElement).value,
    ).toBe('testuser');
    expect(
      (screen.getByDisplayValue('TestPassword123') as HTMLInputElement).value,
    ).toBe('TestPassword123');
  });

  test('calls setEmail when email input changes', () => {
    const contextValue = createContextValue();

    render(
      <RegisterContext.Provider value={contextValue}>
        <RegisterForm />
      </RegisterContext.Provider>,
    );

    const emailInput = screen.getByDisplayValue(
      'test@example.com',
    ) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });

    expect(contextValue.setEmail).toHaveBeenCalledWith('newemail@example.com');
  });

  test('calls setPassword when password input changes', () => {
    const contextValue = createContextValue();

    render(
      <RegisterContext.Provider value={contextValue}>
        <RegisterForm />
      </RegisterContext.Provider>,
    );

    const passwordInput = screen.getByDisplayValue(
      'TestPassword123',
    ) as HTMLInputElement;
    fireEvent.change(passwordInput, {
      target: { value: 'NewPassword456' },
    });

    expect(contextValue.setPassword).toHaveBeenCalledWith('NewPassword456');
  });

  test('calls setTag when tag input changes', () => {
    const contextValue = createContextValue();

    render(
      <RegisterContext.Provider value={contextValue}>
        <RegisterForm />
      </RegisterContext.Provider>,
    );

    const tagInput = screen.getByDisplayValue('testuser') as HTMLInputElement;
    fireEvent.change(tagInput, { target: { value: 'newtag' } });

    expect(contextValue.setTag).toHaveBeenCalledWith('newtag');
  });

  test('calls setSpecialty when specialty select changes', () => {
    const contextValue = createContextValue();

    render(
      <RegisterContext.Provider value={contextValue}>
        <RegisterForm />
      </RegisterContext.Provider>,
    );

    const specialtySelect = screen.getByDisplayValue('Architecte');
    fireEvent.change(specialtySelect, { target: { value: 'Tacticien' } });

    expect(contextValue.setSpecialty).toHaveBeenCalledWith('Tacticien');
  });

  test('calls togglePasswordVisibility when visibility button clicked', () => {
    const contextValue = createContextValue();

    render(
      <RegisterContext.Provider value={contextValue}>
        <RegisterForm />
      </RegisterContext.Provider>,
    );

    const visibilityButton = screen.getByRole('button', {
      name: /afficher le mot de passe/i,
    });

    fireEvent.click(visibilityButton);

    expect(contextValue.togglePasswordVisibility).toHaveBeenCalled();
  });

  test('calls submitRegistration on form submit', () => {
    const contextValue = createContextValue();

    render(
      <RegisterContext.Provider value={contextValue}>
        <RegisterForm />
      </RegisterContext.Provider>,
    );

    const submitButton = screen.getByRole('button', {
      name: /créer le compte/i,
    });
    fireEvent.click(submitButton);

    expect(contextValue.submitRegistration).toHaveBeenCalled();
  });

  test('displays password as text when isPasswordVisible is true', () => {
    const contextValue = createContextValue();
    contextValue.isPasswordVisible = true;

    render(
      <RegisterContext.Provider value={contextValue}>
        <RegisterForm />
      </RegisterContext.Provider>,
    );

    const passwordInput = screen.getByDisplayValue(
      'TestPassword123',
    ) as HTMLInputElement;
    expect(passwordInput.type).toBe('text');
  });

  test('displays password as hidden when isPasswordVisible is false', () => {
    const contextValue = createContextValue();
    contextValue.isPasswordVisible = false;

    render(
      <RegisterContext.Provider value={contextValue}>
        <RegisterForm />
      </RegisterContext.Provider>,
    );

    const passwordInput = screen.getByDisplayValue(
      'TestPassword123',
    ) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
  });

  test('displays all specialties in dropdown', () => {
    const contextValue = createContextValue();

    render(
      <RegisterContext.Provider value={contextValue}>
        <RegisterForm />
      </RegisterContext.Provider>,
    );

    const specialtySelect = screen.getByDisplayValue('Architecte');
    expect(specialtySelect).toBeTruthy();
  });
});
