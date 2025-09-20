import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import useAuthStore from '../../state/authStore';
import { colors, typography, spacing } from '../../utils/theme';
import { wp, hp, normalize } from '../../utils/responsive';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const [showButton, setShowButton] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.3))[0];
  const logoRotateAnim = useState(new Animated.Value(0))[0];
  const textSlideAnim = useState(new Animated.Value(50))[0];
  const taglineAnim = useState(new Animated.Value(0))[0];
  const buttonAnim = useState(new Animated.Value(0))[0];
  const progressAnim = useState(new Animated.Value(0))[0]; // New progress animation value that does NOT use native driver (width not supported natively)
  const particleAnims = useState(
    Array.from({ length: 20 }, () => ({
      x: new Animated.Value((Math.random() - 0.5) * width),
      y: new Animated.Value((Math.random() - 0.5) * height),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5),
    }))
  )[0];

  useEffect(() => {
    animateEntrance();
  }, []);

  // Get current time for greeting - same as home screen
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const animateEntrance = () => {
    // Particle animations
    const particleAnimations = particleAnims.map((particle, index) => 
      Animated.sequence([
        Animated.delay(index * 100),
        Animated.parallel([
          Animated.timing(particle.opacity, {
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Main animation sequence
    const mainAnimation = Animated.sequence([
      // Background and logo fade in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),

      // Text animations
      Animated.parallel([
        Animated.timing(textSlideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(taglineAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),

      // Hold for a moment
      Animated.delay(1500),

      // Progress bar animation
      Animated.timing(progressAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),

      // Show button
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    // Start animations
    Animated.parallel(particleAnimations).start();
    mainAnimation.start(() => {
      setShowButton(true);
    });
  };

  const handleLetsGo = () => {
    Animated.sequence([
      Animated.timing(buttonAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      if (isAuthenticated) {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    });
  };

  useEffect(() => {
    // Safety auto navigation after 5s if button not pressed
    const timeout = setTimeout(() => {
      if (!showButton) return; // wait until animations done
      if (isAuthenticated) {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    }, 7000);
    return () => clearTimeout(timeout);
  }, [showButton, isAuthenticated]);

  const logoRotation = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderParticle = (particle: any, index: number) => (
    <Animated.View
      key={index}
      style={[
        styles.particle,
        {
          transform: [
            { translateX: particle.x },
            { translateY: particle.y },
            { scale: particle.scale },
          ],
          opacity: particle.opacity,
        },
      ]}
    >
      <Ionicons 
        name={index % 3 === 0 ? "shield-checkmark" : index % 3 === 1 ? "location" : "medical"} 
        size={normalize(6)} 
        color={index % 3 === 0 ? colors.cardYellow : index % 3 === 1 ? colors.cardPurple : colors.cardPink} 
      />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Gradient Background */}
      <LinearGradient
        colors={[colors.background, colors.surface, colors.background]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated Particles */}
      <Animated.View style={[styles.particleContainer, { opacity: fadeAnim }]}>
        {particleAnims.map(renderParticle)}
      </Animated.View>

      {/* Main Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { scale: scaleAnim },
                { rotate: logoRotation },
              ],
            },
          ]}
        >
          <View style={[styles.logoGradient, { backgroundColor: colors.cardPink }]}>
            <Ionicons name="shield-checkmark" size={normalize(60)} color="#FFFFFF" />
          </View>
        </Animated.View>

        {/* App Name */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              transform: [{ translateY: textSlideAnim }],
            },
          ]}
        >
          <Text style={styles.appName}>Suraksha Yatra</Text>
          <Animated.View style={{ opacity: taglineAnim }}>
            <Text style={styles.tagline}>{getGreeting()}! Your Safe Travel Companion</Text>
            <Text style={styles.subtitle}>Powered by AI & Real-time Monitoring</Text>
          </Animated.View>
        </Animated.View>

        {/* Loading Progress */}
        <Animated.View style={[styles.loadingContainer, { opacity: taglineAnim }]}>
          <View style={styles.loadingBar}>
            <Animated.View
              style={[
                styles.loadingProgress,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, wp(60)],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Initializing Security Features...</Text>
        </Animated.View>

        {/* Let's Go Button */}
        {showButton && (
          <Animated.View 
            style={[
              styles.buttonContainer, 
              { 
                opacity: buttonAnim,
                transform: [{ scale: buttonAnim }]
              }
            ]}
          >
            <TouchableOpacity style={styles.letsGoButton} onPress={handleLetsGo}>
              <View style={[styles.buttonGradient, { backgroundColor: colors.cardYellow }]}>
                <Text style={styles.buttonText}>Let's Go!</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.background} style={styles.buttonIcon} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>

      {/* Bottom Branding */}
      <Animated.View style={[styles.bottomContainer, { opacity: taglineAnim }]}>
        <Text style={styles.versionText}>v1.0.0</Text>
        <Text style={styles.brandText}>Smart India Hackathon 2025</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  particleContainer: {
    position: 'absolute',
    width: width,
    height: height,
    left: 0,
    top: 0,
  },
  particle: {
    position: 'absolute',
    left: width / 2,
    top: height / 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    marginBottom: hp(4),
  },
  logoGradient: {
    width: normalize(120),
    height: normalize(120),
    borderRadius: normalize(60),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.vibrantPink,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: hp(6),
  },
  appName: {
    fontSize: normalize(36),
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: hp(1),
    letterSpacing: 1,
  },
  tagline: {
    fontSize: normalize(18),
    fontWeight: '600',
    color: colors.cardYellow,
    textAlign: 'center',
    marginBottom: hp(1),
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: normalize(14),
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  loadingContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: hp(4),
  },
  loadingBar: {
    width: wp(60),
    height: normalize(4),
    backgroundColor: colors.surface,
    borderRadius: normalize(2),
    overflow: 'hidden',
    marginBottom: hp(2),
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: colors.cardPurple,
    borderRadius: normalize(2),
  },
  loadingText: {
    fontSize: normalize(12),
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
  },
  letsGoButton: {
    borderRadius: normalize(25),
    overflow: 'hidden',
    elevation: 8,
    shadowColor: colors.cardYellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(8),
    paddingVertical: hp(1.5),
    minWidth: wp(40),
  },
  buttonText: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: colors.background,
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: spacing.sm,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: hp(6),
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  versionText: {
    fontSize: normalize(12),
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: hp(0.5),
  },
  brandText: {
    fontSize: normalize(10),
    color: colors.textSecondary,
    fontWeight: '400',
    opacity: 0.8,
  },
});