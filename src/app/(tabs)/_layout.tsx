import { Tabs } from 'expo-router';

import { HitDadTabBar } from '@/components/navigation/hitdad-tab-bar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <HitDadTabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Lịch đá' }} />
      <Tabs.Screen name="club" options={{ title: 'CLB' }} />
      <Tabs.Screen name="profile" options={{ title: 'Tôi' }} />
    </Tabs>
  );
}
