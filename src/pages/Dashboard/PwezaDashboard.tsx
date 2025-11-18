import { useEffect, useState, useMemo } from "react";
import { apiService, DashboardStats, Prediction, Subscription } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import { UserCircleIcon, UserIcon, PieChartIcon, DollarLineIcon, BoltIcon, CheckCircleIcon, GroupIcon } from "../../icons";
import { FaMoneyBillWave } from "react-icons/fa";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

export default function PwezaDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPredictions, setRecentPredictions] = useState<Prediction[]>([]);
  const [recentSubscriptions, setRecentSubscriptions] = useState<Subscription[]>([]);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [dashboardStats, predictionsResponse, subscriptionsResponse] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getPredictions({ page: 1 }),
          apiService.getSubscriptions({ page: 1 }),
        ]);
        
        setStats(dashboardStats);
        setRecentPredictions(predictionsResponse.data.slice(0, 5));
        setRecentSubscriptions(subscriptionsResponse.data.slice(0, 5));
        setTotalSubscriptions(subscriptionsResponse.pagination?.total || 0);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard stats");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Prepare chart data
  const weeklyPredictionsChart = useMemo(() => {
    if (!stats?.weekly_predictions || stats.weekly_predictions.length === 0) return null;

    // Sort by date to ensure chronological order
    const sortedData = [...stats.weekly_predictions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const dates = sortedData.map(item => {
      const date = new Date(item.date + 'T00:00:00'); // Ensure proper date parsing
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const counts = sortedData.map(item => Number(item.count));

    const isDark = document.documentElement.classList.contains('dark');

    return {
      options: {
        chart: {
          type: 'area',
          height: 350,
          toolbar: { show: false },
          zoom: { enabled: false },
          background: 'transparent',
        },
        dataLabels: { enabled: false },
        stroke: {
          curve: 'smooth',
          width: 2,
        },
        xaxis: {
          categories: dates,
          labels: {
            style: {
              colors: isDark ? '#9CA3AF' : '#6B7280',
            },
          },
        },
        yaxis: {
          labels: {
            style: {
              colors: isDark ? '#9CA3AF' : '#6B7280',
            },
          },
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.3,
            stops: [0, 100],
          },
        },
        colors: ['#3B82F6'],
        grid: {
          borderColor: isDark ? '#374151' : '#E5E7EB',
          strokeDashArray: 4,
        },
        tooltip: {
          theme: isDark ? 'dark' : 'light',
        },
      } as ApexOptions,
      series: [{
        name: 'Predictions',
        data: counts,
      }],
    };
  }, [stats?.weekly_predictions]);

  const subscriptionTrendsChart = useMemo(() => {
    if (!stats?.subscription_trends || stats.subscription_trends.length === 0) return null;

    // Sort by date to ensure chronological order
    const sortedData = [...stats.subscription_trends].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const dates = sortedData.map(item => {
      const date = new Date(item.date + 'T00:00:00'); // Ensure proper date parsing
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const counts = sortedData.map(item => Number(item.count));

    const isDark = document.documentElement.classList.contains('dark');

    return {
      options: {
        chart: {
          type: 'bar',
          height: 350,
          toolbar: { show: false },
          zoom: { enabled: false },
          background: 'transparent',
        },
        dataLabels: { enabled: false },
        xaxis: {
          categories: dates,
          labels: {
            style: {
              colors: isDark ? '#9CA3AF' : '#6B7280',
            },
            rotate: -45,
            rotateAlways: false,
          },
        },
        yaxis: {
          labels: {
            style: {
              colors: isDark ? '#9CA3AF' : '#6B7280',
            },
          },
        },
        colors: ['#10B981'],
        grid: {
          borderColor: isDark ? '#374151' : '#E5E7EB',
          strokeDashArray: 4,
        },
        tooltip: {
          theme: isDark ? 'dark' : 'light',
        },
        plotOptions: {
          bar: {
            borderRadius: 4,
            columnWidth: '60%',
          },
        },
      } as ApexOptions,
      series: [{
        name: 'Subscriptions',
        data: counts,
      }],
    };
  }, [stats?.subscription_trends]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Dashboard"
        description="Soccer prediction platform administration dashboard"
      />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with your platform today.
          </p>
        </div>

        {/* KPI Cards - 2 rows of 4 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Tipsters */}
          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl border border-blue-200 dark:border-blue-800/30 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                  Total Tipsters
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {stats?.total_tipsters || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-200 dark:bg-blue-900/40 rounded-lg">
                <UserCircleIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Active Customers */}
          <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 rounded-xl border border-green-200 dark:border-green-800/30 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                  Active Customers
                </p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {stats?.active_customers || 0}
                </p>
              </div>
              <div className="p-3 bg-green-200 dark:bg-green-900/40 rounded-lg">
                <UserIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Predictions Today */}
          <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 rounded-xl border border-purple-200 dark:border-purple-800/30 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                  Predictions Today
                </p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {stats?.predictions_today || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-200 dark:bg-purple-900/40 rounded-lg">
                <PieChartIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Success Rate */}
          <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/10 rounded-xl border border-yellow-200 dark:border-yellow-800/30 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">
                  Success Rate
                </p>
                <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                  {stats?.success_rate ? `${stats.success_rate}%` : '0%'}
                </p>
              </div>
              <div className="p-3 bg-yellow-200 dark:bg-yellow-900/40 rounded-lg">
                <CheckCircleIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Total Commission */}
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/10 rounded-xl border border-indigo-200 dark:border-indigo-800/30 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">
                  Total Commission
                </p>
                <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                  {stats?.total_commission ? formatCurrency(stats.total_commission) : formatCurrency(0)}
                </p>
              </div>
              <div className="p-3 bg-indigo-200 dark:bg-indigo-900/40 rounded-lg">
                <DollarLineIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Tipster Earnings */}
          <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-xl border border-emerald-200 dark:border-emerald-800/30 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                  Tipster Earnings
                </p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {stats?.total_tipster_earnings ? formatCurrency(stats.total_tipster_earnings) : formatCurrency(0)}
                </p>
              </div>
              <div className="p-3 bg-emerald-200 dark:bg-emerald-900/40 rounded-lg">
                <FaMoneyBillWave className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Active Commission Configs */}
          <div className="p-6 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/10 rounded-xl border border-pink-200 dark:border-pink-800/30 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pink-600 dark:text-pink-400 mb-1">
                  Commission Configs
                </p>
                <p className="text-3xl font-bold text-pink-900 dark:text-pink-100">
                  {stats?.active_commission_configs || 0}
                </p>
              </div>
              <div className="p-3 bg-pink-200 dark:bg-pink-900/40 rounded-lg">
                <BoltIcon className="w-8 h-8 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
          </div>

          {/* Total Subscriptions */}
          <div className="p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/10 rounded-xl border border-cyan-200 dark:border-cyan-800/30 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400 mb-1">
                  Total Subscriptions
                </p>
                <p className="text-3xl font-bold text-cyan-900 dark:text-cyan-100">
                  {totalSubscriptions}
                </p>
              </div>
              <div className="p-3 bg-cyan-200 dark:bg-cyan-900/40 rounded-lg">
                <GroupIcon className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Weekly Predictions Chart */}
          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Weekly Predictions
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Last 7 days
                </p>
              </div>
            </div>
            {weeklyPredictionsChart ? (
              <Chart
                options={weeklyPredictionsChart.options}
                series={weeklyPredictionsChart.series}
                type="area"
                height={350}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No data available
              </div>
            )}
          </div>

          {/* Subscription Trends Chart */}
          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Subscription Trends
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Last 30 days
                </p>
              </div>
            </div>
            {subscriptionTrendsChart ? (
              <Chart
                options={subscriptionTrendsChart.options}
                series={subscriptionTrendsChart.series}
                type="bar"
                height={350}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Predictions */}
          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Predictions
              </h3>
              <a
                href="/predictions"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View all →
              </a>
            </div>
            <div className="space-y-4">
              {recentPredictions.length > 0 ? (
                recentPredictions.map((prediction) => (
                  <div
                    key={prediction.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {prediction.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {prediction.tipster?.name || 'Unknown'}
                        </p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTimeAgo(prediction.created_at)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        prediction.result_status === 'won'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : prediction.result_status === 'lost'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}
                    >
                      {prediction.result_status || 'Pending'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No recent predictions
                </p>
              )}
            </div>
          </div>

          {/* Recent Subscriptions */}
          <div className="p-6 bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Subscriptions
              </h3>
              <a
                href="/subscriptions"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View all →
              </a>
            </div>
            <div className="space-y-4">
              {recentSubscriptions.length > 0 ? (
                recentSubscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {subscription.user?.name || 'Unknown Customer'}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {subscription.tipster?.name || 'Unknown Tipster'}
                        </p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTimeAgo(subscription.created_at)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        subscription.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : subscription.status === 'expired'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}
                    >
                      {subscription.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No recent subscriptions
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
