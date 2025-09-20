import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../utils/theme';
import { wp, hp, normalize } from '../../utils/responsive';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export default function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.3))[0];
  const logoRotateAnim = useState(new Animated.Value(0))[0];
  const textSlideAnim = useState(new Animated.Value(50))[0];
  const taglineAnim = useState(new Animated.Value(0))[0];
  const particleAnims = useState(
    Array.from({ length: 20 }, () => ({
      x: new Animated.Value((Math.random() - 0.5) * width),
      y: new Animated.Value((Math.random() - 0.5) * height),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5),
    }))
  )[0];

  useEffect(() => {
    // Start the animation sequence
    animateEntrance();
  }, []);

  const animateEntrance = () => {
    // Animate particles first
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
          Animated.timing(particle.x, {
            toValue: Math.random() * 300,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: Math.random() * 600,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Main animation sequence
    Animated.sequence([
      // Background fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      
      // Logo animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),

      // Text slide in
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

      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onAnimationComplete();
    });

    // Start particle animations
    Animated.parallel(particleAnimations).start();
  };

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
        color={index % 3 === 0 ? colors.vibrantYellow : index % 3 === 1 ? colors.vibrantPurple : colors.vibrantPink} 
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

      {/* Animated Background Particles */}
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
          <LinearGradient
            colors={[colors.vibrantPink, colors.vibrantPurple]}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="shield-checkmark" size={normalize(60)} color="#FFFFFF" />
          </LinearGradient>
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
            <Text style={styles.tagline}>Your Safe Travel Companion</Text>
            <Text style={styles.subtitle}>Powered by AI & Real-time Monitoring</Text>
          </Animated.View>
        </Animated.View>

        {/* Loading Indicator */}
        <Animated.View style={[styles.loadingContainer, { opacity: taglineAnim }]}>
          <View style={styles.loadingBar}>
            <Animated.View
              style={[
                styles.loadingProgress,
                {
                  width: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Initializing Security Features...</Text>
        </Animated.View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  logoContainer: {
    marginBottom: hp(4),
  },
  logoGradient: {
    width: normalize(120),
    height: normalize(120),
    borderRadius: normalize(60),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.vibrantPink,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
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
    color: colors.vibrantYellow,
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
    backgroundColor: colors.vibrantPurple,
    borderRadius: normalize(2),
  },
  loadingText: {
    fontSize: normalize(12),
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.5,
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