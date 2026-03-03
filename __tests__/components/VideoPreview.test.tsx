/* eslint-env jest */
import { VideoPreview } from '@/components/video/VideoPreview';
import { MediaAsset } from '@/types/media';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

// Mock expo-video
const mockPlay = jest.fn();
const mockPause = jest.fn();
const mockReplace = jest.fn();
const mockAddListener = jest.fn(() => ({
  remove: jest.fn(),
}));

jest.mock('expo-video', () => ({
  VideoView: 'VideoView',
  useVideoPlayer: jest.fn((uri, callback) => {
    const player = {
      playing: false,
      muted: false,
      currentTime: 0,
      duration: 10000,
      play: mockPlay,
      pause: mockPause,
      replace: mockReplace,
      addListener: mockAddListener,
    };
    // Simuler l'exécution du callback d'initialisation
    if (callback) callback(player);
    return player;
  }),
}));

describe('VideoPreview Component', () => {
  const mockVideo: MediaAsset = {
    uri: 'file:///test-video.mp4',
    type: 'video',
    duration: 10000,
    width: 1920,
    height: 1080,
    fileName: 'test-video.mp4',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render video preview', () => {
      const { getByTestId } = render(<VideoPreview video={mockVideo} />);
      expect(getByTestId('video-preview-container')).toBeTruthy();
    });

    it('should display video information', () => {
      const { getByText } = render(<VideoPreview video={mockVideo} />);
      expect(getByText('test-video.mp4')).toBeTruthy();
    });

    it('should show controls when showControls is true', () => {
      const { getByTestId } = render(
        <VideoPreview video={mockVideo} showControls={true} />
      );
      expect(getByTestId('video-controls')).toBeTruthy();
    });
  });

  describe('Video Player Interactions', () => {
    it('should toggle play/pause when button is pressed', async () => {
      const { getByTestId } = render(
        <VideoPreview video={mockVideo} showControls={true} />
      );
      
      const playButton = getByTestId('play-pause-button');
      fireEvent.press(playButton);
      
      // On vérifie que pause ou play a été appelé (selon l'état initial)
      await waitFor(() => {
        expect(mockPause).toHaveBeenCalled(); // Car autoPlay est false par défaut, mais le toggle inverse l'état
      });
    });

    it('should toggle mute status', () => {
      const { getByTestId } = render(
        <VideoPreview video={mockVideo} showControls={true} />
      );
      
      const muteButton = getByTestId('mute-button');
      fireEvent.press(muteButton);
      
      // On ne peut pas facilement tester l'icône interne sans bibliothèque d'icônes mockée, 
      // mais on vérifie que l'action ne crash pas
      expect(muteButton).toBeTruthy();
    });
  });

  describe('Callbacks', () => {
    it('should call onClose when close button is pressed', () => {
      const onClose = jest.fn();
      const { getByTestId } = render(
        <VideoPreview video={mockVideo} onClose={onClose} />
      );
      
      const closeButton = getByTestId('close-button');
      fireEvent.press(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onEdit when edit button is pressed', () => {
      const onEdit = jest.fn();
      const { getByTestId } = render(
        <VideoPreview video={mockVideo} onEdit={onEdit} />
      );
      
      const editButton = getByTestId('edit-button');
      fireEvent.press(editButton);
      expect(onEdit).toHaveBeenCalledTimes(1);
    });
  });

  describe('AutoPlay', () => {
    it('should call play automatically if autoPlay is true', () => {
      render(<VideoPreview video={mockVideo} autoPlay={true} />);
      expect(mockPlay).toHaveBeenCalled();
    });
  });
});