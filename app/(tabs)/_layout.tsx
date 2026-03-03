import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { chatService } from '@/services/chatService';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();
  const { accentColor } = useAppTheme();
  const [unreadChatCount, setUnreadChatCount] = React.useState(0);

  React.useEffect(() => {
    if (!user) {
      setUnreadChatCount(0);
      return;
    }

    const unsubscribe = chatService.subscribeToTotalUnreadCount(user.uid, (total: number) => {
      setUnreadChatCount(total);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: accentColor,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: t('tabs.feed'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="play.circle.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="basket-demo"
        options={{
          headerShown: false,
          title: t('tabs.cv'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="basketball.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          headerShown: false,
          title: 'Messages',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bubble.left.and.bubble.right.fill" color={color} />,
          tabBarBadge: unreadChatCount > 0 ? unreadChatCount : undefined,
        }}
      />
      <Tabs.Screen
        name="tracker"
        options={{
          headerShown: false,
          title: 'Tracker',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          href: null,
          headerShown: false,
          title: t('tabs.analysis'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="waveform.path.ecg" color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t('tabs.map'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="location.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="coach"
        options={{
          headerShown: false,
          title: t('tabs.coach'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
