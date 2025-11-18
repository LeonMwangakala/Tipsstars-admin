import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import PageMeta from '../../components/common/PageMeta';
import Badge from '../../components/ui/badge/Badge';
import Button from '../../components/ui/button/Button';
import Input from '../../components/form/input/InputField';
import TextArea from '../../components/form/input/TextArea';

interface WithdrawalRequest {
  id: number;
  tipster: {
    id: number;
    name: string;
    phone_number: string;
  };
  amount: number;
  status: 'pending' | 'paid' | 'rejected' | 'cancelled';
  requested_at: string;
  paid_at?: string;
  admin?: {
    id: number;
    name: string;
  };
  notes?: string;
  created_at: string;
}

interface WithdrawalSummary {
  total_pending: number;
  total_paid: number;
  total_rejected: number;
  total_amount_pending: number;
  total_amount_paid: number;
}

type StatusTabType = 'all' | 'pending' | 'paid' | 'rejected' | 'cancelled';

const WithdrawalsList: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [summary, setSummary] = useState<WithdrawalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusTabType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    date_from: '',
    date_to: '',
  });
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [actionModal, setActionModal] = useState<'paid' | 'reject' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchWithdrawals = async (page: number = currentPage, status?: string) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: page.toString(),
      });

      // Add status filter if not 'all'
      if (status && status !== 'all') {
        params.append('status', status);
      }

      // Add other filters
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.date_from) {
        params.append('date_from', filters.date_from);
      }
      if (filters.date_to) {
        params.append('date_to', filters.date_to);
      }

      const response = await apiService.getWithdrawals(params.toString());
      setWithdrawals(response.data);
      setSummary(response.summary);
      setPagination(response.pagination);
      setTotalPages(response.pagination.last_page);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch withdrawals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset to page 1 when tab or search changes
    setCurrentPage(1);
  }, [activeTab, filters.search, filters.date_from, filters.date_to]);

  useEffect(() => {
    fetchWithdrawals(currentPage, activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, activeTab, filters.search, filters.date_from, filters.date_to]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setError('');
    setSuccess('');
  };

  const handleTabChange = (tab: StatusTabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setError('');
    setSuccess('');
  };

  const handleAction = async () => {
    if (!selectedWithdrawal || !actionModal) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (actionModal === 'paid') {
        await apiService.markWithdrawalPaid(selectedWithdrawal.id, actionNotes || undefined);
        setSuccess('Withdrawal marked as paid successfully!');
      } else {
        if (!actionNotes.trim()) {
          setError('Please provide a reason for rejection.');
          return;
        }
        await apiService.rejectWithdrawal(selectedWithdrawal.id, actionNotes.trim());
        setSuccess('Withdrawal rejected successfully!');
      }
      
      setActionModal(null);
      setSelectedWithdrawal(null);
      setActionNotes('');
      setError('');
      // Refresh the list to show updated status
      fetchWithdrawals(currentPage, activeTab);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to process withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colorMap = {
      pending: 'warning' as const,
      paid: 'success' as const,
      rejected: 'error' as const,
      cancelled: 'light' as const,
    };
    return <Badge color={colorMap[status as keyof typeof colorMap]}>{status}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <PageMeta title="Withdrawal Requests" description="Manage tipster withdrawal requests" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Withdrawal Requests
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage tipster withdrawal requests and payments
            </p>
          </div>
          <Button
            onClick={() => window.location.href = '/withdrawal-stats'}
            className="flex items-center gap-2"
          >
            View Statistics
          </Button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
            <p className="text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400">Pending Requests</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_pending}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400">Paid Requests</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.total_paid}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400">Rejected Requests</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.total_rejected}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400">Pending Amount</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatCurrency(summary.total_amount_pending)}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Paid</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary.total_amount_paid)}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'all' as StatusTabType, label: 'All', count: activeTab === 'all' ? pagination.total : null },
              { id: 'pending' as StatusTabType, label: 'Pending', count: activeTab === 'pending' ? pagination.total : null },
              { id: 'paid' as StatusTabType, label: 'Paid', count: activeTab === 'paid' ? pagination.total : null },
              { id: 'rejected' as StatusTabType, label: 'Rejected', count: activeTab === 'rejected' ? pagination.total : null },
              { id: 'cancelled' as StatusTabType, label: 'Cancelled', count: activeTab === 'cancelled' ? pagination.total : null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <Input
                placeholder="Tipster name or phone"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date From</label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date To</label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Withdrawal Requests</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
              <p className="mt-2">Loading...</p>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              No withdrawal requests found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tipster</th>
                    <th className="text-left p-2 text-sm font-medium text-gray-700 dark:text-gray-300">Amount</th>
                    <th className="text-left p-2 text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                    <th className="text-left p-2 text-sm font-medium text-gray-700 dark:text-gray-300">Requested</th>
                    <th className="text-left p-2 text-sm font-medium text-gray-700 dark:text-gray-300">Processed By</th>
                    <th className="text-left p-2 text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{withdrawal.tipster.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{withdrawal.tipster.phone_number}</div>
                        </div>
                      </td>
                      <td className="p-2 font-medium text-gray-900 dark:text-white">
                        {formatCurrency(withdrawal.amount)}
                      </td>
                      <td className="p-2">
                        {getStatusBadge(withdrawal.status)}
                      </td>
                      <td className="p-2 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(withdrawal.requested_at)}
                      </td>
                      <td className="p-2 text-sm text-gray-600 dark:text-gray-400">
                        {withdrawal.admin?.name || '-'}
                      </td>
                      <td className="p-2">
                        {withdrawal.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setActionModal('paid');
                                setActionNotes('');
                              }}
                            >
                              Mark Paid
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setActionModal('reject');
                                setActionNotes('');
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="flex justify-center items-center mt-6 gap-2">
              <Button
                variant="outline"
                disabled={pagination.current_page === 1 || loading}
                onClick={() => setCurrentPage(pagination.current_page - 1)}
              >
                Previous
              </Button>
              <span className="py-2 px-4 text-sm text-gray-600 dark:text-gray-400">
                {pagination.total > 0 && (
                  <>Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} withdrawals</>
                )}
              </span>
              <Button
                variant="outline"
                disabled={pagination.current_page === pagination.last_page || loading}
                onClick={() => setCurrentPage(pagination.current_page + 1)}
              >
                Next
              </Button>
            </div>
          )}
          {pagination.total > 0 && pagination.last_page <= 1 && (
            <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
              Showing {pagination.total} withdrawal{pagination.total !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Action Modal */}
        {actionModal && selectedWithdrawal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                {actionModal === 'paid' ? 'Mark as Paid' : 'Reject'} Withdrawal Request
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <strong>Tipster:</strong> {selectedWithdrawal.tipster.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <strong>Amount:</strong> {formatCurrency(selectedWithdrawal.amount)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Requested:</strong> {formatDate(selectedWithdrawal.requested_at)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {actionModal === 'paid' ? 'Payment Notes (Optional)' : 'Rejection Reason (Required)'}
                  </label>
                  <TextArea
                    placeholder={actionModal === 'paid' ? 'Add payment notes...' : 'Please provide a reason for rejection...'}
                    value={actionNotes}
                    onChange={(value) => setActionNotes(value)}
                    rows={4}
                    required={actionModal === 'reject'}
                  />
                </div>
                {error && (
                  <div className="p-3 text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setActionModal(null);
                      setSelectedWithdrawal(null);
                      setActionNotes('');
                      setError('');
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant={actionModal === 'paid' ? 'success' : 'danger'}
                    onClick={(e) => {
                      e.preventDefault();
                      handleAction();
                    }}
                    disabled={loading || (actionModal === 'reject' && !actionNotes.trim())}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      actionModal === 'paid' ? 'Mark as Paid' : 'Reject'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default WithdrawalsList; 