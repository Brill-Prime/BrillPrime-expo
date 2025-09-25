
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Search, Users, MoreVertical } from 'lucide-react';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  createdAt: string;
  lastLogin?: string;
}

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Mock data - replace with actual API call
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'john@example.com',
          fullName: 'John Doe',
          role: 'CONSUMER',
          status: 'ACTIVE',
          createdAt: '2024-01-15',
          lastLogin: '2024-01-20'
        },
        {
          id: '2',
          email: 'jane@business.com',
          fullName: 'Jane Smith',
          role: 'MERCHANT',
          status: 'ACTIVE',
          createdAt: '2024-01-10',
          lastLogin: '2024-01-19'
        },
        {
          id: '3',
          email: 'driver@example.com',
          fullName: 'Mike Johnson',
          role: 'DRIVER',
          status: 'SUSPENDED',
          createdAt: '2024-01-05',
          lastLogin: '2024-01-18'
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              // API call would go here
              console.log(`${action} user ${userId}`);
              await fetchUsers();
            } catch (error) {
              console.error(`Failed to ${action} user:`, error);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#10B981';
      case 'SUSPENDED': return '#EF4444';
      case 'PENDING': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'CONSUMER': return '#3B82F6';
      case 'MERCHANT': return '#8B5CF6';
      case 'DRIVER': return '#06B6D4';
      case 'ADMIN': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ padding: 24, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Users size={24} color="#1E293B" />
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1E293B' }}>
              User Management
            </Text>
            <Text style={{ fontSize: 16, color: '#64748B' }}>
              Manage platform users and permissions
            </Text>
          </View>
        </View>

        {/* Search and Filters */}
        <View style={{ gap: 12 }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: 'white',
            borderRadius: 8,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: '#D1D5DB'
          }}>
            <Search size={16} color="#6B7280" />
            <TextInput
              placeholder="Search users..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={{ 
                flex: 1, 
                paddingVertical: 12, 
                paddingHorizontal: 8,
                fontSize: 16
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>
                Role Filter
              </Text>
              <View style={{ 
                backgroundColor: 'white',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#D1D5DB',
                padding: 12
              }}>
                <Text>{filterRole === 'all' ? 'All Roles' : filterRole}</Text>
              </View>
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 4 }}>
                Status Filter
              </Text>
              <View style={{ 
                backgroundColor: 'white',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#D1D5DB',
                padding: 12
              }}>
                <Text>{filterStatus === 'all' ? 'All Status' : filterStatus}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1, padding: 24 }}>
        <View style={{ 
          backgroundColor: 'white', 
          borderRadius: 12,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4
        }}>
          {filteredUsers.map((user, index) => (
            <View 
              key={user.id}
              style={{
                padding: 16,
                borderBottomWidth: index < filteredUsers.length - 1 ? 1 : 0,
                borderBottomColor: '#F1F5F9'
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 4 }}>
                    {user.fullName}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 8 }}>
                    {user.email}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                    <View style={{
                      backgroundColor: getRoleColor(user.role) + '20',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: getRoleColor(user.role) }}>
                        {user.role}
                      </Text>
                    </View>
                    
                    <View style={{
                      backgroundColor: getStatusColor(user.status) + '20',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: getStatusColor(user.status) }}>
                        {user.status}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
                    Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </Text>
                </View>
                
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => handleUserAction(user.id, 'view')}
                    style={{
                      backgroundColor: '#3B82F6',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>View</Text>
                  </TouchableOpacity>
                  
                  {user.status === 'ACTIVE' ? (
                    <TouchableOpacity
                      onPress={() => handleUserAction(user.id, 'suspend')}
                      style={{
                        backgroundColor: '#EF4444',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>Suspend</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleUserAction(user.id, 'activate')}
                      style={{
                        backgroundColor: '#10B981',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6
                      }}
                    >
                      <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>Activate</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
