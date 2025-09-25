import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import RealTimeAdminDashboard from '../components/RealTimeAdminDashboard';
import { useAuth } from '@/hooks/use-auth';

export default function AdminRealTimeDashboardPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Redirect if not admin
  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-20">
        <div className="max-w-md mx-auto p-4 flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">Admin access required</p>
            <Button onClick={() => setLocation('/consumer-home')}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/admin-dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Admin Real-Time Dashboard</h1>
            <p className="text-gray-600">Monitor live system activity and performance</p>
          </div>
        </div>

        {/* Real-Time Admin Dashboard */}
        <RealTimeAdminDashboard />
      </div>
    </div>
  );
}