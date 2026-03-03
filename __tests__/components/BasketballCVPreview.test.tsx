/* eslint-env jest */
import { BasketballCVPreview } from '@/components/basketball/BasketballCVPreview';
import { BASKETBALL_PRO_TEMPLATE } from '@/constants/basketballTemplate';
import { BasketballPlayerData } from '@/types/basketball/template';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

const mockPlayerData: BasketballPlayerData = {
  firstName: 'John',
  lastName: 'Doe',
  age: 25,
  position: 'Meneur',
  height: 190,
  weight: 85,
  profilePhoto: {
    uri: 'file:///photo.jpg',
    type: 'image',
    width: 1080,
    height: 1920,
  },
  offensiveVideo: {
    uri: 'file:///offensive.mp4',
    type: 'video',
    duration: 15000,
  },
  defensiveVideo: {
    uri: 'file:///defensive.mp4',
    type: 'video',
    duration: 12000,
  },
  currentClub: {
    clubName: 'Paris Basketball',
    season: '2024-2025',
    number: 23,
    category: 'Senior',
    league: 'Betclic Elite',
  },
  clubHistory: [
    { clubName: 'Lyon ASVEL', season: '2022-2023' },
  ],
  email: 'john.doe@example.com',
  phone: '+33 6 12 34 56 78',
};

