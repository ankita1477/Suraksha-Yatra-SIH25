import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../utils/theme';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  style?: any;
}

export default function SafeAreaWrapper({
  children,
  backgroundColor = colors.background,
  statusBarStyle = 'light-content',
  edges = ['top', 'bottom'],
  style,
}: SafeAreaWrapperProps) {
  const insets = useSafeAreaInsets();

  const paddingStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <>
      <StatusBar 
        barStyle={statusBarStyle} 
        backgroundColor={backgroundColor} 
        translucent={false}
      />
      <View style={[
        styles.container, 
        { backgroundColor }, 
        paddingStyle, 
        style
      ]}>
        {children}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});