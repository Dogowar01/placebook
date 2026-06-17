import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PlacebookTabBar from '@/components/PlacebookTabBar';

export default function TabsLayout() {
  return (
    <SafeAreaProvider>
      <Tabs
        tabBar={(props) => <PlacebookTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="timeline" />
        <Tabs.Screen name="food" />
        <Tabs.Screen name="passport" />
      </Tabs>
    </SafeAreaProvider>
  );
}
