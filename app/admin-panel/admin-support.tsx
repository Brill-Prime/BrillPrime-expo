
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Clock, CheckCircle, AlertTriangle, User, Phone, Mail, Calendar, ArrowUp, ArrowDown, Filter, Search, RefreshCw } from 'lucide-react';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId?: number;
  userRole: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  assignedTo?: number;
  adminNotes?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  user?: {
    fullName: string;
    email: string;
  };
}

interface TicketFilters {
  status: string;
  priority: string;
  assignedTo: string;
  search: string;
}

interface AdminUser {
  id: number;
  fullName: string;
  email: string;
}

const API_BASE = 'http://localhost:5000/api/admin';

async function apiRequest(method: string, endpoint: string, data?: any) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: data ? JSON.stringify(data) : undefined
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`);
  }

  return response.json();
}

export function AdminSupport() {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [filters, setFilters] = useState<TicketFilters>({
    status: '',
    priority: '',
    assignedTo: '',
    search: ''
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000/ws');
    
    ws.onopen = () => {
      console.log('Connected to WebSocket');
      ws.send(JSON.stringify({ type: 'join_admin_room', roomType: 'support' }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_support_ticket' || 
          data.type === 'ticket_status_updated' || 
          data.type === 'ticket_assigned') {
        // Refresh tickets list
        queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
        
        // Show notification for new tickets
        if (data.type === 'new_support_ticket') {
          showNotification(`New support ticket: ${data.ticket.subject}`, 'info');
        }
      }
    };

    return () => ws.close();
  }, [queryClient]);

  // Fetch support tickets
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['support-tickets', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return apiRequest('GET', `/support/tickets?${params.toString()}`);
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch admin users for assignment
  const { data: adminUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiRequest('GET', '/users?role=admin')
  });

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: ({ ticketId, updates }: { ticketId: string; updates: any }) =>
      apiRequest('PATCH', `/support/tickets/${ticketId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      showNotification('Ticket updated successfully', 'success');
    },
    onError: () => {
      showNotification('Failed to update ticket', 'error');
    }
  });

  // Respond to ticket mutation
  const respondToTicketMutation = useMutation({
    mutationFn: ({ ticketId, response, status }: { ticketId: string; response: string; status?: string }) =>
      apiRequest('POST', `/support/tickets/${ticketId}/respond`, { response, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setResponse('');
      setNewStatus('');
      showNotification('Response sent successfully', 'success');
    },
    onError: () => {
      showNotification('Failed to send response', 'error');
    }
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    // Simple notification implementation
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-md text-white z-50 ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => document.body.removeChild(notification), 3000);
  };

  const handleFilterChange = (key: keyof TicketFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleTicketSelect = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowTicketDetail(true);
    setNewStatus(ticket.status);
  };

  const handleAssignTicket = (ticketId: string, adminId: number) => {
    updateTicketMutation.mutate({
      ticketId,
      updates: { assignedTo: adminId, status: 'IN_PROGRESS' }
    });
  };

  const handleStatusChange = (ticketId: string, status: string) => {
    updateTicketMutation.mutate({
      ticketId,
      updates: { status }
    });
  };

  const handleSendResponse = () => {
    if (!selectedTicket || !response.trim()) return;
    
    respondToTicketMutation.mutate({
      ticketId: selectedTicket.id,
      response,
      status: newStatus !== selectedTicket.status ? newStatus : undefined
    });
  };

  const handleEscalateTicket = (ticketId: string, priority: string) => {
    updateTicketMutation.mutate({
      ticketId,
      updates: { priority, status: 'IN_PROGRESS' }
    });
  };

  const handleBulkAssign = (ticketIds: string[], adminId: number) => {
    ticketIds.forEach(ticketId => {
      updateTicketMutation.mutate({
        ticketId,
        updates: { assignedTo: adminId, status: 'IN_PROGRESS' }
      });
    });
  };

  const getTicketAge = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getUrgencyColor = (ticket: SupportTicket) => {
    const age = new Date().getTime() - new Date(ticket.createdAt).getTime();
    const hoursOld = age / (1000 * 60 * 60);
    
    if (ticket.priority === 'URGENT' || hoursOld > 48) return 'border-red-500 bg-red-50';
    if (ticket.priority === 'HIGH' || hoursOld > 24) return 'border-orange-500 bg-orange-50';
    return 'border-gray-200 bg-white';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'NORMAL': return 'bg-blue-100 text-blue-800';
      case 'LOW': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tickets = ticketsData?.data?.items || [];
  const stats = {
    total: tickets.length,
    open: tickets.filter((t: SupportTicket) => t.status === 'OPEN').length,
    inProgress: tickets.filter((t: SupportTicket) => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter((t: SupportTicket) => t.status === 'RESOLVED').length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support Ticket Management</h1>
        <p className="text-gray-600">Manage and respond to customer support requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Tickets</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{stats.open}</div>
          <div className="text-sm text-gray-600">Open Tickets</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          <div className="text-sm text-gray-600">Resolved</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search tickets..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
            <select
              value={filters.assignedTo}
              onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {adminUsers?.data?.map((admin: AdminUser) => (
                <option key={admin.id} value={admin.id}>{admin.fullName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Support Tickets</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['support-tickets'] })}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-500">
                  {tickets.length} tickets
                </span>
              </div>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No tickets found</div>
            ) : (
              tickets.map((ticket: SupportTicket) => (
                <div
                  key={ticket.id}
                  onClick={() => handleTicketSelect(ticket)}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedTicket?.id === ticket.id ? 'bg-blue-50 border-blue-200' : getUrgencyColor(ticket)
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm text-gray-900">
                          {ticket.ticketNumber}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                        {ticket.assignedTo && (
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            Assigned
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 text-sm mb-1">
                        {ticket.subject}
                      </h3>
                      <div className="flex items-center text-xs text-gray-600 mb-2 space-x-3">
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {ticket.name}
                        </span>
                        <span className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {ticket.email}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {getTicketAge(ticket.createdAt)} ago
                        </p>
                        {ticket.status === 'OPEN' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEscalateTicket(ticket.id, 'HIGH');
                            }}
                            className="text-xs text-orange-600 hover:text-orange-800 flex items-center"
                          >
                            <ArrowUp className="h-3 w-3 mr-1" />
                            Escalate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        <div className="bg-white rounded-lg shadow">
          {selectedTicket ? (
            <>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Ticket Details
                  </h2>
                  <button
                    onClick={() => setShowTicketDetail(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {/* Ticket Info */}
                <div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Ticket Number:</span>
                      <p>{selectedTicket.ticketNumber}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Priority:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Assign To:</span>
                      <select
                        value={selectedTicket.assignedTo || ''}
                        onChange={(e) => handleAssignTicket(selectedTicket.id, parseInt(e.target.value))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                      >
                        <option value="">Unassigned</option>
                        {adminUsers?.data?.map((admin: AdminUser) => (
                          <option key={admin.id} value={admin.id}>{admin.fullName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Name:</span> {selectedTicket.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedTicket.email}</p>
                    <p><span className="font-medium">Role:</span> {selectedTicket.userRole}</p>
                  </div>
                </div>

                {/* Subject and Message */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Issue Details</h3>
                  <div className="text-sm space-y-2">
                    <p><span className="font-medium">Subject:</span> {selectedTicket.subject}</p>
                    <div>
                      <span className="font-medium">Message:</span>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                        {selectedTicket.message}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Previous Admin Notes */}
                {selectedTicket.adminNotes && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Previous Notes</h3>
                    <div className="p-3 bg-blue-50 rounded-md border text-sm">
                      {selectedTicket.adminNotes}
                    </div>
                  </div>
                )}

                {/* Response Section */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Send Response</h3>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="Type your response to the customer..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleSendResponse}
                        disabled={!response.trim() || respondToTicketMutation.isPending}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-300"
                      >
                        {respondToTicketMutation.isPending ? 'Sending...' : 'Send Response'}
                      </button>
                      {newStatus !== selectedTicket.status && (
                        <button
                          onClick={() => handleStatusChange(selectedTicket.id, newStatus)}
                          className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
                        >
                          Update Status
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
                </svg>
              </div>
              <p>Select a ticket to view details and respond</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
