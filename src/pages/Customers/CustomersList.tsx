import React, { useEffect, useState } from "react";
import { apiService, Customer } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import { UserIcon, CalenderIcon, DollarLineIcon } from "../../icons";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";

export default function CustomersList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSubscriptionsModal, setShowSubscriptionsModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addCustomerName, setAddCustomerName] = useState('');
  const [addCustomerPhone, setAddCustomerPhone] = useState('');
  const [addCustomerPassword, setAddCustomerPassword] = useState('');
  const [addCustomerPassword2, setAddCustomerPassword2] = useState('');
  const [addCustomerLoading, setAddCustomerLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [pagination.current_page, statusFilter]);

  // Debounced search effect - only trigger when searchText changes
  useEffect(() => {
    if (searchText === '') {
      // If search is cleared, fetch immediately
      setPagination(prev => ({ ...prev, current_page: 1 }));
      fetchCustomers();
      return;
    }

    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, current_page: 1 })); // Reset to first page when searching
      fetchCustomers();
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

  const fetchCustomers = async (page = pagination.current_page) => {
    try {
      setLoading(true);
      const response = await apiService.getCustomers({
        page,
        search: searchText || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setCustomers(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchCustomers(1);
  };

  const handleClearSearch = () => {
    setSearchText('');
    setPagination(prev => ({ ...prev, current_page: 1 }));
    fetchCustomers(1);
  };

  const handleViewProfile = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowProfileModal(true);
  };

  const handleViewSubscriptions = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowSubscriptionsModal(true);
  };

  const toggleAddForm = () => {
    setShowAddForm((prev) => {
      const next = !prev;
      if (!next) {
        setAddCustomerName('');
        setAddCustomerPhone('');
        setAddCustomerPassword('');
        setAddCustomerPassword2('');
      }
      return next;
    });
  };

  const getStatusBadge = (hasActiveSubscriptions: boolean) => {
    return hasActiveSubscriptions ? (
      <Badge color="success">Active</Badge>
    ) : (
      <Badge color="light">Inactive</Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    const normalizedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (normalizedAmount === null || normalizedAmount === undefined || isNaN(normalizedAmount)) {
      return 'TZS 0';
    }
    return `TZS ${normalizedAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
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

  if (loading && customers.length === 0) {
    return (
      <>
        <PageMeta title="Customer Management" description="Manage all customers and their subscriptions" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading customers...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Customer Management" description="Manage all customers and their subscriptions" />
      
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Customer Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage all customer accounts and their subscription status
          </p>
        </div>
        <div className="flex gap-3">
          <Button size="sm" onClick={toggleAddForm} className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            {showAddForm ? 'Close Form' : 'Add Customer'}
          </Button>
        </div>
      </div>

      {/* Add Customer Form */}
      {showAddForm && (
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Add New Customer
          </h3>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!addCustomerName || !addCustomerPhone || !addCustomerPassword || !addCustomerPassword2) {
              setError('All fields are required.');
              return;
            }
            if (addCustomerPassword !== addCustomerPassword2) {
              setError('Passwords do not match.');
              return;
            }
            setAddCustomerLoading(true);
            try {
              await apiService.registerUser({
                name: addCustomerName,
                phone_number: addCustomerPhone,
                password: addCustomerPassword,
                role: 'customer'
              });
              setAddCustomerLoading(false);
              setShowAddForm(false);
              setSuccess('Customer added successfully!');
              setAddCustomerName('');
              setAddCustomerPhone('');
              setAddCustomerPassword('');
              setAddCustomerPassword2('');
              fetchCustomers();
            } catch (err: any) {
              setAddCustomerLoading(false);
              setError(err.message || 'Failed to add customer');
            }
          }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <Input
                  placeholder="Enter full name"
                  value={addCustomerName}
                  onChange={(e) => setAddCustomerName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <Input
                  placeholder="Enter phone number"
                  value={addCustomerPhone}
                  onChange={(e) => setAddCustomerPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={addCustomerPassword}
                  onChange={(e) => setAddCustomerPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={addCustomerPassword2}
                  onChange={(e) => setAddCustomerPassword2(e.target.value)}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <Button 
                disabled={addCustomerLoading || !addCustomerName || !addCustomerPhone || !addCustomerPassword || !addCustomerPassword2}
                className="flex items-center gap-2"
              >
                {addCustomerLoading ? 'Adding...' : 'Add Customer'}
              </Button>
              <Button 
                variant="outline"
                onClick={toggleAddForm}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Customers
            </label>
            <Input
              placeholder="Search by name or phone number..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subscription Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Customers</option>
              <option value="active">Active Subscriptions</option>
              <option value="inactive">No Active Subscriptions</option>
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

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Subscription Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Active Subscriptions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {customer.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {customer.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {customer.phone_number}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      No email
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(false)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      0 active
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      0 total
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DollarLineIcon className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(0)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CalenderIcon className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatDate(customer.created_at)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewProfile(customer)}
                      >
                        View Profile
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewSubscriptions(customer)}
                      >
                        View Subscriptions
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {customers.length === 0 && !loading && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No customers found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No customers match your search criteria.
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
                onClick={() => fetchCustomers(pagination.current_page - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => fetchCustomers(pagination.current_page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Profile Modal */}
      {showProfileModal && selectedCustomer && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Customer Profile
              </h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedCustomer.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone Number
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedCustomer.phone_number}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Customer ID
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedCustomer.id}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Joined Date
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formatDate(selectedCustomer.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subscription Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Subscription Summary
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Active Subscriptions</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedCustomer.subscriptions?.filter(s => s.status === 'active').length || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Subscriptions</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedCustomer.subscriptions?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setShowProfileModal(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Subscriptions Modal */}
      {showSubscriptionsModal && selectedCustomer && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Customer Subscriptions - {selectedCustomer.name}
              </h2>
              <button
                onClick={() => setShowSubscriptionsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            {selectedCustomer.subscriptions && selectedCustomer.subscriptions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tipster
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        End Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {selectedCustomer.subscriptions.map((subscription) => (
                      <tr key={subscription.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {subscription.tipster?.name || 'Unknown Tipster'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getPlanTypeBadge(subscription.plan_type)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getStatusBadge(subscription.status === 'active')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatCurrency(subscription.price)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(subscription.start_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(subscription.end_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No subscriptions found for this customer.
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setShowSubscriptionsModal(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      
    </>
  );
} 