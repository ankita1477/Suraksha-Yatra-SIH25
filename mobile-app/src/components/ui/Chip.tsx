import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../config/theme';

interface ChipProps {
  label: string;
  color?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Chip: React.FC<ChipProps> = ({ label, color = 'default', icon, style, textStyle }) => {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    default: { bg: 'rgba(30,41,59,0.55)', border: theme.palette.border, text: theme.palette.textSecondary },
    success: { bg: 'rgba(6,95,70,0.25)', border: 'rgba(16,185,129,0.35)', text: theme.palette.success },
    danger: { bg: 'rgba(127,29,29,0.25)', border: 'rgba(239,68,68,0.35)', text: theme.palette.danger },
    warning: { bg: 'rgba(120,53,15,0.25)', border: 'rgba(245,158,11,0.35)', text: theme.palette.warning },
    info: { bg: 'rgba(7,89,133,0.25)', border: 'rgba(14,165,233,0.35)', text: theme.palette.info },
  };

  const c = colorMap[color];

  return (
    <View style={[styles.base, { backgroundColor: c.bg, borderColor: c.border }, style]}>
      {icon}
      <Text style={[styles.label, { color: c.text }, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default Chip;
