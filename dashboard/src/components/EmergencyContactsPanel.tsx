import React, { useState, useEffect } from 'react';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  token: string;
}

export const EmergencyContactsPanel: React.FC<Props> = ({ token }) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relationship: '',
    isPrimary: false
  });

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/emergency-contacts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
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
        ? `/api/emergency-contacts/${editingContact.id}`
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
        setFormData({ name: '', phone: '', relationship: '', isPrimary: false });
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
      phone: contact.phone,
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
    setFormData({ name: '', phone: '', relationship: '', isPrimary: false });
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 m-0">
            Emergency Contacts Management
          </h2>
          <p className="text-xs text-slate-400 mt-1 mb-0">
            {contacts.length} contacts registered
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-none rounded-lg text-xs font-semibold cursor-pointer transition-transform duration-200 hover:scale-105"
        >
          Add Contact
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 mb-4 text-xs">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right bg-none border-none text-red-300 cursor-pointer ml-2 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {(showAddForm || editingContact) && (
        <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-600/30 mb-6">
          <h3 className="text-base text-slate-100 mb-4">
            {editingContact ? 'Edit Contact' : 'Add New Contact'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Contact name"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="+1234567890"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-slate-400 mb-1">
                Relationship *
              </label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                required
                className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select relationship</option>
                <option value="spouse">Spouse</option>
                <option value="parent">Parent</option>
                <option value="child">Child</option>
                <option value="sibling">Sibling</option>
                <option value="friend">Friend</option>
                <option value="colleague">Colleague</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="mb-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span className="text-xs text-slate-400">Primary contact</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {editingContact ? 'Update' : 'Add'} Contact
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-slate-400/30 border-t-blue-500 rounded-full animate-spin mr-3"></div>
          <span className="text-slate-400">Loading contacts...</span>
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-30">📞</div>
          <p className="text-slate-400 mb-2">No emergency contacts yet</p>
          <p className="text-sm text-slate-500">
            Add your first emergency contact to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="bg-slate-900/50 rounded-lg p-4 border border-slate-600/20">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-base font-medium text-slate-200">{contact.name}</h4>
                    {contact.isPrimary && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400 space-y-1">
                    <p>📞 {contact.phone}</p>
                    <p>👥 {contact.relationship}</p>
                    <p className="text-xs">Added {new Date(contact.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTestContact(contact.id)}
                    className="px-3 py-1 bg-green-600/20 text-green-400 rounded text-xs hover:bg-green-600/30 transition-colors"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => handleEdit(contact)}
                    className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded text-xs hover:bg-blue-600/30 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="px-3 py-1 bg-red-600/20 text-red-400 rounded text-xs hover:bg-red-600/30 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};