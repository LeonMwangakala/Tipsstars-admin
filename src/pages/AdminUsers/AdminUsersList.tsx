import { useEffect, useState } from "react";
import { apiService, AdminUser } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import { UserIcon, CalenderIcon, PlusIcon, PencilIcon, TrashBinIcon } from "../../icons";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";

interface AdminForm {
  name: string;
  phone_number: string;
  email: string;
  password: string;
}

export default function AdminUsersList() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState<AdminForm>({
    name: '',
    phone_number: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchAdmins();
  }, [currentPage]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAdminUsers({
        page: currentPage,
        search: searchText || undefined,
      });
      setAdmins(response.data);
      setTotalPages(response.pagination.last_page);
    } catch (err: any) {
      setError(err.message || "Failed to fetch admin users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAdmins();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (editingAdmin) {
        await apiService.updateAdmin(editingAdmin.id, formData);
        setSuccess("Admin user updated successfully!");
      } else {
        await apiService.createAdmin(formData);
        setSuccess("Admin user created successfully!");
      }
      
      setFormData({ name: '', phone_number: '', email: '', password: '' });
      setEditingAdmin(null);
      setShowForm(false);
      fetchAdmins();
    } catch (err: any) {
      setError(err.message || "Failed to save admin user");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      phone_number: admin.phone_number,
      email: admin.email || '',
      password: ''
    });
    setShowForm(true);
  };

  const handleDelete = async (adminId: number) => {
    if (!confirm('Are you sure you want to delete this admin user?')) {
      return;
    }

    try {
      await apiService.deleteAdmin(adminId);
      setSuccess("Admin user deleted successfully!");
      fetchAdmins();
    } catch (err: any) {
      setError(err.message || "Failed to delete admin user");
    }
  };

  const handleToggleStatus = async (adminId: number) => {
    try {
      await apiService.toggleAdminStatus(adminId);
      setSuccess("Admin status updated successfully!");
      fetchAdmins();
    } catch (err: any) {
      setError(err.message || "Failed to update admin status");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && admins.length === 0) {
    return (
      <>
        <PageMeta title="Admin Users Management" description="Manage admin users and their permissions" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin users...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Admin Users Management" description="Manage admin users and their permissions" />
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin Users Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage admin users, their permissions, and account status
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
            placeholder="Search admin users..."
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
              setEditingAdmin(null);
              setFormData({ name: '', phone_number: '', email: '', password: '' });
              setShowForm(true);
            }}
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Admin
          </Button>
        </div>
      </div>

      {/* Admin Form */}
      {showForm && (
        <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingAdmin ? 'Edit Admin User' : 'Add New Admin User'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <Input
                  placeholder="Enter full name..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <Input
                  placeholder="Enter phone number..."
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email (Optional)
                </label>
                <Input
                  type="email"
                  placeholder="Enter email address..."
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {editingAdmin ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <Input
                  type="password"
                  placeholder={editingAdmin ? "Enter new password..." : "Enter password..."}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <Button 
                disabled={loading || !formData.name || !formData.phone_number || (!editingAdmin && !formData.password)}
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
                    {editingAdmin ? 'Update Admin' : 'Create Admin'}
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingAdmin(null);
                  setFormData({ name: '', phone_number: '', email: '', password: '' });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Admins Table */}
      <div className="bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Admin User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
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
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {admin.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {admin.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {admin.phone_number}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {admin.email || 'No email'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge color="primary">{admin.role}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CalenderIcon className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatDate(admin.created_at)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEdit(admin)}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleToggleStatus(admin.id)}
                      >
                        Toggle Status
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDelete(admin.id)}
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
        {admins.length === 0 && !loading && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No admin users found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by adding a new admin user.
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