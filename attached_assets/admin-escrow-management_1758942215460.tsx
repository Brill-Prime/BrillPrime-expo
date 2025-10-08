
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, AlertTriangle, CheckCircle, DollarSign, Users, FileText, Eye, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from '../components/ui/use-toast';

interface EscrowTransaction {
  id: number;
  transactionId: string;
  orderId: string;
  buyerId: number;
  sellerId: number;
  driverId?: number;
  totalAmount: string;
  sellerAmount: string;
  driverAmount: string;
  platformFee: string;
  status: 'HELD' | 'DISPUTED' | 'RELEASED_TO_SELLER' | 'RELEASED_TO_DRIVER' | 'REFUNDED';
  releaseCondition?: string;
  autoReleaseAt?: string;
  releasedAt?: string;
  createdAt: string;
  updatedAt: string;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  sellerEmail: string;
  orderTitle: string;
  orderDescription: string;
}

interface DisputeEvidence {
  customerEvidence: { type: string; filename: string; uploadedAt: string }[];
  merchantEvidence: { type: string; filename: string; uploadedAt: string }[];
}

interface DisputeTimeline {
  type: string;
  description: string;
  timestamp: string;
  actor: string;
}

const AdminEscrowManagement: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'disputed' | 'pending' | 'released'>('all');
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowTransaction | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeNotes, setDisputeNotes] = useState('');
  const [partialAmount, setPartialAmount] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  
  const queryClient = useQueryClient();

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected for admin escrow management');
      // Join admin dashboard room
      websocket.send(JSON.stringify({ type: 'join_room', room: 'admin_dashboard' }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'escrow_dispute_resolved':
        case 'escrow_status_update':
        case 'dispute_escalated':
          // Refresh escrow data
          queryClient.invalidateQueries({ queryKey: ['admin-escrow'] });
          queryClient.invalidateQueries({ queryKey: ['escrow-analytics'] });
          
          toast({
            title: "Escrow Update",
            description: "Escrow transaction status has been updated",
          });
          break;
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [queryClient]);

  // Fetch escrow transactions
  const { data: escrowData, isLoading } = useQuery({
    queryKey: ['admin-escrow', activeFilter],
    queryFn: async () => {
      const response = await fetch(`/api/admin/escrow?status=${activeFilter}&limit=50&offset=0`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch escrow transactions');
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch escrow analytics
  const { data: analytics } = useQuery({
    queryKey: ['escrow-analytics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/escrow/analytics', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch dispute evidence
  const { data: disputeEvidence } = useQuery({
    queryKey: ['dispute-evidence', selectedEscrow?.id],
    queryFn: async () => {
      if (!selectedEscrow) return null;
      const response = await fetch(`/api/admin/escrow/${selectedEscrow.id}/evidence`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch evidence');
      return response.json();
    },
    enabled: !!selectedEscrow && selectedEscrow.status === 'DISPUTED'
  });

  // Resolve dispute mutation
  const resolveDisputeMutation = useMutation({
    mutationFn: async ({ action, notes, partialAmount }: {
      action: 'refund' | 'release' | 'partial';
      notes: string;
      partialAmount?: number;
    }) => {
      const response = await fetch('/api/admin/escrow/resolve-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          escrowId: selectedEscrow?.id,
          action,
          notes,
          partialAmount
        })
      });
      if (!response.ok) throw new Error('Failed to resolve dispute');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Dispute Resolved",
        description: "The dispute has been successfully resolved",
      });
      setShowDisputeModal(false);
      setDisputeNotes('');
      setPartialAmount('');
      queryClient.invalidateQueries({ queryKey: ['admin-escrow'] });
      queryClient.invalidateQueries({ queryKey: ['escrow-analytics'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resolve dispute",
        variant: "destructive"
      });
    }
  });

  // Release escrow mutation
  const releaseEscrowMutation = useMutation({
    mutationFn: async (escrowId: number) => {
      const response = await fetch('/api/admin/escrow/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          escrowId,
          reason: 'Admin early release'
        })
      });
      if (!response.ok) throw new Error('Failed to release escrow');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Escrow Released",
        description: "Escrow funds have been released successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['admin-escrow'] });
      queryClient.invalidateQueries({ queryKey: ['escrow-analytics'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to release escrow",
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HELD':
        return <Badge className="bg-green-100 text-green-800">ACTIVE</Badge>;
      case 'DISPUTED':
        return <Badge className="bg-red-100 text-red-800">DISPUTED</Badge>;
      case 'RELEASED_TO_SELLER':
      case 'RELEASED_TO_DRIVER':
        return <Badge className="bg-gray-100 text-gray-800">RELEASED</Badge>;
      case 'REFUNDED':
        return <Badge className="bg-blue-100 text-blue-800">REFUNDED</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">PENDING</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DISPUTED': return 'border-red-500';
      case 'HELD': return 'border-green-500';
      default: return 'border-gray-200';
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(parseFloat(amount));
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const handleResolveDispute = (action: 'refund' | 'release' | 'partial') => {
    if (!disputeNotes.trim()) {
      toast({
        title: "Error",
        description: "Please enter resolution notes",
        variant: "destructive"
      });
      return;
    }

    if (action === 'partial' && (!partialAmount || parseFloat(partialAmount) <= 0)) {
      toast({
        title: "Error",
        description: "Please enter a valid partial refund amount",
        variant: "destructive"
      });
      return;
    }

    resolveDisputeMutation.mutate({
      action,
      notes: disputeNotes,
      partialAmount: action === 'partial' ? parseFloat(partialAmount) : undefined
    });
  };

  const handleReleaseEscrow = (escrowId: number) => {
    if (window.confirm('Are you sure you want to release this escrow?')) {
      releaseEscrowMutation.mutate(escrowId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const transactions = escrowData?.data?.transactions || [];
  const totalCount = escrowData?.data?.totalCount || 0;
  const escrowBalance = escrowData?.data?.escrowBalance || '0';
  const disputedCount = escrowData?.data?.disputedCount || 0;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mini Sidebar */}
      <div className="w-16 bg-white shadow-lg flex flex-col items-center py-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-900">Escrow Management</h1>
              <p className="text-sm text-gray-600">Monitor and manage payment escrow transactions</p>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-lg font-bold text-black">
                  {formatCurrency(escrowBalance)}
                </p>
                <p className="text-xs text-gray-600">Total Escrow Balance</p>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600">{disputedCount}</p>
                <p className="text-xs text-gray-600">Pending Disputes</p>
              </div>
            </div>
          </div>
        </header>

        {/* Analytics Cards */}
        <div className="p-6 bg-white border-b">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Escrow</p>
                    <p className="text-2xl font-bold">{analytics?.data?.activeEscrowing || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Disputed</p>
                    <p className="text-2xl font-bold">{analytics?.data?.disputedCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Release</p>
                    <p className="text-2xl font-bold">{analytics?.data?.pendingReleaseCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-gray-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Released</p>
                    <p className="text-2xl font-bold">{analytics?.data?.releasedCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white px-6 py-4 border-b">
          <Tabs value={activeFilter} onValueChange={(value: any) => setActiveFilter(value)}>
            <TabsList>
              <TabsTrigger value="all">All Escrow ({totalCount})</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="disputed">Disputed</TabsTrigger>
              <TabsTrigger value="pending">Pending Release</TabsTrigger>
              <TabsTrigger value="released">Released</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Escrow List */}
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {transactions.map((escrow: EscrowTransaction) => (
              <Card key={escrow.id} className={`${getStatusColor(escrow.status)} border-l-4 ${escrow.status === 'DISPUTED' ? 'shadow-lg' : 'shadow-sm'}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-bold mr-3">ESC-{escrow.id}</h3>
                        {getStatusBadge(escrow.status)}
                        {escrow.status === 'DISPUTED' && (
                          <Badge className="ml-2 bg-red-100 text-red-800 font-bold">CRITICAL</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Customer:</strong> {escrow.buyerName} → <strong>Merchant:</strong> {escrow.sellerName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Order #{escrow.orderId.slice(-4)} • {escrow.orderTitle} • Created {formatTimeAgo(escrow.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(escrow.totalAmount)}</p>
                      <p className="text-xs text-gray-600">
                        Held since {formatTimeAgo(escrow.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      {escrow.status === 'DISPUTED' && (
                        <>
                          <span>📁 Evidence available</span>
                          <span>🔄 Last activity: {formatTimeAgo(escrow.updatedAt)}</span>
                        </>
                      )}
                      {escrow.status === 'HELD' && (
                        <>
                          <span>✅ Transaction active</span>
                          {escrow.autoReleaseAt && (
                            <span>⏰ Auto-release: {formatTimeAgo(escrow.autoReleaseAt)}</span>
                          )}
                        </>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      {escrow.status === 'DISPUTED' && (
                        <Button 
                          onClick={() => {
                            setSelectedEscrow(escrow);
                            setShowDisputeModal(true);
                          }}
                          className="bg-red-500 hover:bg-red-600"
                          size="sm"
                        >
                          Resolve Dispute
                        </Button>
                      )}
                      
                      {escrow.status === 'HELD' && (
                        <Button 
                          onClick={() => handleReleaseEscrow(escrow.id)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          Release Early
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedEscrow(escrow)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {transactions.length === 0 && (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No escrow transactions</h3>
              <p className="text-gray-600">No escrow transactions found for the selected filter.</p>
            </div>
          )}
        </main>
      </div>

      {/* Dispute Resolution Modal */}
      <Dialog open={showDisputeModal} onOpenChange={setShowDisputeModal}>
        <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dispute Resolution - ESC-{selectedEscrow?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedEscrow && (
            <div className="space-y-6">
              {/* Dispute Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Escrow ID</p>
                  <p className="text-lg font-bold">ESC-{selectedEscrow.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Amount</p>
                  <p className="text-lg font-bold">{formatCurrency(selectedEscrow.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Customer</p>
                  <p className="font-medium">{selectedEscrow.buyerName}</p>
                  <p className="text-xs text-gray-600">{selectedEscrow.buyerEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Merchant</p>
                  <p className="font-medium">{selectedEscrow.sellerName}</p>
                  <p className="text-xs text-gray-600">{selectedEscrow.sellerEmail}</p>
                </div>
              </div>

              {/* Evidence Section */}
              {disputeEvidence?.data && (
                <div>
                  <h3 className="text-lg font-bold mb-4">Evidence</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Customer Evidence</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {disputeEvidence.data.customerEvidence.map((item: any, index: number) => (
                            <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                              <FileText className="w-4 h-4 mr-2 text-gray-600" />
                              <span className="text-xs">{item.filename}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Merchant Evidence</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {disputeEvidence.data.merchantEvidence.map((item: any, index: number) => (
                            <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                              <FileText className="w-4 h-4 mr-2 text-gray-600" />
                              <span className="text-xs">{item.filename}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Resolution Actions */}
              <div>
                <h3 className="text-lg font-bold mb-4">Resolution Actions</h3>
                <Textarea
                  value={disputeNotes}
                  onChange={(e) => setDisputeNotes(e.target.value)}
                  placeholder="Enter admin notes and resolution details..."
                  className="mb-4"
                  rows={4}
                />
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => handleResolveDispute('refund')}
                      className="bg-red-500 hover:bg-red-600"
                      disabled={resolveDisputeMutation.isPending}
                    >
                      Refund Customer
                    </Button>
                    <Button 
                      onClick={() => handleResolveDispute('release')}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={resolveDisputeMutation.isPending}
                    >
                      Release to Merchant
                    </Button>
                  </div>
                  
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(e.target.value)}
                      placeholder="Partial refund amount"
                      className="flex-1 px-3 py-2 border rounded-md"
                    />
                    <Button 
                      onClick={() => handleResolveDispute('partial')}
                      className="bg-blue-500 hover:bg-blue-600"
                      disabled={resolveDisputeMutation.isPending}
                    >
                      Partial Refund
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEscrowManagement;
