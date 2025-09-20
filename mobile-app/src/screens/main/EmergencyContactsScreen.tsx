import React, { useState, useEffect } from 'react';
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
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { colors, typography, spacing, borderRadius, shadows, commonStyles } from '../../utils/theme';
import { wp, hp, normalize } from '../../utils/responsive';

interface EmergencyContactsScreenProps {
  navigation: {
    goBack: () => void;
  };
}

export default function EmergencyContactsScreen({ navigation }: EmergencyContactsScreenProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<'contacts' | 'services'>('contacts');
  
  // Emergency Contacts state
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: '',
    isPrimary: false,
    isActive: true,
  });

  // Emergency Services state
  const [emergencyServices, setEmergencyServices] = useState<EmergencyService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    loadContacts();
    loadEmergencyServices();
    
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Start pulse animation
    startPulseAnimation();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      const contactsList = await getEmergencyContacts();
      setContacts(contactsList);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      Alert.alert('Error', 'Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  };

  const loadEmergencyServices = async () => {
    try {
      setServicesLoading(true);
      const servicesList = await emergencyServicesService.getEmergencyServices();
      setEmergencyServices(servicesList);
    } catch (error) {
      console.error('Failed to load emergency services:', error);
      // Don't show alert for services, as it's not critical
    } finally {
      setServicesLoading(false);
    }
  };

  const handleSaveContact = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return;
    }
    if (!validatePhoneNumber(formData.phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    if (formData.email && !validateEmail(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (!formData.relationship.trim()) {
      Alert.alert('Error', 'Please specify the relationship');
      return;
    }

    try {
      if (editingContact) {
        // Update existing contact
        await updateEmergencyContact(editingContact.id, formData);
        Alert.alert('Success', 'Contact updated successfully');
      } else {
        // Create new contact
        await saveEmergencyContact(formData);
        Alert.alert('Success', 'Contact added successfully');
      }
      
      await loadContacts();
      resetForm();
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to save contact:', error);
      Alert.alert('Error', 'Failed to save contact');
    }
  };

  const handleDeleteContact = (contact: EmergencyContact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmergencyContact(contact.id);
              await loadContacts();
              Alert.alert('Success', 'Contact deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete contact');
            }
          }
        }
      ]
    );
  };

  const handleTestContact = async (contact: EmergencyContact) => {
    try {
      const success = await testContactNotification(contact);
      if (success) {
        Alert.alert('Success', `Test message sent to ${contact.name}`);
      } else {
        Alert.alert('Error', 'Failed to send test message');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send test message');
    }
  };

  const handleShareLocation = async () => {
    try {
      const location = await getCurrentLocation();
      if (!location) {
        Alert.alert('Error', 'Unable to get current location');
        return;
      }

      const success = await sendLocationToContacts({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
      });

      if (success) {
        Alert.alert('Success', 'Location shared with emergency contacts');
      } else {
        Alert.alert('Error', 'Failed to share location');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share location with contacts');
    }
  };

  const handleEmergencyAlert = (alertType: 'panic' | 'sos') => {
    Alert.alert(
      `Send ${alertType.toUpperCase()} Alert`,
      `This will send an emergency ${alertType} alert to all active contacts. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await sendEmergencyAlert(alertType);
              if (success) {
                Alert.alert('Success', `${alertType.toUpperCase()} alert sent to emergency contacts`);
              } else {
                Alert.alert('Error', 'Failed to send emergency alert');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to send emergency alert');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      relationship: '',
      isPrimary: false,
      isActive: true,
    });
    setEditingContact(null);
  };

  const openEditModal = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || '',
      relationship: contact.relationship,
      isPrimary: contact.isPrimary,
      isActive: contact.isActive,
    });
    setModalVisible(true);
  };

  const renderContact = ({ item }: { item: EmergencyContact }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactHeader}>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactRelationship}>{item.relationship}</Text>
          <Text style={styles.contactPhone}>{item.phone}</Text>
          {item.email && <Text style={styles.contactEmail}>{item.email}</Text>}
        </View>
        <View style={styles.contactStatus}>
          {item.isPrimary && <Text style={styles.primaryBadge}>PRIMARY</Text>}
          <Text style={[styles.statusBadge, { backgroundColor: item.isActive ? '#22c55e' : '#6b7280' }]}>
            {item.isActive ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </View>
      </View>
      
      <View style={styles.contactActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleTestContact(item)}>
          <Ionicons name="send" size={16} color="#3b82f6" />
          <Text style={styles.actionText}>Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(item)}>
          <Ionicons name="pencil" size={16} color="#22c55e" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteContact(item)}>
          <Ionicons name="trash" size={16} color="#ef4444" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading contacts...</Text>
      </View>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor={colors.background} statusBarStyle="light-content">
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Header - HomeScreen Style */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ scale: pulseAnim }]
            }
          ]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Animated.Text 
                style={[
                  styles.headerTitle,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                Emergency Contacts
              </Animated.Text>
              <Text style={styles.headerSubtitle}>Manage your emergency contacts</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'contacts' && styles.activeTab]}
            onPress={() => setActiveTab('contacts')}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="people" 
              size={20} 
              color={activeTab === 'contacts' ? colors.primary : colors.textSecondary} 
            />
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'contacts' ? colors.primary : colors.textSecondary }
            ]}>
              My Contacts
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'services' && styles.activeTab]}
            onPress={() => setActiveTab('services')}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="medical" 
              size={20} 
              color={activeTab === 'services' ? colors.primary : colors.textSecondary} 
            />
            <Text style={[
              styles.tabText, 
              { color: activeTab === 'services' ? colors.primary : colors.textSecondary }
            ]}>
              Emergency Services
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions Cards - Only show for contacts tab */}
        {activeTab === 'contacts' && (
          <Animated.View 
            style={[
              styles.quickActionsContainer,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}
          >
            <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: colors.cardYellow }]} 
              onPress={handleShareLocation}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionContent}>
                <Ionicons name="location" size={24} color={colors.textInverse} />
                <Text style={[styles.quickActionText, { color: colors.textInverse }]}>Share{'\n'}Location</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: '#FF5722' }]} 
              onPress={() => handleEmergencyAlert('panic')}
              activeOpacity={0.8}
            >
              <View style={styles.quickActionContent}>
                <Ionicons name="warning" size={24} color="#ffffff" />
                <Text style={[styles.quickActionText, { color: '#ffffff' }]}>Send{'\n'}Alert</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
        )}

        {/* Content based on active tab */}
        {activeTab === 'contacts' ? (
          // Contacts List
          <Animated.View 
            style={[
              styles.content,
            { opacity: fadeAnim }
          ]}
        >
          {contacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <View style={styles.emptyIconBackground}>
                  <Ionicons name="people-outline" size={48} color={colors.primary} />
                </View>
              </View>
              <Text style={styles.emptyTitle}>No Emergency Contacts</Text>
              <Text style={styles.emptyDescription}>
                Add emergency contacts to quickly share your location and send alerts in case of emergency
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton} 
                onPress={() => setModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyButtonText}>Add First Contact</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={contacts}
              renderItem={renderContact}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </Animated.View>
        ) : (
          // Emergency Services List
          <View style={styles.content}>
            {servicesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading emergency services...</Text>
              </View>
            ) : emergencyServices.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <View style={styles.emptyIconBackground}>
                    <Ionicons name="medical-outline" size={48} color={colors.primary} />
                  </View>
                </View>
                <Text style={styles.emptyTitle}>No Emergency Services</Text>
                <Text style={styles.emptyDescription}>
                  No emergency services are currently available in your area.
                </Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.servicesScrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.servicesContainer}
              >
                {emergencyServices.map((service) => (
                  <View key={service.id} style={styles.serviceCard}>
                    <View style={styles.serviceHeader}>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        <Text style={styles.serviceType}>
                          {service.serviceType.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                      <View style={[
                        styles.serviceStatus,
                        { backgroundColor: service.isActive ? colors.success : colors.error }
                      ]}>
                        <Text style={styles.serviceStatusText}>
                          {service.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.serviceDetails}>
                      <View style={styles.serviceDetailRow}>
                        <Ionicons name="call" size={16} color={colors.primary} />
                        <Text style={styles.serviceDetailText}>{service.phoneNumber}</Text>
                      </View>
                      <View style={styles.serviceDetailRow}>
                        <Ionicons name="time" size={16} color={colors.primary} />
                        <Text style={styles.serviceDetailText}>{service.availableHours}</Text>
                      </View>
                      <View style={styles.serviceDetailRow}>
                        <Ionicons name="location" size={16} color={colors.primary} />
                        <Text style={styles.serviceDetailText}>{service.address}</Text>
                      </View>
                      {service.description && (
                        <View style={styles.serviceDetailRow}>
                          <Ionicons name="information-circle" size={16} color={colors.primary} />
                          <Text style={styles.serviceDetailText}>{service.description}</Text>
                        </View>
                      )}
                    </View>
                    
                    <TouchableOpacity
                      style={[
                        styles.callServiceButton,
                        { backgroundColor: service.isActive ? colors.primary : colors.textMuted }
                      ]}
                      onPress={() => {
                        if (service.isActive) {
                          Alert.alert(
                            'Call Emergency Service',
                            `Call ${service.name} at ${service.phoneNumber}?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Call',
                                onPress: () => {
                                  // Import Linking at the top of the file
                                  const { Linking } = require('react-native');
                                  Linking.openURL(`tel:${service.phoneNumber}`);
                                },
                              },
                            ]
                          );
                        }
                      }}
                      disabled={!service.isActive}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="call" size={20} color={service.isActive ? colors.textInverse : colors.text} />
                      <Text style={[
                        styles.callServiceButtonText,
                        { color: service.isActive ? colors.textInverse : colors.text }
                      ]}>
                        Call {service.phoneNumber}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}

      {/* Add/Edit Contact Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
              </Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter full name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="+1234567890"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="email@example.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Relationship *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.relationship}
                  onChangeText={(text) => setFormData({ ...formData, relationship: text })}
                  placeholder="e.g., Father, Mother, Spouse, Friend"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.switchGroup}>
                <Text style={styles.switchLabel}>Primary Contact</Text>
                <Switch
                  value={formData.isPrimary}
                  onValueChange={(value) => setFormData({ ...formData, isPrimary: value })}
                  trackColor={{ false: '#6b7280', true: '#3b82f6' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.switchGroup}>
                <Text style={styles.switchLabel}>Active (Receive Alerts)</Text>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                  trackColor={{ false: '#6b7280', true: '#22c55e' }}
                  thumbColor="#fff"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => { setModalVisible(false); resetForm(); }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveContact}>
                <Text style={styles.saveButtonText}>
                  {editingContact ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </Animated.View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d1117',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  headerTitle: {
    ...typography.heading2,
    color: colors.text,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  addButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  quickActionsContainer: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionContent: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  emptyIconBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(10),
  },
  emptyIconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyButtonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  panicButton: {
    backgroundColor: '#dc2626',
  },
  sosButton: {
    backgroundColor: '#ea580c',
  },
  quickActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  listContainer: {
    paddingVertical: 16,
  },
  contactCard: {
    ...commonStyles.glassCardDark,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  contactRelationship: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  contactStatus: {
    alignItems: 'flex-end',
    gap: 4,
  },
  primaryBadge: {
    backgroundColor: '#fbbf24',
    color: '#0d1117',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '600',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
  },
  actionText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1e2a33',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.3)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 6,
  },
  textInput: {
    ...commonStyles.glassInput,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.3)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6b7280',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    margin: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  // Emergency services styles
  servicesScrollView: {
    flex: 1,
  },
  servicesContainer: {
    padding: 16,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  serviceStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e8f5e8',
  },
  serviceStatusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  serviceDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  serviceDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceDetailText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  callServiceButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  callServiceButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});