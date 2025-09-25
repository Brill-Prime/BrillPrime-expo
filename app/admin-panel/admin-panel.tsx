import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import { ArrowLeft, Users, FileText, Shield, DollarSign, Activity, AlertTriangle, Bell } from 'lucide-react';
import AdminUserManagement from './admin-user-management';
import AdminKYCVerification from './admin-kyc-verification';
import AdminTransactions from './admin-transactions';
import AdminEscrowManagement from './admin-escrow-management';
import AdminFraud from './admin-fraud';
import AdminSupport from './admin-support';
import AdminModeration from './admin-moderation';
import AdminMonitoring from './admin-monitoring';

const { width } = Dimensions.get('window');

type AdminPageType = 'dashboard' | 'users' | 'kyc' | 'escrow' | 'transactions' | 'support' | 'analytics' | 'security' | 'monitoring' | 'fraud' | 'moderation';

export default function AdminPanel() {
  const [currentPage, setCurrentPage] = useState<AdminPageType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity, color: '#3B82F6' },
    { id: 'users', label: 'User Management', icon: Users, color: '#10B981' },
    { id: 'kyc', label: 'KYC Verification', icon: FileText, color: '#F59E0B' },
    { id: 'escrow', label: 'Escrow Management', icon: Shield, color: '#8B5CF6' },
    { id: 'transactions', label: 'Transactions', icon: DollarSign, color: '#06B6D4' },
    { id: 'fraud', label: 'Fraud Detection', icon: AlertTriangle, color: '#EF4444' },
    { id: 'support', label: 'Support Tickets', icon: Bell, color: '#F97316' },
    { id: 'moderation', label: 'Content Moderation', icon: Shield, color: '#84CC16' },
    { id: 'monitoring', label: 'System Monitoring', icon: Activity, color: '#6366F1' },
  ];

  const renderDashboard = () => (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 }}>
          Admin Dashboard
        </Text>
        <Text style={{ fontSize: 16, color: '#64748B', marginBottom: 24 }}>
          Platform overview and management
        </Text>

        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <View style={{ 
            backgroundColor: 'white', 
            borderRadius: 12, 
            padding: 20, 
            width: (width - 64) / 2,
            borderLeftWidth: 4,
            borderLeftColor: '#3B82F6',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4
          }}>
            <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 8 }}>Total Users</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1E293B' }}>12,543</Text>
          </View>

          <View style={{ 
            backgroundColor: 'white', 
            borderRadius: 12, 
            padding: 20, 
            width: (width - 64) / 2,
            borderLeftWidth: 4,
            borderLeftColor: '#10B981',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4
          }}>
            <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 8 }}>Active Orders</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1E293B' }}>1,287</Text>
          </View>

          <View style={{ 
            backgroundColor: 'white', 
            borderRadius: 12, 
            padding: 20, 
            width: (width - 64) / 2,
            borderLeftWidth: 4,
            borderLeftColor: '#F59E0B',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4
          }}>
            <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 8 }}>Revenue Today</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1E293B' }}>₦2.4M</Text>
          </View>

          <View style={{ 
            backgroundColor: 'white', 
            borderRadius: 12, 
            padding: 20, 
            width: (width - 64) / 2,
            borderLeftWidth: 4,
            borderLeftColor: '#EF4444',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4
          }}>
            <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 8 }}>Pending Issues</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1E293B' }}>23</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{ 
          backgroundColor: 'white', 
          borderRadius: 12, 
          padding: 20,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4
        }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 16 }}>
            Quick Actions
          </Text>

          <View style={{ gap: 12 }}>
            {menuItems.slice(1, 5).map((item) => {
              const IconComponent = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setCurrentPage(item.id as AdminPageType)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    backgroundColor: '#F8FAFC',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#E2E8F0'
                  }}
                >
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: item.color + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <IconComponent size={16} color={item.color} />
                  </View>
                  <Text style={{ fontSize: 16, color: '#374151', fontWeight: '500' }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'users':
        return <AdminUserManagement />;
      case 'kyc':
        return <AdminKYCVerification />;
      case 'transactions':
        return <AdminTransactions />;
      case 'escrow':
        return <AdminEscrowManagement />;
      case 'fraud':
        return <AdminFraud />;
      case 'support':
        return <AdminSupport />;
      case 'moderation':
        return <AdminModeration />;
      case 'monitoring':
        return <AdminMonitoring />;
      case 'dashboard':
      default:
        return renderDashboard();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1E293B' }}>
      <StatusBar backgroundColor="#1E293B" barStyle="light-content" />

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Sidebar */}
        <View style={{ 
          width: 280, 
          backgroundColor: '#1E293B', 
          paddingTop: 20 
        }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 30 }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: 'bold', 
              color: 'white',
              marginBottom: 4 
            }}>
              Brill Prime
            </Text>
            <Text style={{ fontSize: 14, color: '#94A3B8' }}>
              Admin Panel
            </Text>
          </View>

          <ScrollView>
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentPage === item.id;

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setCurrentPage(item.id as AdminPageType)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    marginHorizontal: 12,
                    marginVertical: 2,
                    borderRadius: 8,
                    backgroundColor: isActive ? item.color + '20' : 'transparent'
                  }}
                >
                  <IconComponent 
                    size={20} 
                    color={isActive ? item.color : '#94A3B8'} 
                  />
                  <Text style={{
                    marginLeft: 12,
                    fontSize: 16,
                    fontWeight: isActive ? '600' : '400',
                    color: isActive ? item.color : '#94A3B8'
                  }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Main Content */}
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          {renderCurrentPage()}
        </View>
      </View>
    </SafeAreaView>
  );
}