import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Animated,
  Dimensions,
  Easing
} from 'react-native';
import useAuthStore from '../../state/authStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { colors, typography, spacing, borderRadius } from '../../utils/theme';
import { wp, hp, normalize } from '../../utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function LoginScreen({ navigation }: Props) {
  const { login, register, loading, mode, toggleMode } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  const buttonPressAnim = useRef(new Animated.Value(1)).current;
  const floatingParticles = useRef(
    Array.from({ length: 6 }, () => ({
      x: new Animated.Value(Math.random() * screenWidth),
      y: new Animated.Value(Math.random() * screenHeight),
      opacity: new Animated.Value(Math.random() * 0.3 + 0.1),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
    }))
  ).current;

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Start floating particles animation
    startFloatingParticles();
  }, []);

  const startFloatingParticles = () => {
    floatingParticles.forEach((particle, index) => {
      const animateParticle = () => {
        Animated.parallel([
          Animated.timing(particle.x, {
            toValue: Math.random() * screenWidth,
            duration: 8000 + Math.random() * 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: Math.random() * screenHeight,
            duration: 6000 + Math.random() * 6000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(particle.opacity, {
                toValue: 0.6,
                duration: 3000,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0.1,
                duration: 3000,
                easing: Easing.inOut(Easing.sin),
                useNativeDriver: true,
              }),
            ])
          ),
        ]).start(() => animateParticle());
      };
      // Stagger particle start times
      setTimeout(animateParticle, index * 1000);
    });
  };

  const handleInputFocus = () => {
    Animated.timing(inputFocusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleInputBlur = () => {
    Animated.timing(inputFocusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonPressAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonPressAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onSubmit();
    });
  };

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
        // Don't navigate manually - let the auth state change trigger navigation
      } else {
        await register(email, password);
        // Don't navigate manually - let the auth state change trigger navigation
      }
    } catch (e: any) {
      console.error('Auth error:', e);
      setError(e.message || 'Authentication failed');
    }
  };

  return (
    <SafeAreaWrapper backgroundColor={colors.background} statusBarStyle="light-content">
      <View style={styles.container}>
        {/* Floating Particles Background */}
        {floatingParticles.map((particle, index) => (
          <Animated.View
            key={index}
            style={[
              styles.floatingParticle,
              {
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                  { scale: particle.scale },
                ],
                opacity: particle.opacity,
              },
            ]}
          />
        ))}

        <KeyboardAvoidingView 
          style={styles.keyboardView} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View 
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideUpAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              {/* Logo and Title Section */}
              <View style={styles.headerSection}>
                <LinearGradient
                  colors={[colors.primary, colors.vibrantPurple]}
                  style={styles.logoContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="shield-checkmark" size={48} color={colors.background} />
                </LinearGradient>
                
                <Text style={styles.appTitle}>Suraksha Yatra</Text>
                <Text style={styles.appSubtitle}>
                  {mode === 'login' 
                    ? 'Welcome back! Your safety journey continues' 
                    : 'Begin your journey with ultimate safety'
                  }
                </Text>
              </View>

              {/* Form Card */}
              <View style={styles.formCard}>
                <LinearGradient
                  colors={['rgba(255, 149, 221, 0.1)', 'rgba(135, 190, 254, 0.1)']}
                  style={styles.formGradient}
                >
                  {/* Mode Toggle */}
                  <View style={styles.modeToggle}>
                    <TouchableOpacity
                      style={[
                        styles.modeButton,
                        mode === 'login' && styles.modeButtonActive
                      ]}
                      onPress={() => mode !== 'login' && toggleMode()}
                    >
                      <Text style={[
                        styles.modeButtonText,
                        mode === 'login' && styles.modeButtonTextActive
                      ]}>
                        Sign In
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modeButton,
                        mode === 'register' && styles.modeButtonActive
                      ]}
                      onPress={() => mode !== 'register' && toggleMode()}
                    >
                      <Text style={[
                        styles.modeButtonText,
                        mode === 'register' && styles.modeButtonTextActive
                      ]}>
                        Sign Up
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Email Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <Animated.View style={[
                      styles.inputContainer,
                      {
                        borderColor: inputFocusAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [colors.border, colors.primary]
                        })
                      }
                    ]}>
                      <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter your email"
                        placeholderTextColor={colors.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                      />
                    </Animated.View>
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <Animated.View style={[
                      styles.inputContainer,
                      {
                        borderColor: inputFocusAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [colors.border, colors.primary]
                        })
                      }
                    ]}>
                      <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter your password"
                        placeholderTextColor={colors.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                      />
                      <TouchableOpacity 
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Ionicons 
                          name={showPassword ? "eye-outline" : "eye-off-outline"} 
                          size={20} 
                          color={colors.textSecondary} 
                        />
                      </TouchableOpacity>
                    </Animated.View>
                  </View>

                  {/* Error Message */}
                  {error && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color={colors.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  {/* Submit Button */}
                  <Animated.View style={{ transform: [{ scale: buttonPressAnim }] }}>
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={handleButtonPress}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={[colors.primary, colors.vibrantPurple]}
                        style={styles.submitGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color={colors.background} />
                        ) : (
                          <Text style={styles.submitButtonText}>
                            {mode === 'login' ? 'Sign In' : 'Sign Up'}
                          </Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Additional Actions */}
                  <View style={styles.additionalActions}>
                    {mode === 'login' && (
                      <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </LinearGradient>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Your safety is our priority. Join thousands of users who trust Suraksha Yatra.
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  floatingParticle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: hp(8),
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appTitle: {
    fontSize: normalize(32),
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: normalize(16),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: normalize(24),
    paddingHorizontal: spacing.lg,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginBottom: hp(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 221, 0.2)',
  },
  formGradient: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: 4,
    marginBottom: spacing.xl,
  },
  modeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeButtonText: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeButtonTextActive: {
    color: colors.background,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: normalize(16),
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  eyeButton: {
    padding: spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontSize: normalize(14),
    color: colors.error,
    marginLeft: spacing.sm,
    flex: 1,
  },
  submitButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  submitGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: colors.background,
  },
  additionalActions: {
    alignItems: 'center',
  },
  forgotPassword: {
    paddingVertical: spacing.sm,
  },
  forgotPasswordText: {
    fontSize: normalize(14),
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  footerText: {
    fontSize: normalize(12),
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: normalize(18),
  },
});