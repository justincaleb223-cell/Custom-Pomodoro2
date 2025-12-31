
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: 'index',
      route: '/(tabs)/',
      icon: 'timer',
      label: 'Timer',
    },
    {
      name: 'tasks',
      route: '/(tabs)/tasks',
      icon: 'list',
      label: 'Tasks',
    },
    {
      name: 'stats',
      route: '/(tabs)/stats',
      icon: 'bar-chart',
      label: 'Stats',
    },
    {
      name: 'settings',
      route: '/(tabs)/settings',
      icon: 'settings',
      label: 'Settings',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen key="index" name="index" />
        <Stack.Screen key="tasks" name="tasks" />
        <Stack.Screen key="stats" name="stats" />
        <Stack.Screen key="settings" name="settings" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
