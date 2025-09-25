import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Eye, Flag, Clock, TrendingUp, Users, DollarSign, Activity, Search, Filter, RefreshCw, Ban, CheckCircle, X, Play, Pause, MoreHorizontal } from 'lucide-react';
import io from 'socket.io-client';

interface FraudAlert {
  id: string;
  userId: number;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  title: string;
  description: string;
  riskScore: number;
  detectedAt: string;
  resolvedAt?: string;
  metadata: {
    transactionId?: string;
    ipAddress?: string;
    deviceFingerprint?: string;
    pattern?: string;
    relatedAlerts?: number;
  };
  user: {
    id: number;
    userId: string;
    fullName: string;
    email: string;
    role: string;
    accountStatus: string;
  };
}

interface FraudStats {
  totalAlerts: number;
  criticalAlerts: number;
  resolvedToday: number;
  falsePositiveRate: number;
  avgResolutionTime: number;
  blockedTransactions: number;
  flaggedAccounts: number;
  totalRiskReduction: number;
}

interface SuspiciousActivity {
  id: string;
  userId: number;
  activityType: string;
  description: string;
  riskIndicators: string[];
  timestamp: string;
  ipAddress: string;
  deviceInfo: string;
  user: {
    fullName: string;
    email: string;
    userId: string;
  };
}

