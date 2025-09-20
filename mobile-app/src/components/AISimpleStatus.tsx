import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import aiService from '../services/aiService';
import useAuthStore from '../state/authStore';
import { colors, typography, spacing, borderRadius } from '../utils/theme';
import { hp } from '../utils/responsive';

interface AISimpleStatusProps {
  currentLocation?: {
    lat: number;
    lng: number;
  };
  onViewDetails?: () => void;
}

export default function AISimpleStatus({ currentLocation, onViewDetails }: AISimpleStatusProps) {
  const { user } = useAuthStore();
  const [status, setStatus] = useState<'analyzing' | 'safe' | 'caution' | 'alert'>('safe');
  const [message, setMessage] = useState('AI is keeping you safe');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (currentLocation && user) {
      analyzeArea();
    }
  }, [currentLocation, user]);

  useEffect(() => {
    if (status === 'analyzing') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  const analyzeArea = async () => {
    if (!currentLocation || !user) return;

    setStatus('analyzing');
    setMessage('AI is analyzing your area...');

    try {
      const result = await aiService.getCurrentLocationRisk(currentLocation);
      
      if (result.threat_level === 'low') {
        setStatus('safe');
        setMessage('Area looks safe');
      } else if (result.threat_level === 'medium') {
        setStatus('caution');
        setMessage('Stay alert in this area');
      } else {
        setStatus('alert');
        setMessage('High risk area detected');
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      setStatus('safe');
      setMessage('AI protection active');
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case 'analyzing':
        return colors.cardPurple; // Soft blue from image
      case 'safe':
        return colors.cardGreen; // Green card color
      case 'caution':
        return colors.cardYellow; // Bright yellow from image
      case 'alert':
        return colors.error; // Keep red for alerts
      default:
        return colors.cardPurple;
    }
  };

  const getStatusIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'analyzing':
        return 'scan';
      case 'safe':
        return 'shield-checkmark';
      case 'caution':
        return 'warning';
      case 'alert':
        return 'alert-circle';
      default:
        return 'shield';
    }
  };

  if (!currentLocation) {
    return (
      <View style={styles.container}>
        <View style={[styles.solidCard, { backgroundColor: colors.surface }]}>
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <Ionicons name="location-outline" size={24} color={colors.text} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: colors.text }]}>AI Safety Guard</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enable location for protection</Text>
            </View>
            <View style={[styles.aiBadge, { backgroundColor: colors.cardPink }]}>
              <Ionicons name="hardware-chip" size={12} color="white" />
            </View>
          </View>
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor();

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onViewDetails} 
      activeOpacity={0.8}
    >
      <View style={[styles.solidCard, { backgroundColor: statusColor }]}>
        <View style={styles.content}>
          <Animated.View style={[styles.iconContainer, status === 'analyzing' && { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons 
              name={getStatusIcon()} 
              size={24} 
              color="white" 
            />
          </Animated.View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>AI Safety Guard</Text>
            <Text style={styles.subtitle}>{message}</Text>
          </View>
          <View style={[styles.aiBadge, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
            <Ionicons name="hardware-chip" size={12} color="white" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  solidCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: hp(8),
    borderRadius: borderRadius.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.bodyMedium,
    color: 'white',
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  aiBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});