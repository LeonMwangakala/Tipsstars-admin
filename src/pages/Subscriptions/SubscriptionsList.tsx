import { useEffect, useMemo, useState } from "react";
import { apiService, Subscription, Tipster, Customer } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import { UserIcon } from "../../icons";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";

export default function SubscriptionsList() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tipsterFilter, setTipsterFilter] = useState("all");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [success, setSuccess] = useState('');
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
  const [tipsterOptions, setTipsterOptions] = useState<Tipster[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedTipsterId, setSelectedTipsterId] = useState("");
  const [selectedPlanType, setSelectedPlanType] = useState<'weekly' | 'monthly'>('weekly');
  const [createLoading, setCreateLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, [pagination.current_page, statusFilter, tipsterFilter]);

  // Debounced search effect - only trigger when searchText changes
  useEffect(() => {
    if (searchText === '') {
      // If search is cleared, fetch immediately
      setPagination(prev => ({ ...prev, current_page: 1 }));
      fetchSubscriptions();
      return;
    }

    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, current_page: 1 })); // Reset to first page when searching
      fetchSubscriptions();
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchText]);

  // Auto-close alerts after 20 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 20000); // 20 seconds

      return () => clearTimeout(timer);
    }
  }, [success, error]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [customersResponse, tipstersResponse] = await Promise.all([
          apiService.getCustomers({ page: 1 }),
          apiService.getTipsters({ page: 1, status: 'approved' }),
        ]);

        setCustomerOptions(customersResponse.data);
        setTipsterOptions(tipstersResponse.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load subscription form options');
      }
    };

    loadOptions();
  }, []);

  const fetchSubscriptions = async (page = pagination.current_page) => {
    try {
      setLoading(true);
      const response = await apiService.getSubscriptions({
        page,
        search: searchText || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        tipster_id: tipsterFilter !== "all" ? parseInt(tipsterFilter) : undefined,
      });
      setSubscriptions(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to fetch subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchSubscriptions(1);
  };

  const handleClearSearch = () => {
    setSearchText('');
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchSubscriptions(1);
  };

  const toggleCreateForm = () => {
    setShowCreateForm((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedCustomerId('');
        setSelectedTipsterId('');
        setSelectedPlanType('weekly');
      }
      return next;
    });
  };

  const handleCreateSubscription = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCustomerId || !selectedTipsterId) {
      setError('Please select both a customer and a tipster.');
      return;
    }

    if (computedPrice === null) {
      setError('The selected tipster has not configured a price for this plan type.');
      return;
    }

    try {
      setCreateLoading(true);
      setError('');
      setSuccess('');

      await apiService.createSubscriptionForCustomer({
        user_id: Number(selectedCustomerId),
        tipster_id: Number(selectedTipsterId),
        plan_type: selectedPlanType,
      });

      setSuccess('Subscription created successfully!');
      setSelectedCustomerId('');
      setSelectedTipsterId('');
      setSelectedPlanType('weekly');
      setShowCreateForm(false);

      if (pagination.current_page === 1) {
        await fetchSubscriptions();
      } else {
        setPagination(prev => ({ ...prev, current_page: 1 }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create subscription');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusChange = async (subscriptionId: number, newStatus: string) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await apiService.updateSubscriptionStatus(subscriptionId, newStatus);
      
      setSuccess('Subscription status updated successfully!');
      
      // Refresh the subscriptions list
      await fetchSubscriptions();
      
      // Close modal if it's open
      if (showDetailsModal) {
        setShowDetailsModal(false);
        setSelectedSubscription(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update subscription status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge color="success">Active</Badge>;
      case "expired":
        return <Badge color="error">Expired</Badge>;
      case "cancelled":
        return <Badge color="warning">Cancelled</Badge>;
      default:
        return <Badge color="light">Unknown</Badge>;
    }
  };

  const getPlanTypeBadge = (planType: string) => {
    switch (planType) {
      case "daily":
        return <Badge color="info">Daily</Badge>;
      case "weekly":
        return <Badge color="primary">Weekly</Badge>;
      case "monthly":
        return <Badge color="light">Monthly</Badge>;
      default:
        return <Badge color="light">Unknown</Badge>;
    }
  };

  const parseAmount = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(normalized)) {
      return null;
    }

    return normalized;
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    const normalizedAmount = parseAmount(amount);

    if (normalizedAmount === null) {
      return 'TZS 0';
    }

    return `TZS ${normalizedAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const selectedTipster = useMemo(() => {
    if (!selectedTipsterId) {
      return undefined;
    }

    const tipsterId = Number(selectedTipsterId);
    if (Number.isNaN(tipsterId)) {
      return undefined;
    }

    return tipsterOptions.find((tipster) => tipster.id === tipsterId);
  }, [selectedTipsterId, tipsterOptions]);

  const computedPrice = useMemo(() => {
    if (!selectedTipster) {
      return null;
    }

    return selectedPlanType === 'weekly'
      ? parseAmount(selectedTipster.weekly_subscription_amount)
      : parseAmount(selectedTipster.monthly_subscription_amount);
  }, [selectedTipster, selectedPlanType]);

  const isCreateDisabled =
    createLoading ||
    !selectedCustomerId ||
    !selectedTipsterId ||
    computedPrice === null;

  if (loading && subscriptions.length === 0) {
    return (
      <>
        <PageMeta title="Subscriptions Management" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading subscriptions...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Subscriptions Management" />
      
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Subscription Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all customer subscriptions and payment monitoring
          </p>
        </div>
        <div className="flex gap-3">
          <Button size="sm" onClick={toggleCreateForm} className="flex items-center gap-2">
            {showCreateForm ? 'Close Form' : 'Create Subscription'}
          </Button>
        </div>
      </div>

      {/* Create Subscription Form */}
      {showCreateForm && (
        <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex flex-col gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create Customer Subscription
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Assign a customer to a tipster. Pricing is based on the tipster&apos;s configured weekly or monthly rate.
              </p>
            </div>

            <form onSubmit={handleCreateSubscription} className="space-y-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Customer
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="">Select customer</option>
                    {customerOptions.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.phone_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipster
                  </label>
                  <select
                    value={selectedTipsterId}
                    onChange={(e) => setSelectedTipsterId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="">Select tipster</option>
                    {tipsterOptions.map((tipster) => (
                      <option key={tipster.id} value={tipster.id}>
                        {tipster.name} ({tipster.phone_number})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Plan Type
                  </label>
                  <select
                    value={selectedPlanType}
                    onChange={(e) => setSelectedPlanType(e.target.value as 'weekly' | 'monthly')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price Preview
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                    {selectedTipsterId
                      ? computedPrice !== null
                        ? formatCurrency(computedPrice)
                        : 'Tipster has not set a price for this plan'
                      : 'Select a tipster'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Weekly amount must be &le; 10,000 TZS and monthly amount must be &le; 40,000 TZS.
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={toggleCreateForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreateDisabled}
                    className="min-w-[180px]"
                  >
                    {createLoading ? 'Creating...' : 'Create Subscription'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <Input
              placeholder="Search by customer or tipster..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipster
            </label>
            <select
              value={tipsterFilter}
              onChange={(e) => setTipsterFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Tipsters</option>
              {tipsterOptions.map((tipster) => (
                <option key={tipster.id} value={tipster.id}>
                  {tipster.name} ({tipster.phone_number})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={handleSearch} className="flex-1">
              Search
            </Button>
            {searchText && (
              <Button 
                onClick={handleClearSearch} 
                variant="outline" 
                className="px-3"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 relative">
          <button
            onClick={() => setError('')}
            className="absolute top-2 right-2 text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300"
          >
            ×
          </button>
          <p className="text-red-600 dark:text-red-400 pr-6">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800 relative">
          <button
            onClick={() => setSuccess('')}
            className="absolute top-2 right-2 text-green-400 hover:text-green-600 dark:text-green-500 dark:hover:text-green-300"
          >
            ×
          </button>
          <p className="text-green-600 dark:text-green-400 pr-6">{success}</p>
        </div>
      )}

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="overflow-x-auto" style={{ maxWidth: '100vw' }}>
          <table className="w-full" style={{ minWidth: '900px' }}>
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" style={{ width: '150px' }}>
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" style={{ width: '150px' }}>
                  Tipster
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" style={{ width: '100px' }}>
                  Plan & Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" style={{ width: '100px' }}>
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" style={{ width: '100px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {subscriptions.map((subscription) => (
                <tr key={subscription.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {subscription.user?.name || 'Unknown Customer'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {subscription.user?.phone_number || 'No phone'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {subscription.tipster?.name || 'Unknown Tipster'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {subscription.tipster?.phone_number || 'No phone'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      {getPlanTypeBadge(subscription.plan_type)}
                      <div className="flex items-center mt-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(subscription.price)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(subscription.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedSubscription(subscription);
                        setShowDetailsModal(true);
                      }}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {subscriptions.length === 0 && !loading && (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No subscriptions found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new subscription.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="mt-6 px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{" "}
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{" "}
              {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.current_page === 1}
                onClick={() => fetchSubscriptions(pagination.current_page - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => fetchSubscriptions(pagination.current_page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Details Modal */}
      {showDetailsModal && selectedSubscription && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Subscription Details
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Customer Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-3">
                      <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {selectedSubscription.user?.name || 'Unknown Customer'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedSubscription.user?.phone_number || 'No phone'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tipster Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tipster Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mr-3">
                      <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {selectedSubscription.tipster?.name || 'Unknown Tipster'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedSubscription.tipster?.phone_number || 'No phone'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Subscription Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Plan Type:</span>
                    <span className="font-medium">{getPlanTypeBadge(selectedSubscription.plan_type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Price:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(selectedSubscription.price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span>{getStatusBadge(selectedSubscription.status)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                    <span className="font-medium">{formatDate(selectedSubscription.start_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">End Date:</span>
                    <span className="font-medium">{formatDate(selectedSubscription.end_at)}</span>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Financial Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Commission Rate:</span>
                    <span className="font-medium">{selectedSubscription.commission_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Commission Amount:</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(selectedSubscription.commission_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tipster Earnings:</span>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(selectedSubscription.tipster_earnings)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </Button>
              <select
                value={selectedSubscription.status}
                onChange={(e) => handleStatusChange(selectedSubscription.id, e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 