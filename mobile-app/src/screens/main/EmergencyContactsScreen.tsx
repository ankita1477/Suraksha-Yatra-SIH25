import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
  Switch,
  ScrollView,
  ActivityIndicator,
  Animated,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  EmergencyContact,
  getEmergencyContacts,
  saveEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  sendLocationToContacts,
  sendEmergencyAlert,
  testContactNotification,
  validatePhoneNumber,
  validateEmail,
} from '../../services/contactsService';
import { 
  EmergencyService, 
  emergencyServicesService 
} from '../../services/emergencyServicesService';
import { getCurrentLocation } from '../../services/locationService';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';

/* ─── Neo-brutal light palette (matches HomeScreen / MapScreen) ─── */
const C = {
  bg: '#F8FAF5',
  card: '#FFFFFF',
  green: '#2D6A4F',
  greenLight: '#B7E4C7',
  greenPale: '#D8F3DC',
  greenDark: '#1B4332',
  accent: '#40916C',
  text: '#1B1B1B',
  textSecondary: '#6B7280',
  border: '#1B1B1B',
  red: '#DC2626',
  orange: '#F59E0B',
  purple: '#7C3AED',
  purplePale: '#DDD6FE',
  blue: '#2563EB',
  bluePale: '#BFDBFE',
};

interface EmergencyContactsScreenProps {
  navigation: { goBack: () => void };
}

