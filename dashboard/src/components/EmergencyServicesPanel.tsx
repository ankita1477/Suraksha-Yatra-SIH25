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

export const EmergencyServicesPanel: React.FC<Props> = ({ token }) => {
  const [services, setServices] = useState<EmergencyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState<EmergencyService | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    phoneNumber: string;
    serviceType: 'police' | 'hospital' | 'fire' | 'ambulance' | 'tourist_helpline' | 'other';
    address: string;
    city: string;
    state: string;
    isActive: boolean;
    availableHours: string;
  }>({
    name: '',
    phoneNumber: '',
    serviceType: 'police',
    address: '',
    city: '',
    state: '',
    isActive: true,
    availableHours: '24/7'
  });

  // Mock data for now - in real app, this would come from backend
  const mockServices: EmergencyService[] = [
    {
      _id: '1',
      name: 'Central Police Station',
      phoneNumber: '100',
      serviceType: 'police',
      address: '123 Main Street',
      city: 'New Delhi',
      state: 'Delhi',
      isActive: true,
      availableHours: '24/7',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    },
    {
      _id: '2',
      name: 'All India Institute of Medical Sciences',
      phoneNumber: '108',
      serviceType: 'hospital',
      address: 'Ansari Nagar',
      city: 'New Delhi',
      state: 'Delhi',
      isActive: true,
      availableHours: '24/7',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    },
    {
      _id: '3',
      name: 'Fire Department',
      phoneNumber: '101',
      serviceType: 'fire',
      address: 'Fire Station Road',
      city: 'New Delhi',
      state: 'Delhi',
      isActive: true,
      availableHours: '24/7',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    },
    {
      _id: '4',
      name: 'India Tourism Helpline',
      phoneNumber: '1363',
      serviceType: 'tourist_helpline',
      address: 'Ministry of Tourism',
      city: 'New Delhi',
      state: 'Delhi',
      isActive: true,
      availableHours: '24/7',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    }
  ];

  const fetchServices = async () => {
    try {
      setLoading(true);
      // For now, use mock data
      // In real app: const response = await fetch('/api/emergency-services', { headers: { Authorization: `Bearer ${token}` } });
      setServices(mockServices);
      setError(null);
    } catch (err) {
      setError('Network error while fetching emergency services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Mock implementation - in real app would call API
      const newService: EmergencyService = {
        _id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (editingService) {
        setServices(prev => prev.map(s => s._id === editingService._id ? { ...newService, _id: editingService._id } : s));
      } else {
        setServices(prev => [...prev, newService]);
      }
      
      setShowAddForm(false);
      setEditingService(null);
      setFormData({
        name: '',
        phoneNumber: '',
        serviceType: 'police',
        address: '',
        city: '',
        state: '',
        isActive: true,
        availableHours: '24/7'
      });
    } catch (err) {
      setError('Failed to save emergency service');
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this emergency service?')) {
      try {
        // Mock implementation - in real app would call API
        setServices(prev => prev.filter(s => s._id !== serviceId));
      } catch (err) {
        setError('Failed to delete emergency service');
      }
    }
  };

  const handleEdit = (service: EmergencyService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      phoneNumber: service.phoneNumber,
      serviceType: service.serviceType,
      address: service.address,
      city: service.city,
      state: service.state,
      isActive: service.isActive,
      availableHours: service.availableHours
    });
    setShowAddForm(true);
  };

  const toggleServiceStatus = async (serviceId: string) => {
    try {
      // Mock implementation - in real app would call API
      setServices(prev => prev.map(s => 
        s._id === serviceId ? { ...s, isActive: !s.isActive } : s
      ));
    } catch (err) {
      setError('Failed to update service status');
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingService(null);
    setFormData({
      name: '',
      phoneNumber: '',
      serviceType: 'police',
      address: '',
      city: '',
      state: '',
      isActive: true,
      availableHours: '24/7'
    });
  };

  if (loading) {
    return (
      <div style={{ 
        background:'rgba(30, 41, 59, 0.8)', 
        backdropFilter: 'blur(12px)',
        borderRadius:16, 
        padding:24, 
        border: '1px solid rgba(51, 65, 85, 0.3)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12,
          color: '#94a3b8' 
        }}>
          <div style={{ 
            width: 24, 
            height: 24, 
            border: '2px solid rgba(148, 163, 184, 0.3)',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Loading emergency services...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background:'rgba(30, 41, 59, 0.8)', 
      backdropFilter: 'blur(12px)',
      borderRadius:16, 
      padding:24, 
      border: '1px solid rgba(51, 65, 85, 0.3)'
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, gap:12 }}>
        <div>
          <h2 style={{ margin:0, fontSize:24, fontWeight: 700, color: '#f1f5f9', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Emergency Services Management
          </h2>
          <p style={{ margin: '8px 0 0 0', fontSize: 14, color: '#94a3b8' }}>
            Manage emergency services available to tourists - {services.length} services configured
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          style={{ 
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: 12,
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Add Emergency Service
        </button>
      </div>

      {error && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#fca5a5',
          padding: '12px 16px',
          borderRadius: 12,
          marginBottom: 20,
          fontSize: 14
        }}>
          {error}
        </div>
      )}

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 }}>
        {services.map((service) => (
          <div key={service._id} style={{ 
            background:'rgba(15, 23, 42, 0.8)', 
            borderRadius:12, 
            border: '1px solid rgba(51, 65, 85, 0.3)',
            overflow: 'hidden',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9', margin: '0 0 8px 0' }}>{service.name}</h3>
                  <span style={{ 
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    background: service.serviceType === 'police' ? 'rgba(59, 130, 246, 0.2)' : 
                               service.serviceType === 'hospital' ? 'rgba(239, 68, 68, 0.2)' :
                               service.serviceType === 'fire' ? 'rgba(249, 115, 22, 0.2)' :
                               service.serviceType === 'ambulance' ? 'rgba(34, 197, 94, 0.2)' :
                               service.serviceType === 'tourist_helpline' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                    color: service.serviceType === 'police' ? '#93c5fd' : 
                           service.serviceType === 'hospital' ? '#fca5a5' :
                           service.serviceType === 'fire' ? '#fdba74' :
                           service.serviceType === 'ambulance' ? '#86efac' :
                           service.serviceType === 'tourist_helpline' ? '#c4b5fd' : '#d1d5db'
                  }}>
                    {service.serviceType.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => toggleServiceStatus(service._id)}
                    style={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      background: service.isActive ? '#22c55e' : '#64748b',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    title={service.isActive ? 'Active' : 'Inactive'}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#94a3b8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 500, color: '#cbd5e1' }}>📞 Phone:</span>
                  <span style={{ color: '#3b82f6', fontFamily: 'monospace', fontWeight: 500 }}>{service.phoneNumber}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 500, color: '#cbd5e1' }}>🕒 Hours:</span>
                  <span>{service.availableHours}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 500, color: '#cbd5e1' }}>📍 Address:</span>
                  <p style={{ margin: '4px 0 0 0', color: '#e2e8f0', lineHeight: 1.4 }}>
                    {service.address}, {service.city}, {service.state}
                  </p>
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: 12, 
                marginTop: 16, 
                paddingTop: 16, 
                borderTop: '1px solid rgba(51, 65, 85, 0.3)' 
              }}>
                <button
                  onClick={() => handleEdit(service)}
                  style={{ 
                    color: '#3b82f6',
                    background: 'transparent',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 6,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(service._id)}
                  style={{ 
                    color: '#ef4444',
                    background: 'transparent',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 6,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0, 0, 0, 0.6)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 50,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
            backdropFilter: 'blur(12px)',
            borderRadius: 16, 
            border: '1px solid rgba(51, 65, 85, 0.3)',
            width: '100%', 
            maxWidth: 500, 
            margin: 16,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ 
                  fontSize: 20, 
                  fontWeight: 600, 
                  color: '#f1f5f9',
                  margin: 0
                }}>
                  {editingService ? 'Edit Emergency Service' : 'Add New Emergency Service'}
                </h3>
                <button
                  onClick={resetForm}
                  style={{ 
                    color: '#94a3b8',
                    background: 'transparent',
                    border: 'none',
                    fontSize: 24,
                    cursor: 'pointer',
                    padding: 4,
                    borderRadius: 6,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#cbd5e1', marginBottom: 6 }}>
                    Service Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ 
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(51, 65, 85, 0.5)',
                      borderRadius: 8,
                      color: '#e2e8f0',
                      fontSize: 14,
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.5)'}
                    required
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#cbd5e1', marginBottom: 6 }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    style={{ 
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(51, 65, 85, 0.5)',
                      borderRadius: 8,
                      color: '#e2e8f0',
                      fontSize: 14,
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.5)'}
                    required
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#cbd5e1', marginBottom: 6 }}>
                    Service Type
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as any })}
                    style={{ 
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(51, 65, 85, 0.5)',
                      borderRadius: 8,
                      color: '#e2e8f0',
                      fontSize: 14,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="police">Police</option>
                    <option value="hospital">Hospital</option>
                    <option value="fire">Fire Department</option>
                    <option value="ambulance">Ambulance</option>
                    <option value="tourist_helpline">Tourist Helpline</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#cbd5e1', marginBottom: 6 }}>
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    style={{ 
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(51, 65, 85, 0.5)',
                      borderRadius: 8,
                      color: '#e2e8f0',
                      fontSize: 14,
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.5)'}
                    required
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#cbd5e1', marginBottom: 6 }}>
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      style={{ 
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(51, 65, 85, 0.5)',
                        borderRadius: 8,
                        color: '#e2e8f0',
                        fontSize: 14,
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.5)'}
                      required
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#cbd5e1', marginBottom: 6 }}>
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      style={{ 
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(51, 65, 85, 0.5)',
                        borderRadius: 8,
                        color: '#e2e8f0',
                        fontSize: 14,
                        outline: 'none',
                        transition: 'all 0.2s'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.5)'}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#cbd5e1', marginBottom: 6 }}>
                    Available Hours
                  </label>
                  <input
                    type="text"
                    value={formData.availableHours}
                    onChange={(e) => setFormData({ ...formData, availableHours: e.target.value })}
                    style={{ 
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(51, 65, 85, 0.5)',
                      borderRadius: 8,
                      color: '#e2e8f0',
                      fontSize: 14,
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.5)'}
                    placeholder="e.g., 24/7, 9:00 AM - 5:00 PM"
                    required
                  />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ 
                      width: 16, 
                      height: 16,
                      accentColor: '#3b82f6'
                    }}
                  />
                  <label htmlFor="isActive" style={{ fontSize: 14, color: '#cbd5e1' }}>
                    Active Service
                  </label>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16 }}>
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{ 
                      padding: '10px 16px',
                      color: '#94a3b8',
                      background: 'rgba(71, 85, 105, 0.3)',
                      border: '1px solid rgba(71, 85, 105, 0.5)',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(71, 85, 105, 0.5)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(71, 85, 105, 0.3)'}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ 
                      padding: '10px 16px',
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    {editingService ? 'Update Service' : 'Add Service'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};