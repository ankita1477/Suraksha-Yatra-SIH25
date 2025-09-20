import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { getApiBaseUrl, setApiBaseUrl, clearRuntimeOverrides, getWsBaseUrl, setWsBaseUrl } from '../config/env';
import { colors, spacing, borderRadius } from '../utils/theme';

interface Props { visible: boolean; onClose: () => void; }

export default function RuntimeApiSwitcher({ visible, onClose }: Props) {
  const [apiUrl, setApiUrl] = useState('');
  const [wsUrl, setWsUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (visible) {
      (async () => {
        setApiUrl(await getApiBaseUrl());
        setWsUrl(await getWsBaseUrl());
        setSaved(false);
      })();
    }
  }, [visible]);

  const handleSave = async () => {
    await setApiBaseUrl(apiUrl.trim());
    await setWsBaseUrl(wsUrl.trim());
    setSaved(true);
    setTimeout(onClose, 600);
  };

  const handleReset = async () => {
    await clearRuntimeOverrides();
    setSaved(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Runtime API Override</Text>
          <Text style={styles.label}>REST Base URL</Text>
          <TextInput value={apiUrl} onChangeText={setApiUrl} style={styles.input} placeholder="https://example.com/api" placeholderTextColor={colors.textMuted} />
          <Text style={styles.label}>WebSocket Base URL</Text>
          <TextInput value={wsUrl} onChangeText={setWsUrl} style={styles.input} placeholder="wss://example.com" placeholderTextColor={colors.textMuted} />
          {saved && <Text style={styles.saved}>Saved – restart sockets / refetch to apply</Text>}
          <View style={styles.row}>
            <TouchableOpacity style={[styles.button, styles.reset]} onPress={handleReset}><Text style={styles.buttonText}>Reset</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.save]} onPress={handleSave}><Text style={styles.buttonText}>Save</Text></TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.close}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.md },
  input: { marginTop: 4, backgroundColor: colors.background, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  button: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', marginHorizontal: spacing.xs },
  save: { backgroundColor: colors.vibrantPink },
  reset: { backgroundColor: colors.vibrantPurple },
  buttonText: { color: colors.background, fontWeight: '600' },
  saved: { color: colors.vibrantYellow, marginTop: spacing.sm, fontSize: 12 },
  close: { marginTop: spacing.md, alignItems: 'center' },
  closeText: { color: colors.textSecondary, fontSize: 12 },
});