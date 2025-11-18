import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import PageMeta from '../../components/common/PageMeta';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';


interface WithdrawalStats {
  stats: {
    total_requests: number;
    pending_requests: number;
    paid_requests: number;
    rejected_requests: number;
    cancelled_requests: number;
    total_amount_requested: number;
    total_amount_paid: number;
    total_amount_pending: number;
  };
  monthly_trends: Array<{
    year: number;
    month: number;
    count: number;
    total_amount: number;
  }>;
  top_tipsters: Array<{
    tipster_id: number;
    request_count: number;
    total_amount: number;
    tipster: {
      id: number;
      name: string;
      phone_number: string;
    };
  }>;
}

const WithdrawalStats: React.FC = () => {
  const [stats, setStats] = useState<WithdrawalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiService.getWithdrawalStats();
      setStats(response);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch withdrawal statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
    }).format(amount);
  };

  const formatMonth = (year: number, month: number) => {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-TZ', { month: 'short', year: 'numeric' });
  };

  const prepareChartData = () => {
    if (!stats?.monthly_trends) return { labels: [], data: [] };

    const sortedTrends = [...stats.monthly_trends].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    return {
      labels: sortedTrends.map(trend => formatMonth(trend.year, trend.month)),
      data: sortedTrends.map(trend => trend.total_amount),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading withdrawal statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-600 dark:text-gray-400">
        No statistics available
      </div>
    );
  }

  const chartData = prepareChartData();

  return (
    <>
      <PageMeta title="Withdrawal Statistics" description="Analytics and trends for withdrawal requests" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Withdrawal Statistics
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Analytics and trends for withdrawal requests
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ComponentCard title="Total Requests">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.stats.total_requests}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">All time withdrawal requests</div>
          </ComponentCard>
          
          <ComponentCard title="Pending Requests">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.stats.pending_requests}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Awaiting admin approval</div>
          </ComponentCard>
          
          <ComponentCard title="Total Amount Requested">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(stats.stats.total_amount_requested)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">All time requested amount</div>
          </ComponentCard>
          
          <ComponentCard title="Total Amount Paid">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(stats.stats.total_amount_paid)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Successfully processed</div>
          </ComponentCard>
        </div>

        {/* Status Breakdown */}
        <ComponentCard title="Request Status Breakdown">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.stats.paid_requests}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Paid</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.stats.pending_requests}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.stats.rejected_requests}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Rejected</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.stats.cancelled_requests}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cancelled</div>
            </div>
          </div>
        </ComponentCard>

        {/* Monthly Trends Chart */}
        <ComponentCard title="Monthly Withdrawal Trends">
          <div className="h-80 flex items-center justify-center">
            <div className="text-center w-full">
              <div className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Monthly Withdrawal Amounts</div>
              {chartData.labels.length > 0 ? (
                <div className="space-y-2">
                  {chartData.labels.map((label, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <span className="font-medium text-gray-900 dark:text-white">{label}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">{formatCurrency(chartData.data[index])}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">No trend data available</div>
              )}
            </div>
          </div>
        </ComponentCard>

        {/* Top Tipsters */}
        <ComponentCard title="Top Tipsters by Withdrawal Amount">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-2 text-sm font-medium text-gray-700 dark:text-gray-300">Rank</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tipster</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-700 dark:text-gray-300">Phone</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-700 dark:text-gray-300">Requests</th>
                  <th className="text-left p-2 text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_tipsters.map((tipster, index) => (
                  <tr key={tipster.tipster_id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-2 font-medium text-gray-900 dark:text-white">#{index + 1}</td>
                    <td className="p-2 font-medium text-gray-900 dark:text-white">{tipster.tipster.name}</td>
                    <td className="p-2 text-sm text-gray-500 dark:text-gray-400">{tipster.tipster.phone_number}</td>
                    <td className="p-2 text-gray-900 dark:text-white">{tipster.request_count}</td>
                    <td className="p-2 font-medium text-gray-900 dark:text-white">{formatCurrency(tipster.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ComponentCard>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ComponentCard title="Processing Metrics">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats.stats.total_requests > 0 
                    ? `${((stats.stats.paid_requests / stats.stats.total_requests) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Average Request Amount</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats.stats.total_requests > 0 
                    ? formatCurrency(stats.stats.total_amount_requested / stats.stats.total_requests)
                    : formatCurrency(0)
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Pending Amount</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(stats.stats.total_amount_pending)}
                </span>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Quick Actions">
            <div className="space-y-3">
              <Button
                onClick={() => window.location.href = '/withdrawals'}
                className="w-full"
              >
                View All Withdrawals
              </Button>
              <Button
                onClick={() => window.location.href = '/withdrawals'}
                variant="outline"
                className="w-full"
              >
                View Pending Requests
              </Button>
              <Button
                onClick={() => window.location.href = '/tipsters'}
                variant="outline"
                className="w-full"
              >
                Manage Tipsters
              </Button>
            </div>
          </ComponentCard>
        </div>
      </div>
    </>
  );
};

export default WithdrawalStats; 