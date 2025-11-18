import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import PageMeta from '../../components/common/PageMeta';
import Badge from '../../components/ui/badge/Badge';
import Button from '../../components/ui/button/Button';
import Input from '../../components/form/input/InputField';
import ComponentCard from '../../components/common/ComponentCard';

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

const WithdrawalsList: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [summary, setSummary] = useState<WithdrawalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    date_from: '',
    date_to: '',
  });
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [actionModal, setActionModal] = useState<'paid' | 'reject' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        ...filters,
      });

      const response = await apiService.getWithdrawals(params.toString());
      setWithdrawals(response.data);
      setSummary(response.summary);
      setTotalPages(response.pagination.last_page);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch withdrawals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [currentPage, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleAction = async () => {
    if (!selectedWithdrawal || !actionModal) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (actionModal === 'paid') {
        await apiService.markWithdrawalPaid(selectedWithdrawal.id, actionNotes);
        setSuccess('Withdrawal marked as paid successfully!');
      } else {
        await apiService.rejectWithdrawal(selectedWithdrawal.id, actionNotes);
        setSuccess('Withdrawal rejected successfully!');
      }
      
      setActionModal(null);
      setSelectedWithdrawal(null);
      setActionNotes('');
      fetchWithdrawals();
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
        <h1 className="text-2xl font-bold">Withdrawal Requests</h1>
        <button 
          onClick={() => window.location.href = '/withdrawal-stats'}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Statistics
        </button>
      </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="text-sm text-gray-600">Pending Requests</div>
              <div className="text-2xl font-bold">{summary.total_pending}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="text-sm text-gray-600">Paid Requests</div>
              <div className="text-2xl font-bold text-green-600">{summary.total_paid}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="text-sm text-gray-600">Rejected Requests</div>
              <div className="text-2xl font-bold text-red-600">{summary.total_rejected}</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="text-sm text-gray-600">Pending Amount</div>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(summary.total_amount_pending)}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="text-sm text-gray-600">Total Paid</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.total_amount_paid)}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={filters.status} 
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <Input
                placeholder="Tipster name or phone"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Withdrawal Requests</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Tipster</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Requested</th>
                    <th className="text-left p-2">Processed By</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{withdrawal.tipster.name}</div>
                          <div className="text-sm text-gray-500">{withdrawal.tipster.phone_number}</div>
                        </div>
                      </td>
                      <td className="p-2 font-medium">
                        {formatCurrency(withdrawal.amount)}
                      </td>
                      <td className="p-2">
                        {getStatusBadge(withdrawal.status)}
                      </td>
                      <td className="p-2 text-sm">
                        {formatDate(withdrawal.requested_at)}
                      </td>
                      <td className="p-2 text-sm">
                        {withdrawal.admin?.name || '-'}
                      </td>
                      <td className="p-2">
                        {withdrawal.status === 'pending' && (
                          <div className="space-x-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setActionModal('paid');
                              }}
                            >
                              Mark Paid
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setActionModal('reject');
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
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 space-x-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="py-2 px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Action Modal */}
        {actionModal && selectedWithdrawal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {actionModal === 'paid' ? 'Mark as Paid' : 'Reject'} Withdrawal Request
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={actionModal === 'paid' ? 'Payment notes (optional)' : 'Rejection reason (required)'}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    required={actionModal === 'reject'}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActionModal(null);
                      setSelectedWithdrawal(null);
                      setActionNotes('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAction}
                    disabled={actionModal === 'reject' && !actionNotes.trim()}
                  >
                    {actionModal === 'paid' ? 'Mark as Paid' : 'Reject'}
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