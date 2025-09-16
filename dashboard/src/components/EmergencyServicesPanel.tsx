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

  const getServiceTypeColor = (type: string) => {
    const colors = {
      police: 'bg-blue-100 text-blue-800',
      hospital: 'bg-red-100 text-red-800',
      fire: 'bg-orange-100 text-orange-800',
      ambulance: 'bg-green-100 text-green-800',
      tourist_helpline: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Emergency Services Management</h2>
          <p className="text-gray-600 mt-1">
            Manage emergency services available to tourists - {services.length} services configured
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Emergency Service
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service._id} className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getServiceTypeColor(service.serviceType)}`}>
                    {service.serviceType.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleServiceStatus(service._id)}
                    className={`w-4 h-4 rounded-full ${service.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                    title={service.isActive ? 'Active' : 'Inactive'}
                  />
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <span className="font-medium">Phone:</span>
                  <span className="ml-2 text-blue-600 font-mono">{service.phoneNumber}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">Hours:</span>
                  <span className="ml-2">{service.availableHours}</span>
                </div>
                <div>
                  <span className="font-medium">Address:</span>
                  <p className="mt-1 text-gray-700">{service.address}, {service.city}, {service.state}</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(service)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(service._id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingService ? 'Edit Emergency Service' : 'Add New Emergency Service'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Hours</label>
                  <input
                    type="text"
                    value={formData.availableHours}
                    onChange={(e) => setFormData({ ...formData, availableHours: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 24/7, 9:00 AM - 5:00 PM"
                    required
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Active Service
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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