export default function EmergencyContactsScreen({ navigation }: EmergencyContactsScreenProps) {
  const [activeTab, setActiveTab] = useState<'contacts' | 'services'>('contacts');
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', relationship: '', isPrimary: false, isActive: true,
  });

  const [emergencyServices, setEmergencyServices] = useState<EmergencyService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadContacts();
    loadEmergencyServices();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const list = await getEmergencyContacts();
      setContacts(list);
    } catch {
      Alert.alert('Error', 'Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  };

  const loadEmergencyServices = async () => {
    try {
      setServicesLoading(true);
      const list = await emergencyServicesService.getEmergencyServices();
      setEmergencyServices(list);
    } catch { /* silent */ } finally {
      setServicesLoading(false);
    }
  };

  const handleSaveContact = async () => {
    if (!formData.name.trim()) { Alert.alert('Error', 'Please enter a name'); return; }
    if (!formData.phone.trim()) { Alert.alert('Error', 'Please enter a phone number'); return; }
    if (!validatePhoneNumber(formData.phone)) { Alert.alert('Error', 'Please enter a valid phone number'); return; }
    if (formData.email && !validateEmail(formData.email)) { Alert.alert('Error', 'Please enter a valid email address'); return; }
    if (!formData.relationship.trim()) { Alert.alert('Error', 'Please specify the relationship'); return; }

    try {
      if (editingContact) {
        await updateEmergencyContact(editingContact.id, formData);
        Alert.alert('Success', 'Contact updated successfully');
      } else {
        await saveEmergencyContact(formData);
        Alert.alert('Success', 'Contact added successfully');
      }
      await loadContacts();
      resetForm();
      setModalVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to save contact');
    }
  };

  const handleDeleteContact = (contact: EmergencyContact) => {
    Alert.alert('Delete Contact', `Are you sure you want to delete ${contact.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteEmergencyContact(contact.id); await loadContacts(); Alert.alert('Success', 'Contact deleted'); }
          catch { Alert.alert('Error', 'Failed to delete contact'); }
        },
      },
    ]);
  };

  const handleTestContact = async (contact: EmergencyContact) => {
    try {
      const ok = await testContactNotification(contact);
      Alert.alert(ok ? 'Success' : 'Error', ok ? `Test message sent to ${contact.name}` : 'Failed to send test message');
    } catch { Alert.alert('Error', 'Failed to send test message'); }
  };

  const handleShareLocation = async () => {
    try {
      const loc = await getCurrentLocation();
      if (!loc) { Alert.alert('Error', 'Unable to get current location'); return; }
      const ok = await sendLocationToContacts({ latitude: loc.coords.latitude, longitude: loc.coords.longitude, timestamp: new Date().toISOString() });
      Alert.alert(ok ? 'Success' : 'Error', ok ? 'Location shared with emergency contacts' : 'Failed to share location');
    } catch { Alert.alert('Error', 'Failed to share location with contacts'); }
  };

  const handleEmergencyAlert = (alertType: 'panic' | 'sos') => {
    Alert.alert(`Send ${alertType.toUpperCase()} Alert`, `This will send an emergency ${alertType} alert to all active contacts. Continue?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send Alert', style: 'destructive',
        onPress: async () => {
          try {
            const ok = await sendEmergencyAlert(alertType);
            Alert.alert(ok ? 'Success' : 'Error', ok ? `${alertType.toUpperCase()} alert sent` : 'Failed to send emergency alert');
          } catch { Alert.alert('Error', 'Failed to send emergency alert'); }
        },
      },
    ]);
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', relationship: '', isPrimary: false, isActive: true });
    setEditingContact(null);
  };

  const openEditModal = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({ name: contact.name, phone: contact.phone, email: contact.email || '', relationship: contact.relationship, isPrimary: contact.isPrimary, isActive: contact.isActive });
    setModalVisible(true);
  };

  /* ─── Contact card ─── */
  const renderContact = ({ item }: { item: EmergencyContact }) => (
    <View style={S.contactCard}>
      <View style={S.contactTop}>
        {/* Avatar circle */}
        <View style={[S.avatar, { backgroundColor: item.isPrimary ? C.greenPale : C.purplePale }]}>  
          <Ionicons name="person" size={22} color={item.isPrimary ? C.green : C.purple} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={S.contactName}>{item.name}</Text>
          <Text style={S.contactRel}>{item.relationship}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          {item.isPrimary && (
            <View style={S.primaryBadge}>
              <Text style={S.primaryBadgeText}>PRIMARY</Text>
            </View>
          )}
          <View style={[S.statusBadge, { backgroundColor: item.isActive ? C.greenPale : '#E5E7EB' }]}>  
            <View style={[S.statusDot, { backgroundColor: item.isActive ? C.green : C.textSecondary }]} />
            <Text style={[S.statusBadgeText, { color: item.isActive ? C.green : C.textSecondary }]}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      {/* Phone & email */}
      <View style={S.contactDetails}>
        <View style={S.detailRow}>
          <Ionicons name="call-outline" size={14} color={C.accent} />
          <Text style={S.detailText}>{item.phone}</Text>
        </View>
        {item.email ? (
          <View style={S.detailRow}>
            <Ionicons name="mail-outline" size={14} color={C.accent} />
            <Text style={S.detailText}>{item.email}</Text>
          </View>
        ) : null}
      </View>

      {/* Actions row */}
      <View style={S.contactActions}>
        <TouchableOpacity style={[S.actionBtn, { backgroundColor: C.bluePale }]} onPress={() => handleTestContact(item)} activeOpacity={0.7}>
          <Ionicons name="send" size={14} color={C.blue} />
          <Text style={[S.actionBtnText, { color: C.blue }]}>Test</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[S.actionBtn, { backgroundColor: C.greenPale }]} onPress={() => openEditModal(item)} activeOpacity={0.7}>
          <Ionicons name="pencil" size={14} color={C.green} />
          <Text style={[S.actionBtnText, { color: C.green }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[S.actionBtn, { backgroundColor: '#FECACA' }]} onPress={() => handleDeleteContact(item)} activeOpacity={0.7}>
          <Ionicons name="trash" size={14} color={C.red} />
          <Text style={[S.actionBtnText, { color: C.red }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <SafeAreaWrapper backgroundColor={C.bg} statusBarStyle="dark-content">
        <View style={S.loadingWrap}>
          <View style={S.loadingCard}>
            <ActivityIndicator size="large" color={C.green} />
            <Text style={S.loadingText}>Loading contacts…</Text>
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor={C.bg} statusBarStyle="dark-content">
      <Animated.View style={[S.container, { opacity: fadeAnim }]}>

        {/* ─── Header ─── */}
        <View style={S.header}>
          <View style={S.headerLeft}>
            <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color={C.text} />
            </TouchableOpacity>
            <View>
              <Text style={S.headerTitle}>Emergency Contacts</Text>
              <Text style={S.headerSub}>Manage your safety network</Text>
            </View>
          </View>
          <TouchableOpacity style={S.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.7}>
            <Ionicons name="add" size={22} color={C.card} />
          </TouchableOpacity>
        </View>

        {/* ─── Tab bar ─── */}
        <View style={S.tabBar}>
          {(['contacts', 'services'] as const).map((tab) => {
            const active = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[S.tab, active && S.tabActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Ionicons name={tab === 'contacts' ? 'people' : 'medical'} size={18} color={active ? C.card : C.text} />
                <Text style={[S.tabLabel, active && S.tabLabelActive]}>
                  {tab === 'contacts' ? 'My Contacts' : 'Services'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Quick actions (contacts tab only) ─── */}
        {activeTab === 'contacts' && (
          <View style={S.quickRow}>
            <TouchableOpacity style={[S.quickCard, { backgroundColor: '#FDE68A' }]} onPress={handleShareLocation} activeOpacity={0.7}>
              <View style={S.quickIcon}><Ionicons name="location" size={20} color={C.text} /></View>
              <Text style={S.quickLabel}>Share Location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.quickCard, { backgroundColor: '#FECACA' }]} onPress={() => handleEmergencyAlert('panic')} activeOpacity={0.7}>
              <View style={S.quickIcon}><Ionicons name="warning" size={20} color={C.red} /></View>
              <Text style={S.quickLabel}>Send Alert</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Contacts tab ─── */}
        {activeTab === 'contacts' ? (
          contacts.length === 0 ? (
            <View style={S.emptyWrap}>
              <View style={S.emptyIconWrap}>
                <Ionicons name="people-outline" size={48} color={C.green} />
              </View>
              <Text style={S.emptyTitle}>No Emergency Contacts</Text>
              <Text style={S.emptyDesc}>
                Add emergency contacts to quickly share your location and send alerts
              </Text>
              <TouchableOpacity style={S.emptyBtn} onPress={() => setModalVisible(true)} activeOpacity={0.7}>
                <Ionicons name="add-circle" size={20} color={C.card} />
                <Text style={S.emptyBtnText}>Add First Contact</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={contacts}
              renderItem={renderContact}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            />
          )
        ) : (
          /* ─── Services tab ─── */
          <View style={{ flex: 1 }}>
            {servicesLoading ? (
              <View style={S.loadingWrap}>
                <View style={S.loadingCard}>
                  <ActivityIndicator size="large" color={C.green} />
                  <Text style={S.loadingText}>Loading services…</Text>
                </View>
              </View>
            ) : emergencyServices.length === 0 ? (
              <View style={S.emptyWrap}>
                <View style={S.emptyIconWrap}>
                  <Ionicons name="medical-outline" size={48} color={C.green} />
                </View>
                <Text style={S.emptyTitle}>No Emergency Services</Text>
                <Text style={S.emptyDesc}>No emergency services available in your area.</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
                {emergencyServices.map((svc) => (
                  <View key={svc.id} style={S.serviceCard}>
                    <View style={S.serviceTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={S.serviceName}>{svc.name}</Text>
                        <Text style={S.serviceType}>{svc.serviceType.replace('_', ' ').toUpperCase()}</Text>
                      </View>
                      <View style={[S.svcStatusBadge, { backgroundColor: svc.isActive ? C.greenPale : '#FEE2E2' }]}>
                        <Text style={[S.svcStatusText, { color: svc.isActive ? C.green : C.red }]}>
                          {svc.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>

                    <View style={S.svcDetails}>
                      <View style={S.svcRow}><Ionicons name="call" size={15} color={C.accent} /><Text style={S.svcRowText}>{svc.phoneNumber}</Text></View>
                      <View style={S.svcRow}><Ionicons name="time" size={15} color={C.accent} /><Text style={S.svcRowText}>{svc.availableHours}</Text></View>
                      <View style={S.svcRow}><Ionicons name="location" size={15} color={C.accent} /><Text style={S.svcRowText}>{svc.address}</Text></View>
                      {svc.description ? (
                        <View style={S.svcRow}><Ionicons name="information-circle" size={15} color={C.accent} /><Text style={S.svcRowText}>{svc.description}</Text></View>
                      ) : null}
                    </View>

                    <TouchableOpacity
                      style={[S.callBtn, !svc.isActive && { backgroundColor: '#E5E7EB' }]}
                      disabled={!svc.isActive}
                      activeOpacity={0.7}
                      onPress={() => {
                        Alert.alert('Call Service', `Call ${svc.name} at ${svc.phoneNumber}?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Call', onPress: () => Linking.openURL(`tel:${svc.phoneNumber}`) },
                        ]);
                      }}
                    >
                      <Ionicons name="call" size={18} color={svc.isActive ? C.card : C.textSecondary} />
                      <Text style={[S.callBtnText, !svc.isActive && { color: C.textSecondary }]}>Call {svc.phoneNumber}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* ─── Add / Edit Modal ─── */}
        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={S.modalOverlay}>
            <View style={S.modalBox}>
              <View style={S.modalHead}>
                <Text style={S.modalTitle}>{editingContact ? 'Edit Contact' : 'Add Emergency Contact'}</Text>
                <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} style={S.modalCloseBtn} activeOpacity={0.7}>
                  <Ionicons name="close" size={20} color={C.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={S.modalBody} showsVerticalScrollIndicator={false}>
                {[
                  { label: 'Name *', key: 'name', placeholder: 'Enter full name', kb: 'default' as const },
                  { label: 'Phone Number *', key: 'phone', placeholder: '+1234567890', kb: 'phone-pad' as const },
                  { label: 'Email (Optional)', key: 'email', placeholder: 'email@example.com', kb: 'email-address' as const },
                  { label: 'Relationship *', key: 'relationship', placeholder: 'e.g., Father, Mother, Spouse', kb: 'default' as const },
                ].map((f) => (
                  <View key={f.key} style={S.fieldWrap}>
                    <Text style={S.fieldLabel}>{f.label}</Text>
                    <TextInput
                      style={S.fieldInput}
                      value={(formData as any)[f.key]}
                      onChangeText={(t) => setFormData({ ...formData, [f.key]: t })}
                      placeholder={f.placeholder}
                      placeholderTextColor={C.textSecondary}
                      keyboardType={f.kb}
                      autoCapitalize={f.key === 'email' ? 'none' : 'words'}
                    />
                  </View>
                ))}

                <View style={S.switchRow}>
                  <Text style={S.switchLabel}>Primary Contact</Text>
                  <Switch
                    value={formData.isPrimary}
                    onValueChange={(v) => setFormData({ ...formData, isPrimary: v })}
                    trackColor={{ false: '#D1D5DB', true: C.greenLight }}
                    thumbColor={formData.isPrimary ? C.green : '#fff'}
                  />
                </View>
                <View style={S.switchRow}>
                  <Text style={S.switchLabel}>Active (Receive Alerts)</Text>
                  <Switch
                    value={formData.isActive}
                    onValueChange={(v) => setFormData({ ...formData, isActive: v })}
                    trackColor={{ false: '#D1D5DB', true: C.greenLight }}
                    thumbColor={formData.isActive ? C.green : '#fff'}
                  />
                </View>
              </ScrollView>

              <View style={S.modalFooter}>
                <TouchableOpacity style={S.cancelBtn} onPress={() => { setModalVisible(false); resetForm(); }} activeOpacity={0.7}>
                  <Text style={S.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={S.saveBtn} onPress={handleSaveContact} activeOpacity={0.7}>
                  <Text style={S.saveBtnText}>{editingContact ? 'Update' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </Animated.View>
    </SafeAreaWrapper>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Neo-brutal light styles                                      */
/* ────────────────────────────────────────────────────────────── */
const BRUTAL = {
  borderWidth: 2.5,
  borderColor: C.border,
  shadowColor: C.border,
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 5,
} as const;

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  /* ── Loading ── */
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  loadingCard: {
    backgroundColor: C.card, padding: 32, borderRadius: 16, alignItems: 'center',
    ...BRUTAL,
  },
  loadingText: { marginTop: 12, fontSize: 15, fontWeight: '600', color: C.textSecondary },

  /* ── Header ── */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: C.card,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: C.border,
    shadowColor: C.border, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: C.text },
  headerSub: { fontSize: 13, color: C.textSecondary, marginTop: 1 },
  addBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: C.green,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: C.border,
    shadowColor: C.border, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },

  /* ── Tabs ── */
  tabBar: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 12,
    backgroundColor: C.card, borderRadius: 14, padding: 4,
    borderWidth: 2.5, borderColor: C.border,
    shadowColor: C.border, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  tabActive: { backgroundColor: C.green },
  tabLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  tabLabelActive: { color: C.card },

  /* ── Quick actions ── */
  quickRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 14 },
  quickCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 14,
    borderWidth: 2.5, borderColor: C.border,
    shadowColor: C.border, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  quickIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.border,
  },
  quickLabel: { fontSize: 14, fontWeight: '700', color: C.text },

  /* ── Contact card ── */
  contactCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14,
    ...BRUTAL,
  },
  contactTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: {
    width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.border,
  },
  contactName: { fontSize: 17, fontWeight: '800', color: C.text },
  contactRel: { fontSize: 13, fontWeight: '600', color: C.accent, marginTop: 1 },
  contactDetails: { marginBottom: 12, gap: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: C.textSecondary },
  primaryBadge: {
    backgroundColor: '#FDE68A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
    borderWidth: 1.5, borderColor: C.border,
  },
  primaryBadgeText: { fontSize: 10, fontWeight: '800', color: C.text },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    borderWidth: 1.5, borderColor: C.border,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  contactActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 8, borderRadius: 10,
    borderWidth: 2, borderColor: C.border,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700' },

  /* ── Empty state ── */
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 20, backgroundColor: C.greenPale,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    borderWidth: 2.5, borderColor: C.border,
    shadowColor: C.border, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 6 },
  emptyDesc: { fontSize: 15, color: C.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.green, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14,
    borderWidth: 2.5, borderColor: C.border,
    shadowColor: C.border, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '800', color: C.card },

  /* ── Service card ── */
  serviceCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 14,
    ...BRUTAL,
  },
  serviceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  serviceName: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 2 },
  serviceType: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  svcStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1.5, borderColor: C.border },
  svcStatusText: { fontSize: 12, fontWeight: '700' },
  svcDetails: { borderTopWidth: 2, borderTopColor: '#E5E7EB', paddingTop: 12, marginBottom: 12, gap: 6 },
  svcRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  svcRowText: { fontSize: 14, color: C.text },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.green, paddingVertical: 12, borderRadius: 12,
    borderWidth: 2.5, borderColor: C.border,
    shadowColor: C.border, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  callBtnText: { fontSize: 15, fontWeight: '700', color: C.card },

  /* ── Modal ── */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalBox: {
    width: '90%', maxHeight: '82%', backgroundColor: C.card, borderRadius: 20, overflow: 'hidden',
    borderWidth: 2.5, borderColor: C.border,
    shadowColor: C.border, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8,
  },
  modalHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 18, borderBottomWidth: 2.5, borderBottomColor: C.border,
    backgroundColor: C.greenPale,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  modalCloseBtn: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: C.card,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.border,
  },
  modalBody: { padding: 18 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 6 },
  fieldInput: {
    backgroundColor: C.bg, borderRadius: 12, borderWidth: 2.5, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text,
  },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14, paddingVertical: 4,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  modalFooter: {
    flexDirection: 'row', gap: 12, padding: 18,
    borderTopWidth: 2.5, borderTopColor: C.border,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center',
    backgroundColor: C.bg, borderWidth: 2.5, borderColor: C.border,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: C.textSecondary },
  saveBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center',
    backgroundColor: C.green, borderWidth: 2.5, borderColor: C.border,
    shadowColor: C.border, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: C.card },
});