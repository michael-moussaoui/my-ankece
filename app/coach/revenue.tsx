import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  FadeInDown,
  FadeInLeft,
  Layout,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── MOCK DATA ────────────────────────────────────────────────────────────────
const PERIODS = ['Mois', 'Trimestre', 'Année'] as const;

const MOCK_BAR_DATA = [
  { label: 'Oct', value: 1850 },
  { label: 'Nov', value: 2100 },
  { label: 'Déc', value: 1950 },
  { label: 'Jan', value: 2400 },
  { label: 'Fév', value: 2800 },
  { label: 'Mar', value: 3240 },
];

const MOCK_BREAKDOWN = [
  { type: 'Séances individuelles', amount: 1800, color: '#FF4500', icon: 'person-outline' },
  { type: 'Programmes', amount: 840, color: '#FFD700', icon: 'clipboard-outline' },
  { type: 'Sessions Live', amount: 360, color: '#00E5FF', icon: 'videocam-outline' },
  { type: 'Packages Élite', amount: 240, color: '#A855F7', icon: 'star-outline' },
];

const MOCK_TRANSACTIONS = [
  { id: 't1', player: 'Kevin Martin', type: 'Séance', amount: 60, date: 'Aujourd\'hui', status: 'paid' },
  { id: 't2', player: 'Lisa Torres', type: 'Programme', amount: 120, date: 'Hier', status: 'pending' },
  { id: 't3', player: 'Amine Diallo', type: 'Séance', amount: 60, date: '29 mars', status: 'paid' },
  { id: 't4', player: 'Sarah Benali', type: 'Package', amount: 240, date: '28 mars', status: 'paid' },
  { id: 't5', player: 'Hugo Leroy', type: 'Live', amount: 45, date: '25 mars', status: 'cancelled' },
];
// ─────────────────────────────────────────────────────────────────────────────

