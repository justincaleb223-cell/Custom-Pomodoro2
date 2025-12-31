
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePomodoro } from '@/contexts/PomodoroContext';
import { authAPI } from '@/services/api';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function SettingsScreen() {
  const { settings, updateSettings } = usePomodoro();
  const [focusDuration, setFocusDuration] = useState(settings.focusDuration.toString());
  const [breakDuration, setBreakDuration] = useState(settings.breakDuration.toString());
  const [longBreakDuration, setLongBreakDuration] = useState(
    settings.longBreakDuration.toString()
  );
  const [sessionsUntilLongBreak, setSessionsUntilLongBreak] = useState(
    settings.sessionsUntilLongBreak.toString()
  );

  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  const handleSaveSettings = () => {
    const focus = parseInt(focusDuration);
    const shortBreak = parseInt(breakDuration);
    const longBreak = parseInt(longBreakDuration);
    const sessions = parseInt(sessionsUntilLongBreak);

    if (isNaN(focus) || isNaN(shortBreak) || isNaN(longBreak) || isNaN(sessions)) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    if (focus < 1 || shortBreak < 1 || longBreak < 1 || sessions < 1) {
      Alert.alert('Error', 'All values must be greater than 0');
      return;
    }

    updateSettings({
      focusDuration: focus,
      breakDuration: shortBreak,
      longBreakDuration: longBreak,
      sessionsUntilLongBreak: sessions,
    });

    Alert.alert('Success', 'Settings saved successfully');
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await authAPI.logout();
          router.replace('/auth');
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Timer Settings</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Focus Duration
            </Text>
            <Text style={[styles.settingHint, { color: theme.textSecondary }]}>
              Minutes per focus session
            </Text>
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            value={focusDuration}
            onChangeText={setFocusDuration}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Short Break
            </Text>
            <Text style={[styles.settingHint, { color: theme.textSecondary }]}>
              Minutes per short break
            </Text>
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            value={breakDuration}
            onChangeText={setBreakDuration}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Long Break
            </Text>
            <Text style={[styles.settingHint, { color: theme.textSecondary }]}>
              Minutes per long break
            </Text>
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            value={longBreakDuration}
            onChangeText={setLongBreakDuration}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Sessions Until Long Break
            </Text>
            <Text style={[styles.settingHint, { color: theme.textSecondary }]}>
              Number of focus sessions
            </Text>
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            value={sessionsUntilLongBreak}
            onChangeText={setSessionsUntilLongBreak}
            keyboardType="number-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={handleSaveSettings}
        >
          <IconSymbol
            ios_icon_name="checkmark.circle.fill"
            android_material_icon_name="check_circle"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Backend Configuration</Text>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          API Base URL: http://localhost:5000/api
        </Text>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          Update the API_BASE_URL in services/api.ts to connect to your MERN backend
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: theme.error }]}
        onPress={handleLogout}
      >
        <IconSymbol
          ios_icon_name="arrow.right.square"
          android_material_icon_name="logout"
          size={20}
          color="#FFFFFF"
        />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingHint: {
    fontSize: 13,
  },
  input: {
    width: 80,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
