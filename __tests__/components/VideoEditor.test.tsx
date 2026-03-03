/* eslint-env jest */
import { VideoEditor } from '@/components/editor/VideoEditor';
import { MediaAsset } from '@/types/media';
import { SportTemplate } from '@/types/template';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

const mockVideo: MediaAsset = {
  uri: 'file:///test-video.mp4',
  type: 'video',
  duration: 30000, // 30 secondes
  width: 1920,
  height: 1080,
  fileName: 'test-video.mp4',
};

const mockTemplate: SportTemplate = {
  id: 'football-classic',
  name: 'Football Classic',
  sport: 'football',
  thumbnail: 'https://test.com/thumb.jpg',
  description: 'Template test',
  isPremium: false,
  textElements: [],
  statElements: [],
  duration: 15000,
};

describe('VideoEditor Component', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render video editor', () => {
      const { getByTestId } = render(
        <VideoEditor
          video={mockVideo}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      expect(getByTestId('video-editor')).toBeTruthy();
    });

    it('should display video preview', () => {
      const { getByTestId } = render(
        <VideoEditor
          video={mockVideo}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      expect(getByTestId('editor-video-preview')).toBeTruthy();
    });

    it('should display timeline', () => {
      const { getByTestId } = render(
        <VideoEditor
          video={mockVideo}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      expect(getByTestId('video-timeline')).toBeTruthy();
    });

    it('should display control buttons', () => {
      const { getByTestId } = render(
        <VideoEditor
          video={mockVideo}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      expect(getByTestId('add-text-button')).toBeTruthy();
      expect(getByTestId('save-button')).toBeTruthy();
      expect(getByTestId('cancel-button')).toBeTruthy();
    });
  });

  describe('Trim Controls', () => {
    it('should display trim controls', () => {
      const { getByTestId } = render(
        <VideoEditor
          video={mockVideo}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      expect(getByTestId('trim-controls')).toBeTruthy();
    });

    it('should allow trimming video', () => {
      const { getByTestId } = render(
        <VideoEditor
          video={mockVideo}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      const trimStartHandle = getByTestId('trim-start-handle');
      const trimEndHandle = getByTestId('trim-end-handle');
      
      expect(trimStartHandle).toBeTruthy();
      expect(trimEndHandle).toBeTruthy();
    });

    it('should display trim duration', () => {
      const { getByTestId } = render(
        <VideoEditor
          video={mockVideo}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      expect(getByTestId('trim-duration-display')).toBeTruthy();
    });
  });

  describe('Text Overlays', () => {
    it('should open text editor when add text button is pressed', async () => {
      const { getByTestId, findByTestId } = render(
        <VideoEditor
          video={mockVideo}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      const addTextButton = getByTestId('add-text-button');
      fireEvent.press(addTextButton);
      
      const textEditor = await findByTestId('text-editor-modal');
      expect(textEditor).toBeTruthy();
    });

    it('should add text overlay after saving in editor', async () => {
      const { getByTestId, findByTestId } = render(
        <VideoEditor
          video={mockVideo}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      // Ouvrir l'éditeur de texte
      fireEvent.press(getByTestId('add-text-button'));
      
      const textEditor = await findByTestId('text-editor-modal');
      expect(textEditor).toBeTruthy();
      
      // Ajouter du texte
      const textInput = getByTestId('text-input');
      fireEvent.changeText(textInput, 'Test Overlay');
      
      // Sauvegarder
      const saveTextButton = getByTestId('save-text-button');
      fireEvent.press(saveTextButton);
      
      // Vérifier que l'overlay est affiché
      await waitFor(() => {
        expect(getByTestId(/text-overlay-/)).toBeTruthy();
      });
    });

    it('should display text overlays on timeline', async () => {
      const { getByTestId, findByTestId } = render(
        <VideoEditor
          video={mockVideo}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      // Ajouter un texte
      fireEvent.press(getByTestId('add-text-button'));
      const textInput = getByTestId('text-input');
      fireEvent.changeText(textInput, 'Test');
      fireEvent.press(getByTestId('save-text-button'));
      
      // Vérifier sur la timeline
      const timelineOverlay = await findByTestId(/timeline-text-/);
      expect(timelineOverlay).toBeTruthy();
    });

    it('should allow editing existing text overlay', async () => {
      const { getByTestId, findByTestId } = render(
        <VideoEditor
          video={mockVideo}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      // Ajouter un texte
      fireEvent.press(getByTestId('add-text-button'));
      fireEvent.changeText(getByTestId('text-input'), 'Original Text');
      fireEvent.press(getByTestId('save-text-button'));
      
      // Cliquer sur l'overlay pour éditer
      const overlay = await findByTestId(/text-overlay-/);
      fireEvent.press(overlay);
      
      // Modifier le texte
      const textInput = getByTestId('text-input');
      fireEvent.changeText(textInput, 'Modified Text');
      fireEvent.press(getByTestId('save-text-button'));
      
      // Vérifier le changement
      await waitFor(() => {
        expect(getByTestId(/text-overlay-/)).toBeTruthy();
      });
    });

    it('should allow deleting text overlay', async () => {
      const { getByTestId, queryByTestId, findByTestId } = render(
        <VideoEditor
          video={mockVideo}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      // Ajouter un texte
      fireEvent.press(getByTestId('add-text-button'));
      fireEvent.changeText(getByTestId('text-input'), 'To Delete');
      fireEvent.press(getByTestId('save-text-button'));
      
      const overlay = await findByTestId(/text-overlay-/);
      expect(overlay).toBeTruthy();
      
      // Supprimer
      fireEvent.press(overlay);
      const deleteButton = getByTestId('delete-text-button');
      fireEvent.press(deleteButton);
      
      // Vérifier la suppression
      await waitFor(() => {
        expect(queryByTestId(/text-overlay-/)).toBeFalsy();
      });
    });
  });

  describe('Template Application', () => {
    it('should apply template when provided', () => {
      const { getByTestId } = render(
        <VideoEditor
          video={mockVideo}
          template={mockTemplate}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      expect(getByTestId('applied-template-indicator')).toBeTruthy();
    });

    it('should display template info', () => {
      const { getByText } = render(
        <VideoEditor
          video={mockVideo}
          template={mockTemplate}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      expect(getByText(mockTemplate.name)).toBeTruthy();
    });
  });

  describe('Save and Cancel', () => {
    it('should call onCancel when cancel button is pressed', () => {
      const { getByTestId } = render(
        <VideoEditor
          video={mockVideo}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      fireEvent.press(getByTestId('cancel-button'));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onSave with edited video when save button is pressed', () => {
      const { getByTestId } = render(
        <VideoEditor
          video={mockVideo}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      fireEvent.press(getByTestId('save-button'));
      
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          originalVideo: mockVideo,
          trim: expect.any(Object),
          textOverlays: expect.any(Array),
        })
      );
    });

    it('should include trim data when saving', () => {
      const { getByTestId } = render(
        <VideoEditor
          video={mockVideo}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      // Simuler un trim
      // (les modifications de trim seraient faites via des gestures)
      
      fireEvent.press(getByTestId('save-button'));
      
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          trim: {
            startTime: expect.any(Number),
            endTime: expect.any(Number),
          },
        })
      );
    });

    it('should include text overlays when saving', async () => {
      const { getByTestId } = render(
        <VideoEditor
          video={mockVideo}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      // Ajouter un texte
      fireEvent.press(getByTestId('add-text-button'));
      fireEvent.changeText(getByTestId('text-input'), 'Save Test');
      fireEvent.press(getByTestId('save-text-button'));
      
      await waitFor(() => {
        expect(getByTestId(/text-overlay-/)).toBeTruthy();
      });
      
      // Sauvegarder
      fireEvent.press(getByTestId('save-button'));
      
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          textOverlays: expect.arrayContaining([
            expect.objectContaining({
              text: 'Save Test',
            }),
          ]),
        })
      );
    });
  });

  describe('Playback Controls', () => {
    it('should have play/pause button', () => {
      const { getByTestId } = render(
        <VideoEditor
          video={mockVideo}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      expect(getByTestId('play-pause-button')).toBeTruthy();
    });

    it('should display current time', () => {
      const { getByTestId } = render(
        <VideoEditor
          video={mockVideo}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );
      
      expect(getByTestId('current-time-display')).toBeTruthy();
    });
  });
});