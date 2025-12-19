/* eslint-env jest */
import { MediaPicker } from '@/components/video/MediaPicker';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Alert } from 'react-native';

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('MediaPicker Component', () => {
  const mockOnMediaSelected = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the media picker button', () => {
      const { getByTestId } = render(
        <MediaPicker onMediaSelected={mockOnMediaSelected} />
      );
      
      expect(getByTestId('media-picker-button')).toBeTruthy();
    });

    it('should display correct text for video type', () => {
      const { getByText } = render(
        <MediaPicker onMediaSelected={mockOnMediaSelected} mediaType="video" />
      );
      
      expect(getByText('Sélectionner une vidéo')).toBeTruthy();
    });

    it('should display correct text for image type', () => {
      const { getByText } = render(
        <MediaPicker onMediaSelected={mockOnMediaSelected} mediaType="image" />
      );
      
      expect(getByText('Sélectionner une image')).toBeTruthy();
    });
  });

  describe('Permissions', () => {
    it('should request media library permissions when button is pressed', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ 
        granted: true,
        status: 'granted'
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: true });

      const { getByTestId } = render(
        <MediaPicker onMediaSelected={mockOnMediaSelected} />
      );
      
      await act(async () => {
        fireEvent.press(getByTestId('media-picker-button'));
      });
      
      await waitFor(() => {
        expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should show error message when permission is denied', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ 
        granted: false,
        status: 'denied'
      });

      const { getByTestId, findByText } = render(
        <MediaPicker onMediaSelected={mockOnMediaSelected} />
      );
      
      await act(async () => {
        fireEvent.press(getByTestId('media-picker-button'));
      });
      
      const errorText = await findByText(/Permission d'accès à la galerie refusée/i, {}, { timeout: 3000 });
      expect(errorText).toBeTruthy();
      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission requise',
        expect.stringContaining('accès')
      );
    });

    it('should clear permission denied message when permission is granted', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock)
        .mockResolvedValueOnce({ granted: false, status: 'denied' })
        .mockResolvedValueOnce({ granted: true, status: 'granted' });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: true });

      const { getByTestId, findByText, queryByText } = render(
        <MediaPicker onMediaSelected={mockOnMediaSelected} />
      );
      
      // First press - permission denied
      await act(async () => {
        fireEvent.press(getByTestId('media-picker-button'));
      });
      
      const errorText = await findByText(/Permission d'accès à la galerie refusée/i, {}, { timeout: 3000 });
      expect(errorText).toBeTruthy();
      
      // Second press - permission granted
      await act(async () => {
        fireEvent.press(getByTestId('media-picker-button'));
      });
      
      await waitFor(() => {
        expect(queryByText(/Permission d'accès à la galerie refusée/i)).toBeFalsy();
      }, { timeout: 3000 });
    });
  });

  describe('Media Selection', () => {
    it('should call onMediaSelected when a video is picked', async () => {
      const mockAsset = {
        uri: 'file:///video.mp4',
        type: 'video',
        duration: 10000,
        width: 1920,
        height: 1080,
        fileName: 'video.mp4',
      };

      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ 
        granted: true,
        status: 'granted'
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [mockAsset],
      });

      const { getByTestId } = render(
        <MediaPicker onMediaSelected={mockOnMediaSelected} />
      );
      
      await act(async () => {
        fireEvent.press(getByTestId('media-picker-button'));
      });
      
      await waitFor(() => {
        expect(mockOnMediaSelected).toHaveBeenCalledWith(
          expect.objectContaining({
            uri: mockAsset.uri,
            type: mockAsset.type,
            duration: mockAsset.duration,
          })
        );
      }, { timeout: 3000 });
    });

    it('should not call onMediaSelected when selection is canceled', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ 
        granted: true,
        status: 'granted'
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      const { getByTestId } = render(
        <MediaPicker onMediaSelected={mockOnMediaSelected} />
      );
      
      await act(async () => {
        fireEvent.press(getByTestId('media-picker-button'));
      });
      
      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      expect(mockOnMediaSelected).not.toHaveBeenCalled();
    });

    it('should reject video exceeding max duration', async () => {
      const mockAsset = {
        uri: 'file:///long-video.mp4',
        type: 'video',
        duration: 150000, // 150 seconds
        width: 1920,
        height: 1080,
      };

      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ 
        granted: true,
        status: 'granted'
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [mockAsset],
      });

      const { getByTestId } = render(
        <MediaPicker 
          onMediaSelected={mockOnMediaSelected} 
          maxDuration={120} 
        />
      );
      
      await act(async () => {
        fireEvent.press(getByTestId('media-picker-button'));
      });
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Vidéo trop longue',
          expect.stringContaining('120')
        );
      }, { timeout: 3000 });
      
      expect(mockOnMediaSelected).not.toHaveBeenCalled();
    });
  });

  describe('Media Type Configuration', () => {
    it('should configure picker for videos only', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ 
        granted: true,
        status: 'granted'
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      const { getByTestId } = render(
        <MediaPicker onMediaSelected={mockOnMediaSelected} mediaType="video" />
      );
      
      await act(async () => {
        fireEvent.press(getByTestId('media-picker-button'));
      });
      
      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          })
        );
      }, { timeout: 3000 });
    });

    it('should configure picker for images only', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ 
        granted: true,
        status: 'granted'
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      const { getByTestId } = render(
        <MediaPicker onMediaSelected={mockOnMediaSelected} mediaType="image" />
      );
      
      await act(async () => {
        fireEvent.press(getByTestId('media-picker-button'));
      });
      
      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          })
        );
      }, { timeout: 3000 });
    });

    it('should configure picker for both media types', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({ 
        granted: true,
        status: 'granted'
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      const { getByTestId } = render(
        <MediaPicker onMediaSelected={mockOnMediaSelected} mediaType="both" />
      );
      
      await act(async () => {
        fireEvent.press(getByTestId('media-picker-button'));
      });
      
      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
          })
        );
      }, { timeout: 3000 });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const error = new Error('Test error');
      
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockRejectedValue(error);

      const { getByTestId } = render(
        <MediaPicker onMediaSelected={mockOnMediaSelected} />
      );
      
      await act(async () => {
        fireEvent.press(getByTestId('media-picker-button'));
      });
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Erreur',
          'Impossible de sélectionner le média'
        );
      }, { timeout: 3000 });
    });
  });
});