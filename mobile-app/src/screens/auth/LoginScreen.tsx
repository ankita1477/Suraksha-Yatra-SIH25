import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import useAuthStore from '../../state/authStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { colors, typography, spacing, commonStyles, borderRadius, shadows } from '../../utils/theme';
import { wp, hp, getButtonHeight, getInputHeight, isSmallDevice } from '../../utils/responsive';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login, register, loading, mode, toggleMode } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    
    // Basic validation
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }
    
    if (mode === 'register' && password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      if (mode === 'login') {
        await login(email, password);
        navigation.replace('Home');
      } else {
        await register(email, password);
        // Registration successful, navigate to home directly
        navigation.replace('Home');
      }
    } catch (e: any) {
      console.error('Auth error:', e);
      setError(e.message || 'Authentication failed');
    }
  };

  return (
    <SafeAreaWrapper backgroundColor={colors.background} statusBarStyle="light-content">
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Suraksha Yatra</Text>
              <Text style={styles.subtitle}>
                {mode === 'login' ? 'Welcome back! Enter your credentials to continue' : 'Create your account to get started'}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput 
                  placeholder="Email" 
                  placeholderTextColor={colors.textMuted}
                  style={styles.input} 
                  autoCapitalize='none' 
                  autoComplete="email"
                  keyboardType="email-address"
                  value={email} 
                  onChangeText={setEmail}
                  editable={!loading}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <TextInput 
                  placeholder="Password" 
                  placeholderTextColor={colors.textMuted}
                  style={styles.input} 
                  secureTextEntry 
                  autoComplete={mode === 'login' ? 'password' : 'new-password'}
                  value={password} 
                  onChangeText={setPassword}
                  editable={!loading}
                />
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={onSubmit} 
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={colors.text} size="small" />
                ) : (
                  <Text style={styles.buttonText}>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={toggleMode} 
                style={styles.toggleButton}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleText}>
                  {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
    minHeight: hp(100),
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.heading1,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  input: {
    ...commonStyles.glassInput,
    ...typography.body,
    height: getInputHeight(),
    fontSize: isSmallDevice() ? 16 : typography.body.fontSize, // Prevent zoom on iOS
    color: colors.text,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  errorContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
    shadowColor: 'rgba(220, 38, 38, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.errorLight,
    textAlign: 'center',
  },
  button: {
    ...commonStyles.button,
    backgroundColor: colors.primary,
    height: getButtonHeight(),
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.6,
  },
  buttonText: {
    ...typography.button,
    color: colors.text,
  },
  toggleButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: 'center',
  },
  toggleText: {
    ...typography.bodySmall,
    color: colors.primaryLight,
    textAlign: 'center',
  },
});