function RevenueBarChart({ data, color }: { data: typeof MOCK_BAR_DATA, color: string }) {
  const max = Math.max(...data.map(d => d.value));
  const chartHeight = 120;
  const chartWidth = SCREEN_WIDTH - 64;
  const barWidth = 36;
  const gap = (chartWidth - (barWidth * data.length)) / (data.length - 1);

  return (
    <View style={styles.chartContainer}>
      <Svg width={chartWidth} height={chartHeight + 20}>
        <Defs>
          <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset="1" stopColor={color} stopOpacity="0.6" />
          </LinearGradient>
        </Defs>
        {data.map((d, i) => {
          const barHeight = (d.value / max) * chartHeight;
          return (
            <React.Fragment key={i}>
              <Rect
                x={i * (barWidth + gap)}
                y={chartHeight - barHeight}
                width={barWidth}
                height={barHeight}
                rx={6}
                fill="url(#barGrad)"
              />
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={[styles.chartLabels, { width: chartWidth }]}>
        {data.map((d, i) => (
          <Text key={i} style={styles.chartLabelText}>{d.label}</Text>
        ))}
      </View>
    </View>
  );
}

export default function CoachRevenueScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { accentColor } = useAppTheme();
  const colorScheme = useColorScheme() ?? 'dark';
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('Mois');

  const isDark = colorScheme === 'dark';
  const bg = isDark ? '#0A0A0A' : '#F0F2F5';
  const cardBg = isDark ? '#141414' : '#FFFFFF';
  const cardBorder = isDark ? '#222' : '#E5E7EB';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#888' : '#666';

  const totalRevenue = MOCK_BREAKDOWN.reduce((acc, curr) => acc + curr.amount, 0);

  const handleExport = () => {
    Alert.alert(
      t('common.info', 'Information'),
      t('coach.revenue.exportDev', 'L\'exportation PDF sera disponible prochainement dans la version pro.'),
      [{ text: 'OK' }]
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: bg }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color={textPrimary} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>{t('coach.revenue.title', 'Revenus & Facturation')}</ThemedText>
          <TouchableOpacity style={[styles.filterBtn, { borderColor: cardBorder }]}>
            <Ionicons name="options-outline" size={20} color={textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Period Selector */}
          <View style={[styles.periodSelector, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {PERIODS.map(p => (
              <TouchableOpacity 
                key={p} 
                onPress={() => setPeriod(p)}
                style={[styles.periodBtn, period === p && { backgroundColor: accentColor }]}
              >
                <Text style={[styles.periodBtnText, { color: period === p ? '#FFF' : textSecondary }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Balance Card */}
          <Animated.View entering={FadeInDown.duration(500)} style={[styles.balanceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.balanceLabel, { color: textSecondary }]}>{t('coach.revenue.total', 'Recettes totales')}</Text>
            <Text style={[styles.balanceValue, { color: textPrimary }]}>{totalRevenue.toLocaleString('fr-FR')} €</Text>
            
            <RevenueBarChart data={MOCK_BAR_DATA} color={accentColor} />
            
            <TouchableOpacity style={[styles.exportBtn, { backgroundColor: accentColor + '15' }]} onPress={handleExport}>
              <Ionicons name="document-text-outline" size={18} color={accentColor} />
              <Text style={[styles.exportBtnText, { color: accentColor }]}>
                {t('coach.revenue.exportPdf', 'Exporter l\'historique en PDF')}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Breakdown Section */}
          <ThemedText style={styles.sectionTitle}>{t('coach.revenue.breakdown', 'Répartition des revenus')}</ThemedText>
          <View style={[styles.breakdownCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {MOCK_BREAKDOWN.map((item, i) => {
              const pct = (item.amount / totalRevenue) * 100;
              return (
                <View key={i} style={styles.breakdownItem}>
                  <View style={styles.breakdownHeader}>
                    <View style={styles.breakdownIconName}>
                      <Ionicons name={item.icon as any} size={16} color={item.color} />
                      <Text style={[styles.breakdownName, { color: textPrimary }]}>{item.type}</Text>
                    </View>
                    <Text style={[styles.breakdownAmount, { color: textPrimary }]}>{item.amount} €</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <Animated.View 
                      entering={FadeInLeft.delay(300 + i * 100)}
                      style={[styles.progressFill, { width: `${pct}%`, backgroundColor: item.color }]} 
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Recent Transactions */}
          <ThemedText style={styles.sectionTitle}>{t('coach.revenue.recentPayments', 'Paiements récents')}</ThemedText>
          <View style={[styles.transactionsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {MOCK_TRANSACTIONS.map((t, i) => (
              <TouchableOpacity key={t.id} style={[styles.transactionRow, i < MOCK_TRANSACTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: cardBorder }]}>
                <View style={[styles.transactionIcon, { backgroundColor: t.status === 'paid' ? '#22C55E15' : t.status === 'pending' ? '#FFD70015' : '#EF444415' }]}>
                  <Ionicons 
                    name={t.status === 'paid' ? 'checkmark-circle' : t.status === 'pending' ? 'time' : 'close-circle'} 
                    size={20} 
                    color={t.status === 'paid' ? '#22C55E' : t.status === 'pending' ? '#FFD700' : '#EF4444'} 
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={[styles.transactionPlayer, { color: textPrimary }]}>{t.player}</Text>
                  <Text style={[styles.transactionType, { color: textSecondary }]}>{t.type} • {t.date}</Text>
                </View>
                <View style={styles.transactionAmountSide}>
                  <Text style={[styles.transactionAmount, { color: textPrimary }]}>+{t.amount}€</Text>
                  <Text style={[styles.transactionStatus, { color: t.status === 'paid' ? '#22C55E' : t.status === 'pending' ? '#FFD700' : '#EF4444' }]}>
                    {t.status === 'paid' ? 'Payé' : t.status === 'pending' ? 'En attente' : 'Annulé'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        <TouchableOpacity style={[styles.fab, { backgroundColor: accentColor }]} onPress={() => Alert.alert('Lien de paiement', 'Génération d\'un lien Stripe/PayPal...')}>
          <Ionicons name="add" size={30} color="#FFF" />
        </TouchableOpacity>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  filterBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },

  periodSelector: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    marginTop: 8,
  },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  periodBtnText: { fontSize: 13, fontWeight: '700' },

  balanceCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 28,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  balanceLabel: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  balanceValue: { fontSize: 44, fontWeight: '900', letterSpacing: -1, marginBottom: 20 },
  
  chartContainer: { alignItems: 'center', marginBottom: 24 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  chartLabelText: { fontSize: 11, color: '#888', fontWeight: '500' },

  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  exportBtnText: { fontSize: 13, fontWeight: '700' },

  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, marginLeft: 4 },

  breakdownCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 28,
    gap: 16,
  },
  breakdownItem: { gap: 8 },
  breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownIconName: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownName: { fontSize: 14, fontWeight: '600' },
  breakdownAmount: { fontSize: 14, fontWeight: '800' },
  progressTrack: { height: 6, backgroundColor: '#9992', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  transactionsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  transactionIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  transactionInfo: { flex: 1, gap: 2 },
  transactionPlayer: { fontSize: 15, fontWeight: '700' },
  transactionType: { fontSize: 12 },
  transactionAmountSide: { alignItems: 'flex-end', gap: 2 },
  transactionAmount: { fontSize: 16, fontWeight: '800' },
  transactionStatus: { fontSize: 11, fontWeight: '700' },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
});
