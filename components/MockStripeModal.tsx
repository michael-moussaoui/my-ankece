import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface MockStripeModalProps {
  visible: boolean;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MockStripeModal: React.FC<MockStripeModalProps> = ({ 
  visible, 
  amount, 
  currency, 
  onSuccess, 
  onCancel 
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const colorScheme = useColorScheme() ?? 'light';
  const { accentColor } = useAppTheme();
  
  const formattedAmount = (amount / 100).toFixed(2);
  const currencySymbol = currency.toUpperCase() === 'EUR' ? '€' : '$';

  const handlePay = () => {
    if (cardNumber.length < 16) {
      Alert.alert("Erreur", "Veuillez entrer un numéro de carte valide (ex: 4242...)");
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      
      // Complete after success animation
      setTimeout(() => {
        onSuccess();
        setIsSuccess(false);
        setCardNumber('');
        setExpiry('');
        setCvc('');
      }, 1500);
    }, 2000);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.backdrop} />
        <ThemedView style={styles.modalContent} darkColor="#1c1c1e" lightColor="#fff">
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors[colorScheme].text} />
            </TouchableOpacity>
            <ThemedText type="defaultSemiBold" style={styles.title}>Paiement sécurisé</ThemedText>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.amountContainer}>
            <ThemedText style={styles.amountLabel}>Total à payer</ThemedText>
            <ThemedText style={[styles.amountValue, { color: accentColor }]}>
              {formattedAmount} {currencySymbol}
            </ThemedText>
          </View>

          {isSuccess ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#4CD964" />
              <ThemedText type="subtitle" style={styles.successText}>Paiement réussi !</ThemedText>
            </View>
          ) : (
            <View style={styles.form}>
              <ThemedText style={styles.inputLabel}>Informations de carte (Test)</ThemedText>
              
              <View style={[styles.inputGroup, { borderColor: Colors[colorScheme].border }]}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="card-outline" size={20} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: Colors[colorScheme].text }]}
                    placeholder="Numéro de carte (4242 4242...)"
                    placeholderTextColor="#888"
                    keyboardType="number-pad"
                    maxLength={19}
                    value={cardNumber}
                    onChangeText={setCardNumber}
                  />
                </View>
                
                <View style={styles.row}>
                  <View style={[styles.inputWrapper, styles.halfInput, { borderTopWidth: 1, borderRightWidth: 1, borderColor: Colors[colorScheme].border }]}>
                    <TextInput
                      style={[styles.input, { color: Colors[colorScheme].text }]}
                      placeholder="MM/AA"
                      placeholderTextColor="#888"
                      keyboardType="number-pad"
                      maxLength={5}
                      value={expiry}
                      onChangeText={setExpiry}
                    />
                  </View>
                  <View style={[styles.inputWrapper, styles.halfInput, { borderTopWidth: 1, borderColor: Colors[colorScheme].border }]}>
                    <TextInput
                      style={[styles.input, { color: Colors[colorScheme].text }]}
                      placeholder="CVC"
                      placeholderTextColor="#888"
                      keyboardType="number-pad"
                      maxLength={3}
                      value={cvc}
                      onChangeText={setCvc}
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.payButton, { backgroundColor: accentColor }]}
                onPress={handlePay}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <ThemedText style={styles.payButtonText}>Payer {formattedAmount} {currencySymbol}</ThemedText>
                  </>
                )}
              </TouchableOpacity>
              
              <View style={styles.stripeInfo}>
                <Ionicons name="shield-checkmark" size={14} color="#888" />
                <ThemedText style={styles.stripeText}>Garanti par <ThemedText style={{ fontWeight: 'bold' }}>Stripe</ThemedText></ThemedText>
              </View>
            </View>
          )}
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 450,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  amountLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  form: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputGroup: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
  },
  halfInput: {
    flex: 1,
  },
  payButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  successText: {
    marginTop: 20,
    fontWeight: 'bold',
  },
  stripeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 4,
  },
  stripeText: {
    fontSize: 12,
    color: '#888',
  }
});
