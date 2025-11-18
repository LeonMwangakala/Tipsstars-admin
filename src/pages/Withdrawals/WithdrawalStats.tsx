import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import PageMeta from '../../components/common/PageMeta';
import ComponentCard from '../../components/common/ComponentCard';


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
        <div className="text-lg">Loading withdrawal statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!stats) {
    return <div>No statistics available</div>;
  }

  const chartData = prepareChartData();

  return (
    <>
      <PageMeta title="Withdrawal Statistics" description="Analytics and trends for withdrawal requests" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Withdrawal Statistics</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ComponentCard title="Total Requests">
            <div className="text-3xl font-bold text-blue-600">{stats.stats.total_requests}</div>
            <div className="text-sm text-gray-600">All time withdrawal requests</div>
          </ComponentCard>
          
          <ComponentCard title="Pending Requests">
            <div className="text-3xl font-bold text-yellow-600">{stats.stats.pending_requests}</div>
            <div className="text-sm text-gray-600">Awaiting admin approval</div>
          </ComponentCard>
          
          <ComponentCard title="Total Amount Requested">
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(stats.stats.total_amount_requested)}
            </div>
            <div className="text-sm text-gray-600">All time requested amount</div>
          </ComponentCard>
          
          <ComponentCard title="Total Amount Paid">
            <div className="text-3xl font-bold text-purple-600">
              {formatCurrency(stats.stats.total_amount_paid)}
            </div>
            <div className="text-sm text-gray-600">Successfully processed</div>
          </ComponentCard>
        </div>

        {/* Status Breakdown */}
        <ComponentCard title="Request Status Breakdown">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.stats.paid_requests}</div>
              <div className="text-sm text-gray-600">Paid</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.stats.pending_requests}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.stats.rejected_requests}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{stats.stats.cancelled_requests}</div>
              <div className="text-sm text-gray-600">Cancelled</div>
            </div>
          </div>
        </ComponentCard>

        {/* Monthly Trends Chart */}
        <ComponentCard title="Monthly Withdrawal Trends">
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-semibold mb-4">Monthly Withdrawal Amounts</div>
              {chartData.labels.length > 0 ? (
                <div className="space-y-2">
                  {chartData.labels.map((label, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{label}</span>
                      <span className="text-blue-600 font-semibold">{formatCurrency(chartData.data[index])}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No trend data available</div>
              )}
            </div>
          </div>
        </ComponentCard>

        {/* Top Tipsters */}
        <ComponentCard title="Top Tipsters by Withdrawal Amount">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Rank</th>
                  <th className="text-left p-2">Tipster</th>
                  <th className="text-left p-2">Phone</th>
                  <th className="text-left p-2">Requests</th>
                  <th className="text-left p-2">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_tipsters.map((tipster, index) => (
                  <tr key={tipster.tipster_id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">#{index + 1}</td>
                    <td className="p-2 font-medium">{tipster.tipster.name}</td>
                    <td className="p-2 text-sm text-gray-500">{tipster.tipster.phone_number}</td>
                    <td className="p-2">{tipster.request_count}</td>
                    <td className="p-2 font-medium">{formatCurrency(tipster.total_amount)}</td>
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
                <span className="text-gray-600">Success Rate</span>
                <span className="font-semibold">
                  {stats.stats.total_requests > 0 
                    ? `${((stats.stats.paid_requests / stats.stats.total_requests) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Request Amount</span>
                <span className="font-semibold">
                  {stats.stats.total_requests > 0 
                    ? formatCurrency(stats.stats.total_amount_requested / stats.stats.total_requests)
                    : formatCurrency(0)
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Amount</span>
                <span className="font-semibold text-yellow-600">
                  {formatCurrency(stats.stats.total_amount_pending)}
                </span>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard title="Quick Actions">
            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = '/withdrawals'}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Withdrawals
              </button>
              <button 
                onClick={() => window.location.href = '/withdrawals?status=pending'}
                className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                View Pending Requests
              </button>
              <button 
                onClick={() => window.location.href = '/tipsters'}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Manage Tipsters
              </button>
            </div>
          </ComponentCard>
        </div>
      </div>
    </>
  );
};

export default WithdrawalStats; 