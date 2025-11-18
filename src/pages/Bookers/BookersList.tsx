import { useEffect, useState } from "react";
import { apiService, Booker } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Badge from "../../components/ui/badge/Badge";

export default function BookersList() {
  const [bookers, setBookers] = useState<Booker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [addActive, setAddActive] = useState(true);
  const [addLoading, setAddLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editBooker, setEditBooker] = useState<Booker | null>(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchBookers();
  }, [pagination.current_page, statusFilter]);

  useEffect(() => {
    if (!searchText) {
      setPagination(prev => ({ ...prev, current_page: 1 }));
      fetchBookers();
    }
  }, [searchText]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchBookers = async (page = pagination.current_page) => {
    try {
      setLoading(true);
      const response = await apiService.getBookers({
        page,
        search: searchText || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setBookers(response.data);
      if (response.pagination) {
        setPagination(response.pagination);
      } else {
        setPagination({
          current_page: 1,
          last_page: 1,
          per_page: 15,
          total: response.data.length,
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch bookers");
    } finally {
      setLoading(false);
    }
  };

  const resetAddForm = () => {
    setAddName("");
    setAddNotes("");
    setAddActive(true);
  };

  const toggleAddForm = () => {
    setShowAddForm((prev) => {
      const next = !prev;
      if (!next) resetAddForm();
      return next;
    });
  };

  const handleCreateBooker = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!addName.trim()) {
      setError("Booker name is required.");
      return;
    }

    try {
      setAddLoading(true);
      await apiService.createBooker({
        name: addName.trim(),
        notes: addNotes.trim() || undefined,
        is_active: addActive,
      });
      setSuccess("Booker created successfully!");
      toggleAddForm();
      setPagination(prev => ({ ...prev, current_page: 1 }));
      await fetchBookers(1);
    } catch (err: any) {
      setError(err.message || "Failed to create booker");
    } finally {
      setAddLoading(false);
    }
  };

  const openEditModal = (booker: Booker) => {
    setEditBooker(booker);
    setEditName(booker.name);
    setEditNotes(booker.notes ?? "");
    setEditActive(booker.is_active);
    setShowEditModal(true);
  };

  const handleEditBooker = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editBooker) return;
    if (!editName.trim()) {
      setError("Booker name is required.");
      return;
    }

    try {
      setEditLoading(true);
      await apiService.updateBooker(editBooker.id, {
        name: editName.trim(),
        notes: editNotes.trim() || undefined,
        is_active: editActive,
      });
      setSuccess("Booker updated successfully!");
      setShowEditModal(false);
      setEditBooker(null);
      await fetchBookers(pagination.current_page);
    } catch (err: any) {
      setError(err.message || "Failed to update booker");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteBooker = async (bookerId: number) => {
    if (!window.confirm("Are you sure you want to delete this booker?")) {
      return;
    }

    try {
      await apiService.deleteBooker(bookerId);
      setSuccess("Booker deleted successfully!");
      await fetchBookers(pagination.current_page);
    } catch (err: any) {
      setError(err.message || "Failed to delete booker");
    }
  };

  if (loading && bookers.length === 0) {
    return (
      <>
        <PageMeta title="Bookers Management" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading bookers...</p>
          </div>
        </div>
      </>
    );
  }

  const getStatusBadge = (isActive: boolean) =>
    isActive ? <Badge color="success">Active</Badge> : <Badge color="light">Inactive</Badge>;

  return (
    <>
      <PageMeta title="Bookers Management" description="Manage betting bookers for tipster slips" />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bookers Management</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage the list of betting bookers available to tipsters.
          </p>
        </div>
        <div className="flex gap-3">
          <Button size="sm" onClick={toggleAddForm}>
            {showAddForm ? "Close Form" : "Add Booker"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
          <p className="text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {showAddForm && (
        <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Booker</h3>

          <form onSubmit={handleCreateBooker} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Booker Name *
                </label>
                <Input
                  placeholder="Enter booker name"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={addActive ? "active" : "inactive"}
                  onChange={(e) => setAddActive(e.target.value === "active")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="Additional notes about this booker"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={addLoading}>
                {addLoading ? "Saving..." : "Save Booker"}
              </Button>
              <Button variant="outline" type="button" onClick={toggleAddForm}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Bookers
            </label>
            <Input
              placeholder="Search by name or notes..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "all" | "active" | "inactive");
                setPagination(prev => ({ ...prev, current_page: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={fetchBookers} className="flex-1">
              Search
            </Button>
            {searchText && (
              <Button
                onClick={() => {
                  setSearchText("");
                  setStatusFilter("all");
                  setPagination(prev => ({ ...prev, current_page: 1 }));
                  fetchBookers(1);
                }}
                variant="outline"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Booker
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
              {bookers.map((booker) => (
                <tr key={booker.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {booker.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {booker.notes || <span className="text-gray-400">No notes</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(booker.is_active)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(booker.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(booker)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteBooker(booker.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bookers.length === 0 && !loading && (
          <div className="text-center py-10">
            <p className="text-sm text-gray-500 dark:text-gray-400">No bookers found.</p>
          </div>
        )}
      </div>

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
                onClick={() => fetchBookers(pagination.current_page - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => fetchBookers(pagination.current_page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editBooker && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Booker</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditBooker(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditBooker} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Booker Name *
                </label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={editActive ? "active" : "inactive"}
                  onChange={(e) => setEditActive(e.target.value === "active")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditBooker(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={editLoading}>
                  {editLoading ? "Updating..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

