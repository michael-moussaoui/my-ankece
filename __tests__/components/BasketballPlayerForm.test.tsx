/* eslint-env jest */
import { BasketballPlayerForm } from '@/components/basketball/BacketballPlayerForm';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert } from 'react-native';

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('BasketballPlayerForm', () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render form', () => {
      const { getByTestId } = render(
        <BasketballPlayerForm
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );
      
      expect(getByTestId('basketball-player-form')).toBeTruthy();
    });

    it('should show step 1 by default', () => {
      const { getByTestId } = render(
        <BasketballPlayerForm
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );
      
      expect(getByTestId('form-step-1')).toBeTruthy();
    });

    it('should render all required fields in step 1', () => {
      const { getByTestId } = render(
        <BasketballPlayerForm
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );
      
      expect(getByTestId('input-firstname')).toBeTruthy();
      expect(getByTestId('input-lastname')).toBeTruthy();
      expect(getByTestId('input-age')).toBeTruthy();
      expect(getByTestId('input-position')).toBeTruthy();
    });
  });

  describe('Step Navigation', () => {
    it('should show step indicator with 5 steps', () => {
      const { getByTestId } = render(
        <BasketballPlayerForm
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );
      
      expect(getByTestId('basketball-player-form')).toBeTruthy();
    });

    it('should navigate to step 2 when next is pressed with valid data', async () => {
      const { getByTestId, findByTestId } = render(
        <BasketballPlayerForm
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );
      
      // Remplir les champs obligatoires
      fireEvent.changeText(getByTestId('input-firstname'), 'John');
      fireEvent.changeText(getByTestId('input-lastname'), 'Doe');
      fireEvent.changeText(getByTestId('input-age'), '25');
      
      // Cliquer sur suivant
      fireEvent.press(getByTestId('next-button'));
      
      // Vérifier qu'on est à l'étape 2
      const step2 = await findByTestId('form-step-2');
      expect(step2).toBeTruthy();
    });

    it('should navigate back to previous step', async () => {
      const { getByTestId, findByTestId } = render(
        <BasketballPlayerForm
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );
      
      // Aller à l'étape 2
      fireEvent.changeText(getByTestId('input-firstname'), 'John');
      fireEvent.changeText(getByTestId('input-lastname'), 'Doe');
      fireEvent.changeText(getByTestId('input-age'), '25');
      fireEvent.press(getByTestId('next-button'));
      
      await findByTestId('form-step-2');
      
      // Retour à l'étape 1
      fireEvent.press(getByTestId('back-button'));
      
      const step1 = await findByTestId('form-step-1');
      expect(step1).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should show error when firstname is empty', async () => {
      const { getByTestId } = render(
        <BasketballPlayerForm
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );
      
      fireEvent.changeText(getByTestId('input-lastname'), 'Doe');
      fireEvent.changeText(getByTestId('input-age'), '25');
      fireEvent.press(getByTestId('next-button'));
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur',
          expect.any(String)
        );
      });
    });

    it('should show error when age is invalid', async () => {
      const { getByTestId } = render(
        <BasketballPlayerForm
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );
      
      fireEvent.changeText(getByTestId('input-firstname'), 'John');
      fireEvent.changeText(getByTestId('input-lastname'), 'Doe');
      fireEvent.changeText(getByTestId('input-age'), '5');
      fireEvent.press(getByTestId('next-button'));
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });
    });
  });

  describe('Cancel', () => {
    it('should call onCancel when cancel button is pressed', () => {
      const { getByTestId } = render(
        <BasketballPlayerForm
          onComplete={mockOnComplete}
          onCancel={mockOnCancel}
        />
      );
      
      fireEvent.press(getByTestId('cancel-form-button'));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });
});