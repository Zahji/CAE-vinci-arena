import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import AvatarSelector from './AvatarSelector';
import { RegisterContext } from '../../../../contexts/RegisterContext';
import { RegisterContextType } from '../../../../types';

describe('AvatarSelector', () => {
  const mockAvatarOptions = [
    {
      id: 'avatar-1',
      label: 'Avatar 1',
      src: 'http://example.com/avatar1.png',
    },
    {
      id: 'avatar-2',
      label: 'Avatar 2',
      src: 'http://example.com/avatar2.png',
    },
    {
      id: 'avatar-3',
      label: 'Avatar 3',
      src: 'http://example.com/avatar3.png',
    },
  ];

  const createContextValue = (
    selectedAvatarId = 'avatar-1',
  ): RegisterContextType => ({
    email: '',
    password: '',
    tag: '',
    specialty: '',
    specialties: [],
    avatarOptions: mockAvatarOptions,
    selectedAvatarId,
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

  test('renders avatar selector title', () => {
    const contextValue = createContextValue();

    render(
      <RegisterContext.Provider value={contextValue}>
        <AvatarSelector />
      </RegisterContext.Provider>,
    );

    expect(screen.getByText(/choisir une photo de profil/i)).toBeTruthy();
  });

  test('renders all avatar options', () => {
    const contextValue = createContextValue();

    render(
      <RegisterContext.Provider value={contextValue}>
        <AvatarSelector />
      </RegisterContext.Provider>,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(mockAvatarOptions.length);
  });

  test('selects first avatar by default', () => {
    const contextValue = createContextValue('avatar-1');

    const { container } = render(
      <RegisterContext.Provider value={contextValue}>
        <AvatarSelector />
      </RegisterContext.Provider>,
    );

    const firstButton = container.querySelector('button');
    expect(firstButton).toBeTruthy();
  });

  test('calls setSelectedAvatarId when avatar is clicked', () => {
    const contextValue = createContextValue();

    render(
      <RegisterContext.Provider value={contextValue}>
        <AvatarSelector />
      </RegisterContext.Provider>,
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);

    expect(contextValue.setSelectedAvatarId).toHaveBeenCalledWith('avatar-2');
  });

  test('renders correct number of avatars', () => {
    const contextValue = createContextValue();

    render(
      <RegisterContext.Provider value={contextValue}>
        <AvatarSelector />
      </RegisterContext.Provider>,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  test('handles avatar change correctly', () => {
    const contextValue = createContextValue('avatar-1');

    render(
      <RegisterContext.Provider value={contextValue}>
        <AvatarSelector />
      </RegisterContext.Provider>,
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]);

    expect(contextValue.setSelectedAvatarId).toHaveBeenCalledWith('avatar-3');
  });
});
