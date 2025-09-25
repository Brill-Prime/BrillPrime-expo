
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  Users, 
  Filter,
  Search,
  RefreshCw,
  ArrowUp,
  MoreHorizontal,
  MessageSquare,
  Package,
  User,
  FileText
} from 'lucide-react';

interface ContentReport {
  id: number;
  contentType: 'POST' | 'COMMENT' | 'PRODUCT' | 'USER';
  contentId: string;
  reason: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reportCount: number;
  createdAt: string;
  updatedAt: string;
  reporter: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
}

interface ModerationStats {
  overview: {
    total: number;
    pending: number;
    resolved: number;
    dismissalRate: number;
  };
  activity: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  contentTypes: Record<string, number>;
  actions: Record<string, number>;
  performance: {
    avgResolutionTime: number;
    moderatorEfficiency: number;
    userSatisfactionRate: number;
  };
}

interface ModerationFilters {
  status: string;
  contentType: string;
  priority: string;
  search: string;
  startDate: string;
  endDate: string;
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

export function AdminModeration() {
  const queryClient = useQueryClient();
  const [selectedReports, setSelectedReports] = useState<number[]>([]);
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [filters, setFilters] = useState<ModerationFilters>({
    status: '',
    contentType: '',
    priority: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5000/ws');
    
    ws.onopen = () => {
      console.log('Connected to moderation WebSocket');
      ws.send(JSON.stringify({ type: 'join_admin_room', roomType: 'moderation' }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_content_report' || 
          data.type === 'content_action_taken' || 
          data.type === 'bulk_content_action' ||
          data.type === 'report_escalated') {
        // Refresh reports list
        queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
        queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
        
        // Show notification for new reports
        if (data.type === 'new_content_report') {
          showNotification(`New content report: ${data.contentType}`, 'info');
        }
      }
    };

    return () => ws.close();
  }, [queryClient]);

  // Fetch reports
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['moderation-reports', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return apiRequest('GET', `/moderation/reports?${params.toString()}`);
    },
    refetchInterval: 30000
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['moderation-stats'],
    queryFn: () => apiRequest('GET', '/moderation/stats'),
    refetchInterval: 60000
  });

  // Action mutation
  const actionMutation = useMutation({
    mutationFn: ({ reportId, action, reason }: { reportId: number; action: string; reason?: string }) =>
      apiRequest('POST', `/moderation/reports/${reportId}/action`, { action, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      showNotification('Action completed successfully', 'success');
      setSelectedReport(null);
      setShowReportDetail(false);
    },
    onError: () => {
      showNotification('Failed to complete action', 'error');
    }
  });

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: ({ reportIds, action, reason }: { reportIds: number[]; action: string; reason?: string }) =>
      apiRequest('POST', '/moderation/reports/bulk-action', { reportIds, action, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
      setSelectedReports([]);
      showNotification('Bulk action completed successfully', 'success');
    },
    onError: () => {
      showNotification('Failed to complete bulk action', 'error');
    }
  });

  // Escalate mutation
  const escalateMutation = useMutation({
    mutationFn: ({ reportId, reason, priority }: { reportId: number; reason: string; priority?: string }) =>
      apiRequest('POST', `/moderation/reports/${reportId}/escalate`, { reason, priority }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-reports'] });
      showNotification('Report escalated successfully', 'success');
    },
    onError: () => {
      showNotification('Failed to escalate report', 'error');
    }
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-md text-white z-50 ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => document.body.removeChild(notification), 3000);
  };

