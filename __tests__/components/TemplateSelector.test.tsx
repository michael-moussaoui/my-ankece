/* eslint-env jest */
import { TemplateSelector } from '@/components/templates/TemplateSelector';
import { MOCK_TEMPLATES } from '@/constants/mockTemplates';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

describe('TemplateSelector Component', () => {
  const mockOnSelectTemplate = jest.fn();
  const mockOnPreview = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render template selector', () => {
      const { getByTestId } = render(
        <TemplateSelector onSelectTemplate={mockOnSelectTemplate} />
      );
      
      expect(getByTestId('template-selector')).toBeTruthy();
    });

    it('should display all templates by default', () => {
      const { getAllByTestId } = render(
        <TemplateSelector onSelectTemplate={mockOnSelectTemplate} />
      );
      
      const templateCards = getAllByTestId(/template-card-/);
      expect(templateCards.length).toBeGreaterThan(0);
    });

    it('should display sport filter', () => {
      const { getByTestId } = render(
        <TemplateSelector onSelectTemplate={mockOnSelectTemplate} />
      );
      
      expect(getByTestId('sport-filter')).toBeTruthy();
    });

    it('should display premium badge on premium templates', () => {
      const { getAllByTestId } = render(
        <TemplateSelector onSelectTemplate={mockOnSelectTemplate} />
      );
      
      const premiumBadges = getAllByTestId(/premium-badge-/);
      expect(premiumBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Filtering by Sport', () => {
    it('should filter templates by football', () => {
      const { getByText, getAllByTestId } = render(
        <TemplateSelector onSelectTemplate={mockOnSelectTemplate} />
      );
      
      fireEvent.press(getByText('Football'));
      
      const templateCards = getAllByTestId(/template-card-/);
      const footballTemplates = MOCK_TEMPLATES.filter(t => t.sport === 'football');
      expect(templateCards.length).toBe(footballTemplates.length);
    });

    it('should filter templates by basketball', () => {
      const { getByText, getAllByTestId } = render(
        <TemplateSelector onSelectTemplate={mockOnSelectTemplate} />
      );
      
      fireEvent.press(getByText('Basketball'));
      
      const templateCards = getAllByTestId(/template-card-/);
      const basketballTemplates = MOCK_TEMPLATES.filter(t => t.sport === 'basketball');
      expect(templateCards.length).toBe(basketballTemplates.length);
    });

    it('should show all templates when "Tous" is selected', () => {
      const { getByText, getAllByTestId } = render(
        <TemplateSelector onSelectTemplate={mockOnSelectTemplate} />
      );
      
      fireEvent.press(getByText('Football'));
      fireEvent.press(getByText('Tous'));
      
      const templateCards = getAllByTestId(/template-card-/);
      expect(templateCards.length).toBe(MOCK_TEMPLATES.length);
    });
  });

  describe('Premium Filter', () => {
    it('should show premium filter toggle', () => {
      const { getByTestId } = render(
        <TemplateSelector onSelectTemplate={mockOnSelectTemplate} />
      );
      
      expect(getByTestId('premium-filter-toggle')).toBeTruthy();
    });

    it('should filter only premium templates when enabled', () => {
      const { getAllByTestId } = render(
        <TemplateSelector 
          onSelectTemplate={mockOnSelectTemplate}
          showPremiumOnly={true}
        />
      );
      
      const templateCards = getAllByTestId(/template-card-/);
      const premiumTemplates = MOCK_TEMPLATES.filter(t => t.isPremium);
      expect(templateCards.length).toBe(premiumTemplates.length);
    });
  });

  describe('Template Selection', () => {
    it('should call onSelectTemplate when a template is selected', () => {
      const { getAllByTestId } = render(
        <TemplateSelector onSelectTemplate={mockOnSelectTemplate} />
      );
      
      const firstTemplateCard = getAllByTestId(/template-card-/)[0];
      fireEvent.press(firstTemplateCard);
      
      expect(mockOnSelectTemplate).toHaveBeenCalledTimes(1);
      expect(mockOnSelectTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
        })
      );
    });

    it('should highlight selected template', () => {
      const { getAllByTestId } = render(
        <TemplateSelector onSelectTemplate={mockOnSelectTemplate} />
      );
      
      const firstTemplateCard = getAllByTestId(/template-card-/)[0];
      fireEvent.press(firstTemplateCard);
      
      // Vérification de la prop isSelected ou de l'état visuel mocké
      expect(firstTemplateCard.props.accessibilityState?.selected).toBeTruthy();
    });
  });

  describe('Template Preview', () => {
    it('should call onPreview when preview button is pressed', () => {
      const { getAllByTestId } = render(
        <TemplateSelector 
          onSelectTemplate={mockOnSelectTemplate}
          onPreview={mockOnPreview}
        />
      );
      
      const firstPreviewButton = getAllByTestId(/preview-button-/)[0];
      
      // Correction : Ajout de l'objet d'événement mocké pour stopPropagation
      fireEvent.press(firstPreviewButton, {
        stopPropagation: jest.fn(),
      });
      
      expect(mockOnPreview).toHaveBeenCalledTimes(1);
    });

    it('should not show preview button when onPreview is not provided', () => {
      const { queryAllByTestId } = render(
        <TemplateSelector onSelectTemplate={mockOnSelectTemplate} />
      );
      
      const previewButtons = queryAllByTestId(/preview-button-/);
      expect(previewButtons.length).toBe(0);
    });
  });

  describe('Template Information Display', () => {
    it('should display template name', () => {
      const { getByText } = render(
        <TemplateSelector onSelectTemplate={mockOnSelectTemplate} />
      );
      
      expect(getByText(MOCK_TEMPLATES[0].name)).toBeTruthy();
    });

    it('should display template description', () => {
      const { getByText } = render(
        <TemplateSelector onSelectTemplate={mockOnSelectTemplate} />
      );
      
      expect(getByText(MOCK_TEMPLATES[0].description)).toBeTruthy();
    });

    it('should display template thumbnail', () => {
      const { getAllByTestId } = render(
        <TemplateSelector onSelectTemplate={mockOnSelectTemplate} />
      );
      
      const thumbnails = getAllByTestId(/template-thumbnail-/);
      expect(thumbnails.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no templates match filter', () => {
      const { getByText, getByTestId } = render(
        <TemplateSelector 
          onSelectTemplate={mockOnSelectTemplate}
          selectedSport="swimming" 
        />
      );
      
      // Vérifie si "swimming" n'existe pas dans tes MOCK_TEMPLATES
      expect(getByTestId('empty-state')).toBeTruthy();
      expect(getByText(/Aucun template disponible/i)).toBeTruthy();
    });
  });
});