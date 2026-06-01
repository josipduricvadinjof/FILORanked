import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6B2737',
        tabBarInactiveTintColor: '#8B7355',
        tabBarStyle: {
          backgroundColor: '#F2EDE4',
          borderTopWidth: 0.5,
          borderTopColor: '#D9CFC4',
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 84 : 70,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Početna',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ranklist"
        options={{
          title: 'Rang lista',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏆" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="skeniraj"
        options={{
          title: 'Skeniraj',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📷" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  const { Text, View } = require('react-native');
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: focused ? '#6B273720' : 'transparent',
    }}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
    </View>
  );
}