
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'CONSUMER' | 'MERCHANT' | 'DRIVER';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'BANNED';
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  lastActive: string;
  totalOrders?: number;
  totalSpent?: number;
  rating?: number;
}

export default function AdminUserManagement() {
  const router = useRouter();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<'all' | 'CONSUMER' | 'MERCHANT' | 'DRIVER'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'BANNED'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    loadUsers();
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, selectedRole, selectedStatus, searchQuery]);

  const loadUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('adminToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://api.brillprime.com'}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        // Mock data fallback
        const mockUsers: User[] = [
          {
            id: '1',
            fullName: 'John Doe',
            email: 'john@example.com',
            phone: '+2348012345678',
            role: 'CONSUMER',
            status: 'ACTIVE',
            kycStatus: 'APPROVED',
            createdAt: '2024-01-15T10:30:00Z',
            lastActive: '2024-01-20T15:45:00Z',
            totalOrders: 25,
            totalSpent: 125000,
            rating: 4.8
          },
          {
            id: '2',
            fullName: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+2348098765432',
            role: 'MERCHANT',
            status: 'ACTIVE',
            kycStatus: 'APPROVED',
            createdAt: '2024-01-10T09:20:00Z',
            lastActive: '2024-01-20T16:30:00Z',
            rating: 4.9
          },
          {
            id: '3',
            fullName: 'Mike Johnson',
            email: 'mike@example.com',
            phone: '+2347012345678',
            role: 'DRIVER',
            status: 'PENDING',
            kycStatus: 'PENDING',
            createdAt: '2024-01-18T14:15:00Z',
            lastActive: '2024-01-19T10:00:00Z',
            rating: 4.6
          },
          {
            id: '4',
            fullName: 'Sarah Williams',
            email: 'sarah@example.com',
            phone: '+2348087654321',
            role: 'CONSUMER',
            status: 'SUSPENDED',
            kycStatus: 'APPROVED',
            createdAt: '2023-12-05T08:00:00Z',
            lastActive: '2024-01-15T12:00:00Z',
            totalOrders: 5,
            totalSpent: 15000
          }
        ];
        setUsers(mockUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(user => user.status === selectedStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone.includes(searchQuery)
      );
    }

    setFilteredUsers(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleUserAction = async (userId: string, action: 'activate' | 'suspend' | 'ban' | 'delete') => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action} this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: action === 'delete' || action === 'ban' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('adminToken');
              const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://api.brillprime.com'}/api/admin/users/${userId}/${action}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  reason: suspensionReason
                })
              });

              if (!response.ok) throw new Error(`Failed to ${action} user`);

              setUsers(prev => prev.map(user => 
                user.id === userId 
                  ? { 
                      ...user, 
                      status: action === 'activate' ? 'ACTIVE' : action === 'suspend' ? 'SUSPENDED' : 'BANNED'
                    }
                  : user
              ));

              Alert.alert('Success', `User ${action}d successfully`);
              setShowUserModal(false);
              setSuspensionReason('');
            } catch (error) {
              console.error(`Error ${action}ing user:`, error);
              Alert.alert('Error', `Failed to ${action} user`);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#10b981';
      case 'SUSPENDED': return '#f59e0b';
      case 'PENDING': return '#3b82f6';
      case 'BANNED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'CONSUMER': return '#8b5cf6';
      case 'MERCHANT': return '#ec4899';
      case 'DRIVER': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const styles = getResponsiveStyles(screenData);

  return (
    <LinearGradient
      colors={['rgb(11, 26, 81)', '#1e3a8a']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{users.length}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{users.filter(u => u.status === 'ACTIVE').length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{users.filter(u => u.status === 'PENDING').length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{users.filter(u => u.kycStatus === 'PENDING').length}</Text>
            <Text style={styles.statLabel}>KYC Pending</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <Text style={styles.filterLabel}>Role:</Text>
            {['all', 'CONSUMER', 'MERCHANT', 'DRIVER'].map(role => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.filterButton,
                  selectedRole === role && styles.activeFilter
                ]}
                onPress={() => setSelectedRole(role as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedRole === role && styles.activeFilterText
                ]}>
                  {role.charAt(0) + role.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <Text style={styles.filterLabel}>Status:</Text>
            {['all', 'ACTIVE', 'SUSPENDED', 'PENDING', 'BANNED'].map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  selectedStatus === status && styles.activeFilter
                ]}
                onPress={() => setSelectedStatus(status as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedStatus === status && styles.activeFilterText
                ]}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Users List */}
        <View style={styles.usersList}>
          {filteredUsers.map(user => (
            <TouchableOpacity
              key={user.id}
              style={styles.userCard}
              onPress={() => {
                setSelectedUser(user);
                setShowUserModal(true);
              }}
            >
              <View style={styles.userHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.fullName}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userPhone}>{user.phone}</Text>
                </View>
                <View style={styles.userBadges}>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                    <Text style={styles.badgeText}>{user.role}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user.status) }]}>
                    <Text style={styles.badgeText}>{user.status}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.userDetails}>
                <Text style={styles.detailText}>Joined: {formatDate(user.createdAt)}</Text>
                <Text style={styles.detailText}>Last Active: {formatDate(user.lastActive)}</Text>
                <Text style={styles.detailText}>KYC: {user.kycStatus}</Text>
                {user.rating && (
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#ffc107" />
                    <Text style={styles.ratingText}>{user.rating}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* User Details Modal */}
      <Modal
        visible={showUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Details</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalUserName}>{selectedUser.fullName}</Text>
                
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Contact Information</Text>
                  <Text style={styles.modalText}>Email: {selectedUser.email}</Text>
                  <Text style={styles.modalText}>Phone: {selectedUser.phone}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Account Status</Text>
                  <Text style={styles.modalText}>Role: {selectedUser.role}</Text>
                  <Text style={styles.modalText}>Status: {selectedUser.status}</Text>
                  <Text style={styles.modalText}>KYC: {selectedUser.kycStatus}</Text>
                </View>

                {selectedUser.role === 'CONSUMER' && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Consumer Stats</Text>
                    <Text style={styles.modalText}>Total Orders: {selectedUser.totalOrders || 0}</Text>
                    <Text style={styles.modalText}>Total Spent: ₦{(selectedUser.totalSpent || 0).toLocaleString()}</Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  {selectedUser.status === 'ACTIVE' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#f59e0b' }]}
                      onPress={() => {
                        Alert.prompt(
                          'Suspend User',
                          'Enter suspension reason:',
                          (reason) => {
                            setSuspensionReason(reason || '');
                            handleUserAction(selectedUser.id, 'suspend');
                          }
                        );
                      }}
                    >
                      <Text style={styles.actionButtonText}>Suspend</Text>
                    </TouchableOpacity>
                  )}

                  {selectedUser.status === 'SUSPENDED' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                      onPress={() => handleUserAction(selectedUser.id, 'activate')}
                    >
                      <Text style={styles.actionButtonText}>Activate</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                    onPress={() => handleUserAction(selectedUser.id, 'ban')}
                  >
                    <Text style={styles.actionButtonText}>Ban User</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
                    onPress={() => {
                      setShowUserModal(false);
                      router.push(`/admin/kyc-verification`);
                    }}
                  >
                    <Text style={styles.actionButtonText}>View KYC</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const getResponsiveStyles = (screenData: any) => {
  const { width, height } = screenData;
  const isTablet = width >= 768;
  const isSmallScreen = width < 350;

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: Math.max(16, width * 0.05),
      paddingTop: Math.max(50, height * 0.07),
    },
    backButton: {
      padding: Math.max(8, width * 0.02),
    },
    headerTitle: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: "bold",
      color: "white",
    },
    refreshButton: {
      padding: Math.max(8, width * 0.02),
    },
    content: {
      flex: 1,
      backgroundColor: "white",
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
      paddingTop: Math.max(24, height * 0.03),
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      borderRadius: 10,
      paddingHorizontal: 15,
      marginHorizontal: Math.max(16, width * 0.05),
      marginBottom: 20,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      paddingLeft: 10,
      fontSize: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: Math.max(16, width * 0.05),
      gap: Math.max(12, width * 0.03),
      marginBottom: 20,
    },
    statCard: {
      width: isTablet ? '22%' : '47%',
      backgroundColor: 'white',
      padding: Math.max(16, width * 0.04),
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statValue: {
      fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
      fontWeight: 'bold',
      color: 'rgb(11, 26, 81)',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#6b7280',
    },
    filterContainer: {
      paddingHorizontal: Math.max(16, width * 0.05),
      marginBottom: 20,
    },
    filterRow: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    filterLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#333',
      marginRight: 10,
      alignSelf: 'center',
    },
    filterButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
      backgroundColor: '#f8f9fa',
      marginRight: 8,
    },
    activeFilter: {
      backgroundColor: 'rgb(11, 26, 81)',
    },
    filterButtonText: {
      fontSize: 12,
      color: '#666',
    },
    activeFilterText: {
      color: '#fff',
    },
    usersList: {
      paddingHorizontal: Math.max(16, width * 0.05),
      paddingBottom: Math.max(32, height * 0.04),
    },
    userCard: {
      backgroundColor: 'white',
      borderRadius: 12,
      padding: Math.max(16, width * 0.04),
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    userHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: isTablet ? 16 : isSmallScreen ? 13 : 14,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 4,
    },
    userEmail: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#6b7280',
      marginBottom: 2,
    },
    userPhone: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#6b7280',
    },
    userBadges: {
      alignItems: 'flex-end',
      gap: 4,
    },
    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: 'white',
    },
    userDetails: {
      borderTopWidth: 1,
      borderTopColor: '#f3f4f6',
      paddingTop: 12,
    },
    detailText: {
      fontSize: isTablet ? 12 : isSmallScreen ? 10 : 11,
      color: '#6b7280',
      marginBottom: 4,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    ratingText: {
      fontSize: 12,
      color: '#ffc107',
      marginLeft: 4,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: 20,
      width: '90%',
      maxWidth: 500,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
    },
    modalBody: {
      padding: 20,
    },
    modalUserName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: 20,
      textAlign: 'center',
    },
    modalSection: {
      marginBottom: 20,
    },
    modalSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 8,
    },
    modalText: {
      fontSize: 14,
      color: '#6b7280',
      marginBottom: 4,
    },
    modalActions: {
      gap: 12,
      marginTop: 20,
    },
    actionButton: {
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    actionButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
  });
};
