
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authAPI } from '@/services/api';
import { colors } from '@/styles/commonStyles';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const user = await authAPI.getCurrentUser();
    if (user) {
      router.replace('/(tabs)');
    }
  };

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !username)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await authAPI.login(email, password);
      } else {
        await authAPI.signup(username, email, password);
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication failed');
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>🍅</Text>
          <Text style={[styles.title, { color: theme.text }]}>Pomodoro</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Focus. Work. Achieve.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                isLogin && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setIsLogin(true)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isLogin ? theme.primary : theme.textSecondary },
                ]}
              >
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                !isLogin && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setIsLogin(false)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: !isLogin ? theme.primary : theme.textSecondary },
                ]}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {!isLogin && (
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="Username"
              placeholderTextColor={theme.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          )}

          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            placeholder="Email"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            placeholder="Password"
            placeholderTextColor={theme.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.note, { color: theme.textSecondary }]}>
            Note: Make sure your MERN backend is running at the configured API URL
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});