  const handleFilterChange = (key: keyof ModerationFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleReportSelect = (report: ContentReport) => {
    setSelectedReport(report);
    setShowReportDetail(true);
  };

  const handleBulkSelection = (reportId: number) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleAction = (action: string, reason?: string) => {
    if (!selectedReport) return;
    actionMutation.mutate({ reportId: selectedReport.id, action, reason });
  };

  const handleBulkAction = (action: string, reason?: string) => {
    if (selectedReports.length === 0) return;
    bulkActionMutation.mutate({ reportIds: selectedReports, action, reason });
  };

  const handleEscalate = (reason: string, priority = 'HIGH') => {
    if (!selectedReport) return;
    escalateMutation.mutate({ reportId: selectedReport.id, reason, priority });
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'POST': return <FileText className="h-4 w-4" />;
      case 'COMMENT': return <MessageSquare className="h-4 w-4" />;
      case 'PRODUCT': return <Package className="h-4 w-4" />;
      case 'USER': return <User className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REVIEWED': return 'bg-blue-100 text-blue-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'DISMISSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getReportAge = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const reports = reportsData?.data?.reports || [];
  const stats: ModerationStats = statsData?.data || {
    overview: { total: 0, pending: 0, resolved: 0, dismissalRate: 0 },
    activity: { today: 0, thisWeek: 0, thisMonth: 0 },
    contentTypes: {},
    actions: {},
    performance: { avgResolutionTime: 0, moderatorEfficiency: 0, userSatisfactionRate: 0 }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>
        <p className="text-gray-600">Review and manage reported content</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.overview.pending}</div>
              <div className="text-sm text-gray-600">Pending Reports</div>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.overview.resolved}</div>
              <div className="text-sm text-gray-600">Resolved Today</div>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.performance.avgResolutionTime}h</div>
              <div className="text-sm text-gray-600">Avg Resolution</div>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.performance.moderatorEfficiency}%</div>
              <div className="text-sm text-gray-600">Efficiency Rate</div>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search reports..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
            <select
              value={filters.contentType}
              onChange={(e) => handleFilterChange('contentType', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="POST">Posts</option>
              <option value="COMMENT">Comments</option>
              <option value="PRODUCT">Products</option>
              <option value="USER">Users</option>
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
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedReports.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900">
                {selectedReports.length} reports selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('REMOVE', 'Bulk content removal')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
              >
                Remove All
              </button>
              <button
                onClick={() => handleBulkAction('WARNING', 'Bulk warning issued')}
                className="px-3 py-1 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700"
              >
                Warn All
              </button>
              <button
                onClick={() => handleBulkAction('NO_ACTION', 'Bulk dismissal')}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
              >
                Dismiss All
              </button>
              <button
                onClick={() => setSelectedReports([])}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Content Reports</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['moderation-reports'] })}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-500">
                  {reports.length} reports
                </span>
              </div>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading reports...</div>
            ) : reports.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No reports found</div>
            ) : (
              reports.map((report: ContentReport) => (
                <div
                  key={report.id}
                  onClick={() => handleReportSelect(report)}
                  className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedReport?.id === report.id ? 'bg-blue-50 border-blue-200' : ''
                  } ${getPriorityColor(report.priority).includes('red') ? 'border-l-4 border-l-red-500' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleBulkSelection(report.id);
                        }}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getContentTypeIcon(report.contentType)}
                          <span className="font-medium text-sm text-gray-900">
                            {report.contentType} Report #{report.id}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(report.priority)}`}>
                            {report.priority}
                          </span>
                          {report.reportCount > 1 && (
                            <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                              {report.reportCount} reports
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                          {report.reason}
                        </p>
                        
                        <div className="flex items-center text-xs text-gray-500 space-x-3">
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {report.reporter.fullName}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {getReportAge(report.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {report.status === 'PENDING' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEscalate('Urgent escalation required', 'HIGH');
                          }}
                          className="text-xs text-orange-600 hover:text-orange-800 flex items-center"
                        >
                          <ArrowUp className="h-3 w-3 mr-1" />
                          Escalate
                        </button>
                      )}
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Report Detail Panel */}
        <div className="bg-white rounded-lg shadow">
          {selectedReport ? (
            <>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Report Details
                  </h2>
                  <button
                    onClick={() => setShowReportDetail(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Report Info */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Report Information</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Type:</span> {selectedReport.contentType}</p>
                    <p><span className="font-medium">Content ID:</span> {selectedReport.contentId}</p>
                    <p><span className="font-medium">Priority:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(selectedReport.priority)}`}>
                        {selectedReport.priority}
                      </span>
                    </p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedReport.status)}`}>
                        {selectedReport.status}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Reporter Info */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Reporter</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Name:</span> {selectedReport.reporter.fullName}</p>
                    <p><span className="font-medium">Email:</span> {selectedReport.reporter.email}</p>
                    <p><span className="font-medium">Role:</span> {selectedReport.reporter.role}</p>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Reason</h3>
                  <div className="p-3 bg-gray-50 rounded-md border text-sm">
                    {selectedReport.reason}
                  </div>
                </div>

                {/* Actions */}
                {selectedReport.status === 'PENDING' && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Take Action</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleAction('REMOVE', 'Content removed for policy violation')}
                        disabled={actionMutation.isPending}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:bg-gray-300"
                      >
                        Remove Content
                      </button>
                      <button
                        onClick={() => handleAction('WARNING', 'Warning issued to user')}
                        disabled={actionMutation.isPending}
                        className="w-full bg-orange-600 text-white px-4 py-2 rounded-md text-sm hover:bg-orange-700 disabled:bg-gray-300"
                      >
                        Issue Warning
                      </button>
                      <button
                        onClick={() => handleAction('BAN', 'User banned for repeated violations')}
                        disabled={actionMutation.isPending}
                        className="w-full bg-gray-800 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-900 disabled:bg-gray-300"
                      >
                        Ban User
                      </button>
                      <button
                        onClick={() => handleAction('NO_ACTION', 'No violation found')}
                        disabled={actionMutation.isPending}
                        className="w-full bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 disabled:bg-gray-300"
                      >
                        No Action Needed
                      </button>
                    </div>
                  </div>
                )}

                {/* Escalation */}
                {selectedReport.status === 'PENDING' && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Escalate Report</h3>
                    <button
                      onClick={() => handleEscalate('Requires senior review', 'HIGH')}
                      disabled={escalateMutation.isPending}
                      className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md text-sm hover:bg-yellow-700 disabled:bg-gray-300"
                    >
                      Escalate to Senior Moderator
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-gray-400" />
              </div>
              <p>Select a report to view details and take action</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
