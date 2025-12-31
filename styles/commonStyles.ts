
import { StyleSheet } from 'react-native';

// Pomodoro Color Palette
export const colors = {
  // Light mode colors
  light: {
    background: '#F5F5F5',
    card: '#FFFFFF',
    text: '#333333',
    textSecondary: '#777777',
    primary: '#4CAF50',
    secondary: '#2196F3',
    accent: '#FF9800',
    highlight: '#FFEB3B',
    border: '#E0E0E0',
    error: '#F44336',
    success: '#4CAF50',
  },
  // Dark mode colors
  dark: {
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    primary: '#66BB6A',
    secondary: '#42A5F5',
    accent: '#FFA726',
    highlight: '#FFF176',
    border: '#333333',
    error: '#EF5350',
    success: '#66BB6A',
  },
};

export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.light.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: colors.light.secondary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  card: {
    backgroundColor: colors.light.card,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.light.text,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: colors.light.text,
    lineHeight: 24,
  },
  textSecondary: {
    fontSize: 14,
    color: colors.light.textSecondary,
    lineHeight: 20,
  },
  input: {
    backgroundColor: colors.light.card,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.light.text,
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
});
