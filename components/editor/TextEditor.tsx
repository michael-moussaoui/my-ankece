import { TextEditorProps, TextOverlay } from '@/types/editor';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const COLORS = ['#FFFFFF', '#000000', '#FF3B30', '#007AFF', '#34C759', '#00E5FF', '#FF9500'];

/**
 * Éditeur de texte pour créer/modifier des overlays
 */
export const TextEditor: React.FC<TextEditorProps & { visible: boolean }> = ({
  overlay,
  onSave,
  onCancel,
  currentTime,
  videoDuration,
  visible,
}) => {
  const [text, setText] = useState(overlay?.text || '');
  const [fontSize, setFontSize] = useState(overlay?.fontSize || 24);
  const [color, setColor] = useState(overlay?.color || '#FFFFFF');
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>(overlay?.fontWeight || 'bold');
  const [startTime, setStartTime] = useState(overlay?.startTime || currentTime);
  const [endTime, setEndTime] = useState(overlay?.endTime || Math.min(currentTime + 5000, videoDuration));
  const [xPosition, setXPosition] = useState(overlay?.x || 50);
  const [yPosition, setYPosition] = useState(overlay?.y || 50);

  const handleSave = () => {
    const newOverlay: TextOverlay = {
      id: overlay?.id || `text-${Date.now()}`,
      text,
      x: xPosition,
      y: yPosition,
      fontSize,
      color,
      fontWeight,
      startTime,
      endTime,
      animation: 'fadeIn',
    };

    onSave(newOverlay);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
      testID="text-editor-modal"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {overlay ? 'Modifier le texte' : 'Ajouter du texte'}
          </Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Input texte */}
          <View style={styles.section}>
            <Text style={styles.label}>Texte</Text>
            <TextInput
              testID="text-input"
              style={styles.textInput}
              value={text}
              onChangeText={setText}
              placeholder="Entrez votre texte..."
              multiline
              maxLength={100}
            />
            <Text style={styles.charCount}>{text.length}/100</Text>
          </View>

          {/* Prévisualisation */}
          <View style={styles.section}>
            <Text style={styles.label}>Prévisualisation</Text>
            <View style={styles.preview}>
              <Text
                style={[
                  styles.previewText,
                  {
                    fontSize,
                    color,
                    fontWeight,
                  },
                ]}
              >
                {text || 'Votre texte ici'}
              </Text>
            </View>
          </View>

          {/* Taille de police */}
          <View style={styles.section}>
            <Text style={styles.label}>Taille: {fontSize}px</Text>
            <Slider
              testID="font-size-slider"
              style={styles.slider}
              minimumValue={16}
              maximumValue={72}
              value={fontSize}
              onValueChange={setFontSize}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#ccc"
            />
          </View>

          {/* Couleur */}
          <View style={styles.section}>
            <Text style={styles.label}>Couleur</Text>
            <View style={styles.colorPicker}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  testID={`color-option-${c}`}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    color === c && styles.colorOptionSelected,
                  ]}
                  onPress={() => setColor(c)}
                >
                  {color === c && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={c === '#FFFFFF' ? '#000' : '#FFF'}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Style de police */}
          <View style={styles.section}>
            <Text style={styles.label}>Style</Text>
            <View style={styles.fontWeightOptions}>
              <TouchableOpacity
                testID="font-weight-normal"
                style={[
                  styles.fontWeightOption,
                  fontWeight === 'normal' && styles.fontWeightOptionSelected,
                ]}
                onPress={() => setFontWeight('normal')}
              >
                <Text style={styles.fontWeightText}>Normal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="font-weight-bold"
                style={[
                  styles.fontWeightOption,
                  fontWeight === 'bold' && styles.fontWeightOptionSelected,
                ]}
                onPress={() => setFontWeight('bold')}
              >
                <Text style={[styles.fontWeightText, { fontWeight: 'bold' }]}>
                  Gras
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Position */}
          <View style={styles.section}>
            <Text style={styles.label}>Position X: {xPosition.toFixed(0)}%</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={xPosition}
              onValueChange={setXPosition}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#ccc"
            />
            <Text style={styles.label}>Position Y: {yPosition.toFixed(0)}%</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={yPosition}
              onValueChange={setYPosition}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#ccc"
            />
          </View>
        </ScrollView>

        {/* Footer avec boutons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="save-text-button"
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={!text.trim()}
          >
            <Text style={styles.saveButtonText}>
              {overlay ? 'Modifier' : 'Ajouter'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  preview: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  previewText: {
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  colorPicker: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  colorOptionSelected: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  fontWeightOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  fontWeightOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  fontWeightOptionSelected: {
    backgroundColor: '#007AFF',
  },
  fontWeightText: {
    fontSize: 14,
    color: '#000',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});