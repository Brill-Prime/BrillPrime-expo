
import React, { useState } from 'react';
import { useAdmin } from '../lib/admin-auth';
import { AdminLayout } from '../components/admin-layout';
import { AdminDashboardMain } from '../components/admin-dashboard-main';
import { AdminUserManagement } from './admin-user-management';
import { AdminKYCVerification } from './admin-kyc-verification';
import { AdminTransactions } from './admin-transactions';
import { AdminMonitoring } from './admin-monitoring';
import { AdminFraud } from './admin-fraud';
import { AdminSupport } from './admin-support';
import { AdminEscrowManagement } from './admin-escrow-management';
import { AdminModeration } from './admin-moderation';

type AdminPageType = 'dashboard' | 'users' | 'kyc' | 'escrow' | 'transactions' | 'support' | 'analytics' | 'security' | 'monitoring' | 'fraud' | 'moderation';

function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAdmin();
  const [currentPage, setCurrentPage] = useState<AdminPageType>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // This should not happen as the route is protected, but just in case
    window.location.href = '/admin';
    return null;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AdminDashboardMain />;
      case 'users':
        return <AdminUserManagement />;
      case 'kyc':
        return <AdminKYCVerification />;
      case 'transactions':
        return <AdminTransactions />;
      case 'monitoring':
        return <AdminMonitoring />;
      case 'fraud':
        return <AdminFraud />;
      case 'support':
        return <AdminSupport />;
      case 'escrow':
        return <AdminEscrowManagement />;
      case 'moderation':
        return <AdminModeration />;
      case 'analytics':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
            <p className="text-gray-600 mt-2">Advanced analytics and reporting tools coming soon...</p>
          </div>
        );
      case 'security':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">Security Center</h1>
            <p className="text-gray-600 mt-2">Security monitoring and threat detection tools coming soon...</p>
          </div>
        );
      default:
        return <AdminDashboardMain />;
    }
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page as AdminPageType);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminLayout currentPage={currentPage} onPageChange={handlePageChange}>
        {renderPage()}
      </AdminLayout>
    </div>
  );
}

export default AdminDashboard;
