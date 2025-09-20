import { api } from './api';
import { getItem, setItem } from '../utils/secureStore';
import { sendLocationShareNotification } from './notificationService';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  isPrimary: boolean;
  isActive: boolean;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
}

// Store contacts locally and sync with backend
export async function getEmergencyContacts(): Promise<EmergencyContact[]> {
  try {
    // Try to fetch from backend first
    const response = await api.get('/emergency-contacts');
    const contacts = response.data.contacts || [];
    
    // Cache locally
    await setItem('emergency_contacts', JSON.stringify(contacts));
    return contacts;
  } catch (error) {
    // Fallback to local storage if backend fails
    console.warn('Failed to fetch contacts from backend, using local cache:', error);
    const localContacts = await getItem('emergency_contacts');
    return localContacts ? JSON.parse(localContacts) : [];
  }
}

export async function saveEmergencyContact(contact: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact> {
  try {
    // Save to backend - let backend generate the ID
    const response = await api.post('/emergency-contacts', contact);
    const savedContact = response.data.contact;
    
    // Update local cache with the saved contact
    const contacts = await getEmergencyContacts();
    const updatedContacts = [...contacts, savedContact];
    await setItem('emergency_contacts', JSON.stringify(updatedContacts));
    
    return savedContact;
  } catch (error) {
    console.warn('Failed to save contact to backend, saving locally:', error);
    
    // Fallback: create local contact with temporary ID
    const newContact: EmergencyContact = {
      ...contact,
      id: Date.now().toString(), // Temporary ID for local storage
    };
    
    // Save locally as fallback
    const contacts = await getEmergencyContacts();
    const updatedContacts = [...contacts, newContact];
    await setItem('emergency_contacts', JSON.stringify(updatedContacts));
    
    return newContact;
  }
}

export async function updateEmergencyContact(contactId: string, updates: Partial<EmergencyContact>): Promise<EmergencyContact | null> {
  try {
    // Update on backend
    const response = await api.put(`/emergency-contacts/${contactId}`, updates);
    const updatedContact = response.data.contact;
    
    // Update local cache
    const contacts = await getEmergencyContacts();
    const updatedContacts = contacts.map(c => c.id === contactId ? updatedContact : c);
    await setItem('emergency_contacts', JSON.stringify(updatedContacts));
    
    return updatedContact;
  } catch (error) {
    console.warn('Failed to update contact on backend, updating locally:', error);
    
    // Update locally as fallback
    const contacts = await getEmergencyContacts();
    const contactIndex = contacts.findIndex(c => c.id === contactId);
    if (contactIndex >= 0) {
      const updatedContact = { ...contacts[contactIndex], ...updates };
      contacts[contactIndex] = updatedContact;
      await setItem('emergency_contacts', JSON.stringify(contacts));
      return updatedContact;
    }
    
    return null;
  }
}

export async function deleteEmergencyContact(contactId: string): Promise<boolean> {
  try {
    // Delete from backend
    await api.delete(`/emergency-contacts/${contactId}`);
    
    // Update local cache
    const contacts = await getEmergencyContacts();
    const updatedContacts = contacts.filter(c => c.id !== contactId);
    await setItem('emergency_contacts', JSON.stringify(updatedContacts));
    
    return true;
  } catch (error) {
    console.warn('Failed to delete contact from backend, deleting locally:', error);
    
    // Delete locally as fallback
    const contacts = await getEmergencyContacts();
    const updatedContacts = contacts.filter(c => c.id !== contactId);
    await setItem('emergency_contacts', JSON.stringify(updatedContacts));
    
    return true;
  }
}

export async function sendLocationToContacts(location: LocationData, message?: string): Promise<boolean> {
  try {
    const contacts = await getEmergencyContacts();
    const activeContacts = contacts.filter(c => c.isActive);
    
    if (activeContacts.length === 0) {
      throw new Error('No active emergency contacts found');
    }

    // Send to backend for processing
    const response = await api.post('/user/share-location', {
      location,
      message: message || 'Emergency location sharing',
      contacts: activeContacts.map(c => ({ id: c.id, phone: c.phone, email: c.email }))
    });

    // Send notification for successful location sharing
    if (response.data.success) {
      const contactNames = activeContacts.slice(0, 3).map(c => c.name).join(', ');
      const displayName = activeContacts.length > 3 
        ? `${contactNames} and ${activeContacts.length - 3} others`
        : contactNames;
      
      await sendLocationShareNotification(displayName, true);
    }

    return response.data.success;
  } catch (error) {
    console.error('Failed to send location to contacts:', error);
    
    // Send failure notification
    await sendLocationShareNotification('emergency contacts', false);
    
    throw error;
  }
}

export async function sendEmergencyAlert(alertType: 'panic' | 'sos' | 'custom', customMessage?: string): Promise<boolean> {
  try {
    const contacts = await getEmergencyContacts();
    const activeContacts = contacts.filter(c => c.isActive);
    
    if (activeContacts.length === 0) {
      throw new Error('No active emergency contacts found');
    }

    const messages = {
      panic: '🚨 EMERGENCY ALERT: I\'m in danger and need immediate help! My location is being shared.',
      sos: '🆘 SOS: I need help urgently. Please check my location and contact emergency services.',
      custom: customMessage || 'Emergency alert from Suraksha Yatra app'
    };

    // Send emergency alert
    const response = await api.post('/user/emergency-alert', {
      alertType,
      message: messages[alertType],
      contacts: activeContacts.map(c => ({ 
        id: c.id, 
        name: c.name, 
        phone: c.phone, 
        email: c.email,
        relationship: c.relationship 
      }))
    });

    return response.data.success;
  } catch (error) {
    console.error('Failed to send emergency alert:', error);
    throw error;
  }
}

export async function testContactNotification(contact: EmergencyContact): Promise<boolean> {
  try {
    const response = await api.post('/user/test-contact', {
      contact: {
        name: contact.name,
        phone: contact.phone,
        email: contact.email
      },
      message: `Test message from Suraksha Yatra: ${contact.name}, you've been added as an emergency contact.`
    });

    return response.data.success;
  } catch (error) {
    console.error('Failed to test contact notification:', error);
    return false;
  }
}

// Validate phone number format
export function validatePhoneNumber(phone: string): boolean {
  // Basic international phone number validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
}

// Validate email format
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}