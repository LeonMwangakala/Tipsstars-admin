import { useEffect, useState } from "react";
import { apiService, CommissionConfig } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import { DollarLineIcon, CalenderIcon, PlusIcon, PencilIcon, TrashBinIcon } from "../../icons";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";

interface CommissionForm {
  name: string;
  commission_rate: number;
  description: string;
  is_active: boolean;
}

export default function CommissionList() {
  const [configs, setConfigs] = useState<CommissionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CommissionConfig | null>(null);
  const [formData, setFormData] = useState<CommissionForm>({
    name: '',
    commission_rate: 15.00,
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchConfigs();
  }, [currentPage]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCommissionConfigs({
        page: currentPage,
        search: searchText || undefined,
      });
      setConfigs(response.data);
      setTotalPages(response.pagination.last_page);
    } catch (err: any) {
      setError(err.message || "Failed to fetch commission configurations");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchConfigs();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (editingConfig) {
        await apiService.updateCommissionConfig(editingConfig.id, formData);
        setSuccess("Commission configuration updated successfully!");
      } else {
        await apiService.createCommissionConfig(formData);
        setSuccess("Commission configuration created successfully!");
      }
      
      setFormData({ name: '', commission_rate: 15.00, description: '', is_active: true });
      setEditingConfig(null);
      setShowForm(false);
      fetchConfigs();
    } catch (err: any) {
      setError(err.message || "Failed to save commission configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: CommissionConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      commission_rate: config.commission_rate,
      description: config.description || '',
      is_active: config.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (configId: number) => {
    if (!confirm('Are you sure you want to delete this commission configuration?')) {
      return;
    }

    try {
      await apiService.deleteCommissionConfig(configId);
      setSuccess("Commission configuration deleted successfully!");
      fetchConfigs();
    } catch (err: any) {
      setError(err.message || "Failed to delete commission configuration");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && configs.length === 0) {
    return (
      <>
        <PageMeta title="Commission Management" description="Manage commission configurations for tipsters" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading commission configurations...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Commission Management" description="Manage commission configurations for tipsters" />
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Commission Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configure commission rates for tipsters on customer subscriptions
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
          <p className="text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Search and Add Button */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search commission configurations..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSearch}>
            Search
          </Button>
          <Button 
            onClick={() => {
              setEditingConfig(null);
              setFormData({ name: '', commission_rate: 15.00, description: '', is_active: true });
              setShowForm(true);
            }}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Commission Config
          </Button>
        </div>
      </div>

      {/* Commission Form */}
      {showForm && (
        <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingConfig ? 'Edit Commission Configuration' : 'Add New Commission Configuration'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Configuration Name
                </label>
                <Input
                  placeholder="e.g., default, premium_tipsters..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Commission Rate (%)
                </label>
                <Input
                  type="number"
                  step={0.01}
                  min="0"
                  max="100"
                  placeholder="15.00"
                  value={formData.commission_rate.toString()}
                  onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Describe this commission configuration..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button 
                disabled={loading || !formData.name || formData.commission_rate < 0 || formData.commission_rate > 100}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <PencilIcon className="w-4 h-4" />
                    {editingConfig ? 'Update Config' : 'Create Config'}
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingConfig(null);
                  setFormData({ name: '', commission_rate: 15.00, description: '', is_active: true });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Commission Configs Table */}
      <div className="bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Configuration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Commission Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {configs.map((config) => (
                <tr key={config.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                          <DollarLineIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {config.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {config.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DollarLineIcon className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {config.commission_rate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {config.is_active ? (
                      <Badge color="success">Active</Badge>
                    ) : (
                      <Badge color="light">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {config.description || 'No description'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CalenderIcon className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatDate(config.created_at)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEdit(config)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDelete(config.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashBinIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {configs.length === 0 && !loading && (
                      <div className="text-center py-12">
              <DollarLineIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No commission configurations found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by adding a new commission configuration.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
} 