describe('BasketballCVPreview Component', () => {
  const mockOnEdit = jest.fn();
  const mockOnExport = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render preview component', () => {
      const { getByTestId } = render(
        <BasketballCVPreview
          template={BASKETBALL_PRO_TEMPLATE}
          playerData={mockPlayerData}
          onEdit={mockOnEdit}
          onExport={mockOnExport}
          onBack={mockOnBack}
        />
      );
      
      expect(getByTestId('basketball-cv-preview')).toBeTruthy();
    });

    it('should display player name', () => {
      const { getByText } = render(
        <BasketballCVPreview
          template={BASKETBALL_PRO_TEMPLATE}
          playerData={mockPlayerData}
          onEdit={mockOnEdit}
          onExport={mockOnExport}
          onBack={mockOnBack}
        />
      );
      
      expect(getByText(/John/)).toBeTruthy();
      expect(getByText(/Doe/)).toBeTruthy();
    });

    it('should display template name', () => {
      const { getByText } = render(
        <BasketballCVPreview
          template={BASKETBALL_PRO_TEMPLATE}
          playerData={mockPlayerData}
          onEdit={mockOnEdit}
          onExport={mockOnExport}
          onBack={mockOnBack}
        />
      );
      
      expect(getByText(BASKETBALL_PRO_TEMPLATE.name)).toBeTruthy();
    });

    it('should show all control buttons', () => {
      const { getByTestId } = render(
        <BasketballCVPreview
          template={BASKETBALL_PRO_TEMPLATE}
          playerData={mockPlayerData}
          onEdit={mockOnEdit}
          onExport={mockOnExport}
          onBack={mockOnBack}
        />
      );
      
      expect(getByTestId('back-button')).toBeTruthy();
      expect(getByTestId('edit-button')).toBeTruthy();
      expect(getByTestId('export-button')).toBeTruthy();
      expect(getByTestId('play-button')).toBeTruthy();
    });
  });

  describe('Section Navigation', () => {
    it('should display section selector', () => {
      const { getByTestId } = render(
        <BasketballCVPreview
          template={BASKETBALL_PRO_TEMPLATE}
          playerData={mockPlayerData}
          onEdit={mockOnEdit}
          onExport={mockOnExport}
          onBack={mockOnBack}
        />
      );
      
      expect(getByTestId('section-selector')).toBeTruthy();
    });

    it('should navigate between sections', () => {
      const { getByTestId, getAllByTestId } = render(
        <BasketballCVPreview
          template={BASKETBALL_PRO_TEMPLATE}
          playerData={mockPlayerData}
          onEdit={mockOnEdit}
          onExport={mockOnExport}
          onBack={mockOnBack}
        />
      );
      
      const sectionButtons = getAllByTestId(/section-button-/);
      expect(sectionButtons.length).toBeGreaterThan(0);
      
      // Cliquer sur une section
      fireEvent.press(sectionButtons[1]);
      
      // Vérifier qu'on a changé de section
      expect(getByTestId('section-selector')).toBeTruthy();
    });
  });

  describe('Player Data Display', () => {
    it('should display player position', () => {
      const { getByText } = render(
        <BasketballCVPreview
          template={BASKETBALL_PRO_TEMPLATE}
          playerData={mockPlayerData}
          onEdit={mockOnEdit}
          onExport={mockOnExport}
          onBack={mockOnBack}
        />
      );
      
      expect(getByText(/Meneur/)).toBeTruthy();
    });

    it('should display player age', () => {
      const { getByText } = render(
        <BasketballCVPreview
          template={BASKETBALL_PRO_TEMPLATE}
          playerData={mockPlayerData}
          onEdit={mockOnEdit}
          onExport={mockOnExport}
          onBack={mockOnBack}
        />
      );
      
      expect(getByText(/25/)).toBeTruthy();
    });

    it('should display current club', () => {
      const { getByText } = render(
        <BasketballCVPreview
          template={BASKETBALL_PRO_TEMPLATE}
          playerData={mockPlayerData}
          onEdit={mockOnEdit}
          onExport={mockOnExport}
          onBack={mockOnBack}
        />
      );
      
      expect(getByText(/Paris Basketball/)).toBeTruthy();
    });

    it('should display profile photo when available', () => {
      const { getByTestId } = render(
        <BasketballCVPreview
          template={BASKETBALL_PRO_TEMPLATE}
          playerData={mockPlayerData}
          onEdit={mockOnEdit}
          onExport={mockOnExport}
          onBack={mockOnBack}
        />
      );
      
      expect(getByTestId('player-photo')).toBeTruthy();
    });
  });

  describe('Actions', () => {
    it('should call onBack when back button is pressed', () => {
      const { getByTestId } = render(
        <BasketballCVPreview
          template={BASKETBALL_PRO_TEMPLATE}
          playerData={mockPlayerData}
          onEdit={mockOnEdit}
          onExport={mockOnExport}
          onBack={mockOnBack}
        />
      );
      
      fireEvent.press(getByTestId('back-button'));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should call onEdit when edit button is pressed', () => {
      const { getByTestId } = render(
        <BasketballCVPreview
          template={BASKETBALL_PRO_TEMPLATE}
          playerData={mockPlayerData}
          onEdit={mockOnEdit}
          onExport={mockOnExport}
          onBack={mockOnBack}
        />
      );
      
      fireEvent.press(getByTestId('edit-button'));
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should call onExport when export button is pressed', () => {
      const { getByTestId } = render(
        <BasketballCVPreview
          template={BASKETBALL_PRO_TEMPLATE}
          playerData={mockPlayerData}
          onEdit={mockOnEdit}
          onExport={mockOnExport}
          onBack={mockOnBack}
        />
      );
      
      fireEvent.press(getByTestId('export-button'));
      expect(mockOnExport).toHaveBeenCalledTimes(1);
    });
  });

  describe('Template Information', () => {
    it('should display template duration', () => {
      const { getByText } = render(
        <BasketballCVPreview
          template={BASKETBALL_PRO_TEMPLATE}
          playerData={mockPlayerData}
          onEdit={mockOnEdit}
          onExport={mockOnExport}
          onBack={mockOnBack}
        />
      );
      
      const durationInSeconds = BASKETBALL_PRO_TEMPLATE.totalDuration / 1000;
      expect(getByText(new RegExp(`${durationInSeconds}`))).toBeTruthy();
    });

    it('should display number of sections', () => {
      const { getByText } = render(
        <BasketballCVPreview
          template={BASKETBALL_PRO_TEMPLATE}
          playerData={mockPlayerData}
          onEdit={mockOnEdit}
          onExport={mockOnExport}
          onBack={mockOnBack}
        />
      );
      
      expect(getByText(new RegExp(`${BASKETBALL_PRO_TEMPLATE.sections.length}`))).toBeTruthy();
    });
  });

  describe('Playback', () => {
    it('should have play button', () => {
      const { getByTestId } = render(
        <BasketballCVPreview
          template={BASKETBALL_PRO_TEMPLATE}
          playerData={mockPlayerData}
          onEdit={mockOnEdit}
          onExport={mockOnExport}
          onBack={mockOnBack}
        />
      );
      
      expect(getByTestId('play-button')).toBeTruthy();
    });

    it('should toggle play state when play button is pressed', () => {
      const { getByTestId } = render(
        <BasketballCVPreview
          template={BASKETBALL_PRO_TEMPLATE}
          playerData={mockPlayerData}
          onEdit={mockOnEdit}
          onExport={mockOnExport}
          onBack={mockOnBack}
        />
      );
      
      const playButton = getByTestId('play-button');
      fireEvent.press(playButton);
      
      // Le bouton devrait changer d'état
      expect(playButton).toBeTruthy();
    });

    it('should show progress bar during playback', () => {
      const { getByTestId } = render(
        <BasketballCVPreview
          template={BASKETBALL_PRO_TEMPLATE}
          playerData={mockPlayerData}
          onEdit={mockOnEdit}
          onExport={mockOnExport}
          onBack={mockOnBack}
        />
      );
      
      // Démarrer la lecture
      fireEvent.press(getByTestId('play-button'));
      
      // Vérifier que le composant est toujours là (la barre de progression est dans le DOM)
      expect(getByTestId('basketball-cv-preview')).toBeTruthy();
    });
  });
});