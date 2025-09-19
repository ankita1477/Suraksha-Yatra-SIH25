import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  _id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'user' | 'officer' | 'admin';
  isActive: boolean;
  lastSeen?: string;
  createdAt: string;
  emergencyContacts?: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
}

interface NewUser {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  role: 'user' | 'officer' | 'admin';
}

interface Props {
  token: string;
}

export const AdminUserManagement: React.FC<Props> = ({ token }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'user'
  });
  const [filters, setFilters] = useState({
    role: '',
    isActive: '',
    search: ''
  });
  const [bulkActions, setBulkActions] = useState({
    selectedUsers: new Set<string>(),
    action: ''
  });

  const API_BASE = import.meta.env.VITE_API_BASE || '/api';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters.search ? { search: filters.search } : {}
      });
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      setError(null);
      await axios.post(`${API_BASE}/admin/users`, newUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNewUser({
        email: '',
        password: '',
        name: '',
        phone: '',
        role: 'user'
      });
      setShowCreateForm(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      setError(null);
      await axios.patch(`${API_BASE}/admin/users/${userId}`, 
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user role');
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      setError(null);
      await axios.patch(`${API_BASE}/admin/users/${userId}`, 
        { isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user status');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      await axios.delete(`${API_BASE}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const executeBulkAction = async () => {
    if (bulkActions.selectedUsers.size === 0 || !bulkActions.action) return;

    const userIds = Array.from(bulkActions.selectedUsers);
    
    try {
      setError(null);
      await axios.post(`${API_BASE}/admin/users/bulk`, {
        action: bulkActions.action,
        userIds
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBulkActions({ selectedUsers: new Set(), action: '' });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to execute bulk action');
    }
  };

  const filteredUsers = users.filter(user => {
    if (filters.role && user.role !== filters.role) return false;
    if (filters.isActive !== '' && user.isActive !== (filters.isActive === 'true')) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return user.email.toLowerCase().includes(searchLower) ||
             user.name?.toLowerCase().includes(searchLower) ||
             user.phone?.includes(filters.search);
    }
    return true;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#8b5cf6';
      case 'officer': return '#3b82f6';
      case 'user': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#10b981' : '#ef4444';
  };

  return (
    <div style={{
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h1 style={{
          margin: 0,
          color: '#f1f5f9',
          fontSize: '28px',
          fontWeight: '700'
        }}>
          User Management
        </h1>
        
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          + Create User
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          color: '#fca5a5',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
        padding: '20px',
        backgroundColor: 'rgba(51, 65, 85, 0.3)',
        borderRadius: '8px'
      }}>
        <div>
          <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
            Search
          </label>
          <input
            type="text"
            placeholder="Email, name, or phone..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'rgba(71, 85, 105, 0.3)',
              border: '1px solid rgba(100, 116, 139, 0.3)',
              borderRadius: '6px',
              color: '#e2e8f0',
              fontSize: '14px'
            }}
          />
        </div>
        
        <div>
          <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
            Role
          </label>
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'rgba(71, 85, 105, 0.3)',
              border: '1px solid rgba(100, 116, 139, 0.3)',
              borderRadius: '6px',
              color: '#e2e8f0',
              fontSize: '14px'
            }}
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="officer">Officer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        <div>
          <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
            Status
          </label>
          <select
            value={filters.isActive}
            onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'rgba(71, 85, 105, 0.3)',
              border: '1px solid rgba(100, 116, 139, 0.3)',
              borderRadius: '6px',
              color: '#e2e8f0',
              fontSize: '14px'
            }}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'end', gap: '8px' }}>
          <button
            onClick={fetchUsers}
            style={{
              padding: '8px 16px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Apply Filters
          </button>
          <button
            onClick={() => setFilters({ role: '', isActive: '', search: '' })}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {bulkActions.selectedUsers.size > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <span style={{ color: '#93c5fd' }}>
            {bulkActions.selectedUsers.size} users selected
          </span>
          
          <select
            value={bulkActions.action}
            onChange={(e) => setBulkActions({ ...bulkActions, action: e.target.value })}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(71, 85, 105, 0.3)',
              border: '1px solid rgba(100, 116, 139, 0.3)',
              borderRadius: '6px',
              color: '#e2e8f0',
              fontSize: '14px'
            }}
          >
            <option value="">Select Action</option>
            <option value="activate">Activate</option>
            <option value="deactivate">Deactivate</option>
            <option value="delete">Delete</option>
            <option value="role-officer">Make Officer</option>
            <option value="role-user">Make User</option>
          </select>
          
          <button
            onClick={executeBulkAction}
            disabled={!bulkActions.action}
            style={{
              padding: '6px 16px',
              backgroundColor: bulkActions.action ? '#3b82f6' : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: bulkActions.action ? 'pointer' : 'not-allowed'
            }}
          >
            Execute
          </button>
          
          <button
            onClick={() => setBulkActions({ selectedUsers: new Set(), action: '' })}
            style={{
              padding: '6px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Users Table */}
      <div style={{
        backgroundColor: 'rgba(51, 65, 85, 0.3)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            No users found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(71, 85, 105, 0.3)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#f1f5f9', fontWeight: '600' }}>
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBulkActions({ 
                            ...bulkActions, 
                            selectedUsers: new Set(filteredUsers.map(u => u._id)) 
                          });
                        } else {
                          setBulkActions({ ...bulkActions, selectedUsers: new Set() });
                        }
                      }}
                      checked={bulkActions.selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    />
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#f1f5f9', fontWeight: '600' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#f1f5f9', fontWeight: '600' }}>Role</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#f1f5f9', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#f1f5f9', fontWeight: '600' }}>Last Seen</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#f1f5f9', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user._id} style={{ borderTop: '1px solid rgba(71, 85, 105, 0.3)' }}>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="checkbox"
                        checked={bulkActions.selectedUsers.has(user._id)}
                        onChange={(e) => {
                          const newSelected = new Set(bulkActions.selectedUsers);
                          if (e.target.checked) {
                            newSelected.add(user._id);
                          } else {
                            newSelected.delete(user._id);
                          }
                          setBulkActions({ ...bulkActions, selectedUsers: newSelected });
                        }}
                      />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div>
                        <div style={{ color: '#f1f5f9', fontWeight: '500' }}>
                          {user.name || 'No name'}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                          {user.email}
                        </div>
                        {user.phone && (
                          <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user._id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: `${getRoleColor(user.role)}20`,
                          color: getRoleColor(user.role),
                          border: `1px solid ${getRoleColor(user.role)}40`,
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        <option value="user">User</option>
                        <option value="officer">Officer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => toggleUserStatus(user._id, !user.isActive)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: `${getStatusColor(user.isActive)}20`,
                          color: getStatusColor(user.isActive),
                          border: `1px solid ${getStatusColor(user.isActive)}40`,
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td style={{ padding: '12px', color: '#94a3b8', fontSize: '14px' }}>
                      {user.lastSeen ? new Date(user.lastSeen).toLocaleDateString() : 'Never'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setSelectedUser(user)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => deleteUser(user._id)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
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

      {/* Create User Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            padding: '24px',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '500px',
            border: '1px solid rgba(51, 65, 85, 0.3)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#f1f5f9' }}>Create New User</h2>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(71, 85, 105, 0.3)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                  Password *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(71, 85, 105, 0.3)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(71, 85, 105, 0.3)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(71, 85, 105, 0.3)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(71, 85, 105, 0.3)',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '14px'
                  }}
                >
                  <option value="user">User</option>
                  <option value="officer">Officer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={createUser}
                disabled={!newUser.email || !newUser.password}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: newUser.email && newUser.password ? '#3b82f6' : '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: newUser.email && newUser.password ? 'pointer' : 'not-allowed'
                }}
              >
                Create User
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            padding: '24px',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '600px',
            border: '1px solid rgba(51, 65, 85, 0.3)',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#f1f5f9' }}>User Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '16px', color: '#e2e8f0' }}>
              <div>
                <strong style={{ color: '#f1f5f9' }}>Basic Information</strong>
                <div style={{ marginTop: '8px', fontSize: '14px' }}>
                  <div>Email: {selectedUser.email}</div>
                  <div>Name: {selectedUser.name || 'Not provided'}</div>
                  <div>Phone: {selectedUser.phone || 'Not provided'}</div>
                  <div>Role: {selectedUser.role}</div>
                  <div>Status: {selectedUser.isActive ? 'Active' : 'Inactive'}</div>
                  <div>Created: {new Date(selectedUser.createdAt).toLocaleString()}</div>
                  <div>Last Seen: {selectedUser.lastSeen ? new Date(selectedUser.lastSeen).toLocaleString() : 'Never'}</div>
                </div>
              </div>
              
              {selectedUser.emergencyContacts && selectedUser.emergencyContacts.length > 0 && (
                <div>
                  <strong style={{ color: '#f1f5f9' }}>Emergency Contacts</strong>
                  <div style={{ marginTop: '8px' }}>
                    {selectedUser.emergencyContacts.map((contact, index) => (
                      <div key={index} style={{ 
                        padding: '8px', 
                        backgroundColor: 'rgba(51, 65, 85, 0.3)', 
                        borderRadius: '4px',
                        marginBottom: '8px',
                        fontSize: '14px'
                      }}>
                        <div>{contact.name} ({contact.relationship})</div>
                        <div>{contact.phone}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};