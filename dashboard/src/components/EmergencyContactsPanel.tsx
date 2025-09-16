import React, { useState, useEffect } from 'react';

interface EmergencyService {
  _id: string;
  name: string;
  phoneNumber: string;
  serviceType: 'police' | 'hospital' | 'fire' | 'ambulance' | 'tourist_helpline' | 'other';
  address: string;
  city: string;
  state: string;
  isActive: boolean;
  availableHours: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  token: string;
}

export const EmergencyContactsPanel: React.FC<Props> = ({ token }) => {
  const [services, setServices] = useState<EmergencyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState<EmergencyService | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    serviceType: 'police' as const,
    address: '',
    city: '',
    state: '',
    isActive: true,
    availableHours: '24/7'
  });

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/emergency-contacts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setContacts(data.emergencyContacts || []);
      } else {
        setError('Failed to fetch emergency contacts');
      }
    } catch (err) {
      setError('Network error while fetching contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchContacts();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingContact 
        ? `/api/emergency-contacts/${editingContact._id}`
        : '/api/emergency-contacts';
      
      const method = editingContact ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchContacts();
        setShowAddForm(false);
        setEditingContact(null);
        setFormData({ name: '', phoneNumber: '', relationship: '', isPrimary: false });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save contact');
      }
    } catch (err) {
      setError('Network error while saving contact');
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this emergency contact?')) {
      return;
    }

    try {
      const response = await fetch(`/api/emergency-contacts/${contactId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchContacts();
      } else {
        setError('Failed to delete contact');
      }
    } catch (err) {
      setError('Network error while deleting contact');
    }
  };

  const handleEdit = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      relationship: contact.relationship,
      isPrimary: contact.isPrimary
    });
    setShowAddForm(true);
  };

  const handleTestContact = async (contactId: string) => {
    try {
      const response = await fetch(`/api/emergency-contacts/${contactId}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Test notification sent successfully!');
      } else {
        setError('Failed to send test notification');
      }
    } catch (err) {
      setError('Network error while testing contact');
    }
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingContact(null);
    setFormData({ name: '', phoneNumber: '', relationship: '', isPrimary: false });
  };

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.8)',
      backdropFilter: 'blur(12px)',
      borderRadius: 16,
      padding: 24,
      border: '1px solid rgba(51, 65, 85, 0.3)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#f1f5f9' }}>
            Emergency Contacts Management
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#94a3b8' }}>
            {contacts.length} contacts registered
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Add Contact
        </button>
      </div>

      {error && (
        <div style={{
          padding: 12,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 8,
          color: '#fca5a5',
          marginBottom: 16,
          fontSize: 13
        }}>
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            ×
          </button>
        </div>
      )}

      {(showAddForm || editingContact) && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          border: '1px solid rgba(51, 65, 85, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#f1f5f9' }}>
            {editingContact ? 'Edit Contact' : 'Add New Contact'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(51, 65, 85, 0.5)',
                    borderRadius: 6,
                    color: '#e2e8f0',
                    fontSize: 13
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(f => ({ ...f, phoneNumber: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(51, 65, 85, 0.5)',
                    borderRadius: 6,
                    color: '#e2e8f0',
                    fontSize: 13
                  }}
                />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                Relationship *
              </label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData(f => ({ ...f, relationship: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(51, 65, 85, 0.5)',
                  borderRadius: 6,
                  color: '#e2e8f0',
                  fontSize: 13
                }}
              >
                <option value="">Select relationship</option>
                <option value="family">Family</option>
                <option value="friend">Friend</option>
                <option value="colleague">Colleague</option>
                <option value="emergency_service">Emergency Service</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData(f => ({ ...f, isPrimary: e.target.checked }))}
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ fontSize: 13, color: '#94a3b8' }}>Primary contact</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {editingContact ? 'Update' : 'Add'} Contact
              </button>
              <button
                type="button"
                onClick={cancelForm}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid rgba(51, 65, 85, 0.5)',
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: 40,
          gap: 12
        }}>
          <div style={{
            width: 20,
            height: 20,
            border: '2px solid rgba(148, 163, 184, 0.3)',
            borderTop: '2px solid #94a3b8',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ color: '#94a3b8' }}>Loading contacts...</span>
        </div>
      ) : contacts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 40,
          color: '#64748b'
        }}>
          <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.5 }}>📞</div>
          <div>No emergency contacts found</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            Add contacts to enable emergency notifications
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(59, 130, 246, 0.3)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#f1f5f9', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#f1f5f9', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Phone</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#f1f5f9', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Relationship</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', color: '#f1f5f9', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Primary</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#f1f5f9', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Added</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', color: '#f1f5f9', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact, index) => (
                <tr
                  key={contact._id}
                  style={{
                    borderBottom: '1px solid rgba(51, 65, 85, 0.3)',
                    background: index % 2 === 0 ? 'rgba(15, 23, 42, 0.2)' : 'transparent'
                  }}
                >
                  <td style={{ padding: '12px 16px', color: '#e2e8f0', fontWeight: 500 }}>
                    {contact.name}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontFamily: 'monospace' }}>
                    {contact.phoneNumber}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#93c5fd',
                      border: '1px solid rgba(59, 130, 246, 0.2)'
                    }}>
                      {contact.relationship}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {contact.isPrimary ? (
                      <span style={{ color: '#fbbf24', fontSize: 16 }}>⭐</span>
                    ) : (
                      <span style={{ color: '#64748b' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 12 }}>
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button
                        onClick={() => handleTestContact(contact._id)}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(34, 197, 94, 0.1)',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          borderRadius: 4,
                          color: '#86efac',
                          fontSize: 11,
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                      >
                        Test
                      </button>
                      <button
                        onClick={() => handleEdit(contact)}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          borderRadius: 4,
                          color: '#93c5fd',
                          fontSize: 11,
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(contact._id)}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: 4,
                          color: '#fca5a5',
                          fontSize: 11,
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};