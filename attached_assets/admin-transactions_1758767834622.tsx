
import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, RefreshCw, DollarSign, AlertTriangle, CheckCircle, Clock, MoreHorizontal, Eye, RotateCcw, Play, Pause, X } from 'lucide-react';
import { TransactionDetailModal } from '../components/transaction-detail-modal';
import { RefundProcessingModal } from '../components/refund-processing-modal';

interface Transaction {
  id: string;
  userId: number;
  recipientId?: number;
  type: string;
  status: string;
  amount: string;
  fee: string;
  netAmount: string;
  currency: string;
  description?: string;
  paystackReference?: string;
  channel?: string;
  initiatedAt: string;
  completedAt?: string;
  failedAt?: string;
  metadata?: any;
  user?: {
    id: number;
    userId: string;
    fullName: string;
    email: string;
    role: string;
  };
}

interface TransactionStats {
  successTotal: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
}

interface FilterOptions {
  status: string;
  type: string;
  channel: string;
  minAmount: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
  search: string;
}

export function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    successTotal: 0,
    successCount: 0,
    failedCount: 0,
    pendingCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    status: '',
    type: '',
    channel: '',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState<string | null>(null);
  const [refundingTransaction, setRefundingTransaction] = useState<Transaction | null>(null);

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
      });

      const response = await fetch(`/api/admin/transactions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.data.items);
      setStats(data.data.statistics);
      setPagination(prev => ({
        ...prev,
        total: data.data.total,
        totalPages: data.data.totalPages
      }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, filters]);

  // Handle transaction actions
  const handleTransactionAction = async (transactionId: string, action: string, data?: any) => {
    try {
      setProcessingAction(`${action}-${transactionId}`);
      
      const response = await fetch(`/api/admin/transactions/${transactionId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data || {})
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} transaction`);
      }

      // Refresh transactions list
      fetchTransactions();
      
      // Show success message (you can implement a toast system)
      console.log(`Transaction ${action}ed successfully`);
    } catch (err) {
      console.error(`Failed to ${action} transaction:`, err);
    } finally {
      setProcessingAction(null);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string, reason?: string) => {
    if (selectedTransactions.length === 0) return;

    try {
      setProcessingAction(`bulk-${action}`);
      
      const response = await fetch('/api/admin/transactions/bulk-action', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactionIds: selectedTransactions,
          action,
          reason
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} transactions`);
      }

      // Clear selection and refresh
      setSelectedTransactions([]);
      setShowBulkActions(false);
      fetchTransactions();
      
      console.log(`Bulk ${action} completed successfully`);
    } catch (err) {
      console.error(`Failed to ${action} transactions:`, err);
    } finally {
      setProcessingAction(null);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusConfig = (status: string) => {
      switch (status.toUpperCase()) {
        case 'SUCCESS':
          return { color: 'bg-green-100 text-green-800', icon: CheckCircle };
        case 'PENDING':
          return { color: 'bg-yellow-100 text-yellow-800', icon: Clock };
        case 'PROCESSING':
          return { color: 'bg-blue-100 text-blue-800', icon: RefreshCw };
        case 'FAILED':
          return { color: 'bg-red-100 text-red-800', icon: X };
        case 'CANCELLED':
          return { color: 'bg-gray-100 text-gray-800', icon: X };
        case 'REVERSED':
          return { color: 'bg-purple-100 text-purple-800', icon: RotateCcw };
        default:
          return { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle };
      }
    };

    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </span>
    );
  };

  // Format currency
  const formatCurrency = (amount: string, currency: string = 'NGN') => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency === 'NGN' ? 'NGN' : 'USD',
      minimumFractionDigits: 2
    }).format(numAmount);
  };

  // Format date
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
          <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>
          <p className="text-sm text-gray-600 mt-1">Monitor and manage all financial transactions</p>
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
            onClick={fetchTransactions}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Success</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(stats.successTotal.toString())}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Successful</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.successCount.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pendingCount.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Failed</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.failedCount.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REVERSED">Reversed</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Types</option>
                <option value="DEPOSIT">Deposit</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="TRANSFER">Transfer</option>
                <option value="PAYMENT">Payment</option>
                <option value="REFUND">Refund</option>
                <option value="COMMISSION">Commission</option>
                <option value="ESCROW_HOLD">Escrow Hold</option>
                <option value="ESCROW_RELEASE">Escrow Release</option>
              </select>
            </div>

            {/* Channel Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
              <select
                value={filters.channel}
                onChange={(e) => setFilters(prev => ({ ...prev, channel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Channels</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
                <option value="ussd">USSD</option>
                <option value="qr">QR Code</option>
                <option value="wallet">Wallet</option>
              </select>
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
              <input
                type="number"
                placeholder="0"
                value={filters.minAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
              <input
                type="number"
                placeholder="999999999"
                value={filters.maxAmount}
                onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setFilters({
                status: '',
                type: '',
                channel: '',
                minAmount: '',
                maxAmount: '',
                startDate: '',
                endDate: '',
                search: ''
              })}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedTransactions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium text-blue-800">
                {selectedTransactions.length} transaction(s) selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('hold', 'Bulk hold operation')}
                disabled={!!processingAction}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 disabled:opacity-50"
              >
                <Pause className="h-4 w-4 mr-1" />
                Hold
              </button>
              <button
                onClick={() => handleBulkAction('release')}
                disabled={!!processingAction}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 disabled:opacity-50"
              >
                <Play className="h-4 w-4 mr-1" />
                Release
              </button>
              <button
                onClick={() => handleBulkAction('cancel', 'Bulk cancellation')}
                disabled={!!processingAction}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 disabled:opacity-50"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </button>
              <button
                onClick={() => setSelectedTransactions([])}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-gray-500">{error}</p>
              <button
                onClick={fetchTransactions}
                className="mt-2 text-blue-600 hover:text-blue-500"
              >
                Try again
              </button>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <DollarSign className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No transactions found</p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <li key={transaction.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.includes(transaction.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTransactions(prev => [...prev, transaction.id]);
                        } else {
                          setSelectedTransactions(prev => prev.filter(id => id !== transaction.id));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-4"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {transaction.user?.fullName || 'Unknown User'}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {transaction.user?.email} • {transaction.user?.userId}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(transaction.amount, transaction.currency)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Fee: {formatCurrency(transaction.fee, transaction.currency)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <StatusBadge status={transaction.status} />
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {transaction.type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>{formatDate(transaction.initiatedAt)}</span>
                          {transaction.channel && (
                            <span className="capitalize">via {transaction.channel}</span>
                          )}
                          {transaction.paystackReference && (
                            <span className="font-mono text-xs">
                              Ref: {transaction.paystackReference}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setSelectedTransactionDetail(transaction.id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {/* Transaction Actions */}
                          {transaction.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleTransactionAction(transaction.id, 'hold', { reason: 'Manual hold' })}
                                disabled={processingAction === `hold-${transaction.id}`}
                                className="p-1 text-yellow-400 hover:text-yellow-600 disabled:opacity-50"
                                title="Hold Transaction"
                              >
                                <Pause className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleTransactionAction(transaction.id, 'release')}
                                disabled={processingAction === `release-${transaction.id}`}
                                className="p-1 text-green-400 hover:text-green-600 disabled:opacity-50"
                                title="Release Transaction"
                              >
                                <Play className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          
                          {transaction.status === 'PROCESSING' && (
                            <button
                              onClick={() => handleTransactionAction(transaction.id, 'release')}
                              disabled={processingAction === `release-${transaction.id}`}
                              className="p-1 text-green-400 hover:text-green-600 disabled:opacity-50"
                              title="Release Transaction"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          )}
                          
                          {(transaction.status === 'SUCCESS' || transaction.status === 'COMPLETED') && (
                            <button
                              onClick={() => setRefundingTransaction(transaction)}
                              disabled={processingAction === `refund-${transaction.id}`}
                              className="p-1 text-purple-400 hover:text-purple-600 disabled:opacity-50"
                              title="Refund Transaction"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {transaction.description && (
                        <div className="mt-1">
                          <p className="text-xs text-gray-600">{transaction.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{pagination.total}</span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.page === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                      disabled={pagination.page >= pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={!!selectedTransactionDetail}
        onClose={() => setSelectedTransactionDetail(null)}
        transactionId={selectedTransactionDetail || ''}
      />

      {/* Refund Processing Modal */}
      <RefundProcessingModal
        isOpen={!!refundingTransaction}
        onClose={() => setRefundingTransaction(null)}
        transaction={refundingTransaction || {} as Transaction}
        onRefundProcess={async (refundData) => {
          if (refundingTransaction) {
            await handleTransactionAction(refundingTransaction.id, 'refund', refundData);
          }
        }}
      />
    </div>
  );
}