export function AdminFraud() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [activities, setActivities] = useState<SuspiciousActivity[]>([]);
  const [stats, setStats] = useState<FraudStats>({
    totalAlerts: 0,
    criticalAlerts: 0,
    resolvedToday: 0,
    falsePositiveRate: 0,
    avgResolutionTime: 0,
    blockedTransactions: 0,
    flaggedAccounts: 0,
    totalRiskReduction: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    severity: '',
    status: '',
    type: '',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Real-time updates via WebSocket
  useEffect(() => {
    const newSocket = io('ws://localhost:5000', {
      path: '/ws',
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Fraud dashboard connected');
      newSocket.emit('join_admin_room', 'fraud');
    });

    newSocket.on('fraud_alert', (data) => {
      if (data.type === 'fraud_alert') {
        setAlerts(prev => [data.alert, ...prev]);
        fetchStats();
      }
    });

    newSocket.on('suspicious_activity', (data) => {
      if (data.type === 'suspicious_activity') {
        setActivities(prev => [data.activity, ...prev.slice(0, 49)]);
      }
    });

    newSocket.on('fraud_alert_updated', (data) => {
      if (data.type === 'fraud_alert_updated') {
        fetchFraudData();
      }
    });

    return () => newSocket.disconnect();
  }, []);

  // Fetch fraud data
  const fetchFraudData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
      });

      const [alertsRes, activitiesRes, statsRes] = await Promise.all([
        fetch(`/api/admin/fraud/alerts?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/admin/fraud/activities', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/admin/fraud/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!alertsRes.ok || !activitiesRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch fraud data');
      }

      const [alertsData, activitiesData, statsData] = await Promise.all([
        alertsRes.json(),
        activitiesRes.json(),  
        statsRes.json()
      ]);

      setAlerts(alertsData.data);
      setActivities(activitiesData.data);
      setStats(statsData.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch fraud data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/fraud/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchFraudData();
  }, [filters]);

  // Handle alert actions
  const handleAlertAction = async (alertId: string, action: string, reason?: string) => {
    try {
      setProcessingAction(`${action}-${alertId}`);
      
      const response = await fetch(`/api/admin/fraud/alerts/${alertId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} alert`);
      }

      // Refresh alerts
      fetchFraudData();
      console.log(`Alert ${action}ed successfully`);
    } catch (err) {
      console.error(`Failed to ${action} alert:`, err);
    } finally {
      setProcessingAction(null);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string, reason?: string) => {
    if (selectedAlerts.length === 0) return;

    try {
      setProcessingAction(`bulk-${action}`);
      
      const response = await fetch('/api/admin/fraud/alerts/bulk-action', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alertIds: selectedAlerts,
          action,
          reason
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} alerts`);
      }

      setSelectedAlerts([]);
      fetchFraudData();
      console.log(`Bulk ${action} completed successfully`);
    } catch (err) {
      console.error(`Failed to ${action} alerts:`, err);
    } finally {
      setProcessingAction(null);
    }
  };

  // Flag/unflag user account
  const handleAccountFlag = async (userId: number, action: 'flag' | 'unflag', reason?: string) => {
    try {
      const response = await fetch(`/api/admin/fraud/users/${userId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }

      fetchFraudData();
      console.log(`User ${action}ged successfully`);
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-red-100 text-red-800';
      case 'INVESTIGATING': return 'bg-blue-100 text-blue-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'FALSE_POSITIVE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-red-600" />
            Fraud Detection Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">Monitor and manage suspicious activities in real-time</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            onClick={fetchFraudData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-red-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Alerts</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalAlerts.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-orange-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Critical Alerts</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.criticalAlerts.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-green-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Resolved Today</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.resolvedToday.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-blue-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Flagged Accounts</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.flaggedAccounts.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INVESTIGATING">Investigating</option>
                <option value="RESOLVED">Resolved</option>
                <option value="FALSE_POSITIVE">False Positive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              >
                <option value="">All Types</option>
                <option value="SUSPICIOUS_LOGIN">Suspicious Login</option>
                <option value="UNUSUAL_TRANSACTION">Unusual Transaction</option>
                <option value="VELOCITY_CHECK">Velocity Check</option>
                <option value="DEVICE_MISMATCH">Device Mismatch</option>
                <option value="LOCATION_ANOMALY">Location Anomaly</option>
                <option value="PATTERN_MATCHING">Pattern Matching</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() => setFilters({
                severity: '',
                status: '',
                type: '',
                search: '',
                startDate: '',
                endDate: ''
              })}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium text-red-800">
                {selectedAlerts.length} alert(s) selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('investigate')}
                disabled={!!processingAction}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50"
              >
                <Play className="h-4 w-4 mr-1" />
                Investigate
              </button>
              <button
                onClick={() => handleBulkAction('resolve', 'Bulk resolution')}
                disabled={!!processingAction}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Resolve
              </button>
              <button
                onClick={() => handleBulkAction('false_positive', 'Marked as false positive')}
                disabled={!!processingAction}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              >
                <X className="h-4 w-4 mr-1" />
                False Positive
              </button>
              <button
                onClick={() => setSelectedAlerts([])}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear selection
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fraud Alerts */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Fraud Alerts</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No fraud alerts found</p>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {alerts.map((alert) => (
                    <li key={alert.id} className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedAlerts.includes(alert.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAlerts(prev => [...prev, alert.id]);
                            } else {
                              setSelectedAlerts(prev => prev.filter(id => id !== alert.id));
                            }
                          }}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                                {alert.severity}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                                {alert.status}
                              </span>
                              <span className="text-xs text-gray-500">
                                Risk Score: {alert.riskScore}%
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleAlertAction(alert.id, 'investigate')}
                                disabled={processingAction === `investigate-${alert.id}`}
                                className="p-1 text-blue-400 hover:text-blue-600 disabled:opacity-50"
                                title="Investigate"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleAccountFlag(alert.userId, 'flag', 'Flagged due to fraud alert')}
                                className="p-1 text-orange-400 hover:text-orange-600"
                                title="Flag Account"
                              >
                                <Flag className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleAlertAction(alert.id, 'resolve', 'Manual resolution')}
                                disabled={processingAction === `resolve-${alert.id}`}
                                className="p-1 text-green-400 hover:text-green-600 disabled:opacity-50"
                                title="Resolve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-gray-600">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                            <p className="text-sm text-gray-600">{alert.description}</p>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span>User: {alert.user.fullName}</span>
                              <span>({alert.user.userId})</span>
                              <span>{formatDate(alert.detectedAt)}</span>
                            </div>
                            {alert.metadata.relatedAlerts && (
                              <span className="text-red-600 font-medium">
                                +{alert.metadata.relatedAlerts} related
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Activity Monitor */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-500" />
                Live Activity Monitor
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {activities.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No recent activities</p>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {activities.map((activity) => (
                    <li key={activity.id} className="px-6 py-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-red-500 rounded-full mt-2 animate-pulse"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.activityType}</p>
                          <p className="text-xs text-gray-600">{activity.description}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {activity.riskIndicators.map((indicator, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800"
                              >
                                {indicator}
                              </span>
                            ))}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            <div>{activity.user.fullName}</div>
                            <div>{formatDate(activity.timestamp)}</div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}