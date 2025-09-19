import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../config/theme';

interface IconTileProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onPress?: () => void;
  accent?: 'blue' | 'green' | 'red' | 'amber' | 'indigo';
  style?: ViewStyle;
  titleStyle?: TextStyle;
}

const accentMap: Record<string, { bg: string; border: string; icon: string }> = {
  blue: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.35)', icon: '#60a5fa' },
  green: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', icon: '#34d399' },
  red: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)', icon: '#f87171' },
  amber: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', icon: '#fbbf24' },
  indigo: { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.35)', icon: '#818cf8' },
};

export const IconTile: React.FC<IconTileProps> = ({ title, subtitle, icon, onPress, accent='blue', style, titleStyle }) => {
  const a = accentMap[accent];
  return (
    <TouchableOpacity style={[styles.base, style]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.iconWrap, { backgroundColor: a.bg, borderColor: a.border }]}>
        {icon}
      </View>
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    width: '48%',
    backgroundColor: theme.palette.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.palette.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  title: { color: theme.palette.textPrimary, fontWeight: '700' },
  subtitle: { color: theme.palette.textSecondary, fontSize: 12, marginTop: 4 },
});

export default IconTile;
