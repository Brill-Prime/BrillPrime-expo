import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Users, DollarSign, AlertTriangle, TrendingUp, 
  Eye, CheckCircle, XCircle, Clock, Activity, FileText,
  Gavel, RefreshCw, Bell, BarChart3, Settings
} from 'lucide-react';

interface SystemMetrics {
  platform: {
    totalUsers: number;
    activeUsers: number;
    onlineDrivers: number;
    activeMerchants: number;
    systemUptime: number;
    serverHealth: string;
  };
  transactions: {
    totalTransactions: number;
    todayTransactions: number;
    pendingTransactions: number;
    disputedTransactions: number;
    totalVolume: number;
    escrowBalance: number;
  };
  security: {
    fraudAlerts: number;
    suspiciousActivities: number;
    blockedUsers: number;
    securityIncidents: number;
  };
}

interface EscrowOverview {
  totalBalance: number;
  pendingReleases: number;
  disputedAmount: number;
  releasedToday: number;
  transactions: {
    pending: number;
    disputed: number;
    readyForRelease: number;
  };
  analytics: {
    averageHoldTime: number;
    releaseRate: number;
    disputeRate: number;
  };
}

export default function AdminControlCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const { toast } = useToast();

  // Real-time system metrics
  const { data: systemMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['/api/admin/system-metrics'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Escrow overview
  const { data: escrowOverview } = useQuery({
    queryKey: ['/api/admin/escrow-overview'],
    refetchInterval: 60000
  });

  // Pending verifications
  const { data: pendingVerifications } = useQuery({
    queryKey: ['/api/admin/pending-verifications'],
    refetchInterval: 30000
  });

  // Active disputes
  const { data: disputes } = useQuery({
    queryKey: ['/api/admin/disputes'],
    refetchInterval: 30000
  });

  // Platform analytics
  const { data: analytics } = useQuery({
    queryKey: ['/api/admin/analytics', { timeframe: 'week' }],
    refetchInterval: 300000 // 5 minutes
  });

  // Resolve dispute mutation
  const resolveDisputeMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/admin/disputes/${data.disputeId}/resolve`, data);
    },
    onSuccess: () => {
      toast({ title: "Dispute resolved successfully" });
      setShowDisputeModal(false);
      setSelectedDispute(null);
    }
  });

  // Manual escrow action mutation
  const manualEscrowMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/escrow/manual-action", data);
    },
    onSuccess: () => {
      toast({ title: "Manual action completed successfully" });
    }
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Control Center</h1>
            <p className="text-gray-600">Platform oversight and management dashboard</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="px-3 py-1">
              <Activity className="w-4 h-4 mr-2" />
              System Online
            </Badge>
            <Button onClick={() => refetchMetrics()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* System Status Cards */}
        {systemMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.platform.activeUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {systemMetrics.platform.onlineDrivers} drivers online
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Escrow Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(systemMetrics.transactions.escrowBalance)}</div>
                <p className="text-xs text-muted-foreground">
                  {systemMetrics.transactions.pendingTransactions} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemMetrics.security.fraudAlerts}</div>
                <p className="text-xs text-muted-foreground">
                  {systemMetrics.security.securityIncidents} incidents today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{systemMetrics.platform.serverHealth}</div>
                <p className="text-xs text-muted-foreground">
                  Uptime: {formatUptime(systemMetrics.platform.systemUptime)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="escrow">Escrow</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="verifications">Verifications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Real-time Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Real-time Activity</CardTitle>
                  <CardDescription>Live platform monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Today's Transactions</span>
                      <Badge>{systemMetrics?.transactions.todayTransactions}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Active Merchants</span>
                      <Badge variant="secondary">{systemMetrics?.platform.activeMerchants}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Online Drivers</span>
                      <Badge variant="outline">{systemMetrics?.platform.onlineDrivers}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Administrative controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Bell className="w-4 h-4 mr-2" />
                    Send Platform Announcement
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    System Maintenance Mode
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Reports
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Escrow Management Tab */}
          <TabsContent value="escrow" className="space-y-6">
            {escrowOverview && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Escrow Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {formatCurrency(escrowOverview.totalBalance)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {formatCurrency(escrowOverview.releasedToday)} released today
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pending Releases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600">
                      {formatCurrency(escrowOverview.pendingReleases)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {escrowOverview.transactions.readyForRelease} ready for release
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Disputed Amount</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      {formatCurrency(escrowOverview.disputedAmount)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {escrowOverview.transactions.disputed} active disputes
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Disputes</CardTitle>
                <CardDescription>Disputes requiring admin resolution</CardDescription>
              </CardHeader>
              <CardContent>
                {disputes?.disputes?.map((dispute: any) => (
                  <div key={dispute.id} className="border rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{dispute.disputeType.replace('_', ' ').toUpperCase()}</h4>
                        <p className="text-sm text-gray-600 mt-1">{dispute.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant={dispute.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                            {dispute.priority}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatCurrency(dispute.transactionAmount)}
                          </span>
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          setSelectedDispute(dispute);
                          setShowDisputeModal(true);
                        }}
                        size="sm"
                      >
                        <Gavel className="w-4 h-4 mr-2" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                )) || <p>No active disputes</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Analytics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Revenue</span>
                      <span className="font-semibold">{formatCurrency(analytics.analytics.financial.revenueGrowth)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue Growth</span>
                      <span className="font-semibold text-green-600">+{analytics.analytics.financial.revenueGrowth}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Escrow Turnover</span>
                      <span className="font-semibold">{analytics.analytics.financial.escrowTurnover} days</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Behavior</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Daily Active Users</span>
                      <span className="font-semibold">{analytics.analytics.userBehavior.dailyActiveUsers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conversion Rate</span>
                      <span className="font-semibold">{analytics.analytics.userBehavior.conversionRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Retention Rate</span>
                      <span className="font-semibold">{analytics.analytics.userBehavior.retentionRate}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dispute Resolution Modal */}
        <Dialog open={showDisputeModal} onOpenChange={setShowDisputeModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Resolve Dispute</DialogTitle>
            </DialogHeader>
            {selectedDispute && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Dispute Details</h4>
                  <p className="text-sm text-gray-600">{selectedDispute.description}</p>
                  <p className="text-sm mt-2">Amount: {formatCurrency(selectedDispute.transactionAmount)}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Resolution</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select resolution" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approve_customer">Approve Customer</SelectItem>
                        <SelectItem value="approve_merchant">Approve Merchant</SelectItem>
                        <SelectItem value="partial_refund">Partial Refund</SelectItem>
                        <SelectItem value="no_action">No Action</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Admin Notes</label>
                    <Textarea placeholder="Enter resolution notes..." />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowDisputeModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => resolveDisputeMutation.mutate({
                      disputeId: selectedDispute.id,
                      resolution: 'approve_customer',
                      adminNotes: 'Resolved in favor of customer',
                      evidenceReviewed: true
                    })}>
                      Resolve Dispute
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}