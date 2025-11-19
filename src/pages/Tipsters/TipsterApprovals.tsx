import { useEffect, useState, useCallback } from "react";
import { apiService, Tipster } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import { UserCircleIcon } from "../../icons";
import { FaEye, FaCheckCircle, FaTimes } from "react-icons/fa";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import { Modal } from "../../components/ui/modal";
import TextArea from "../../components/form/input/TextArea";

type TabType = 'pending' | 'approved' | 'rejected';

export default function TipsterApprovals() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [tipsters, setTipsters] = useState<Tipster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  
  // ID Document Modal
  const [showIdDocumentModal, setShowIdDocumentModal] = useState(false);
  const [selectedTipsterForId, setSelectedTipsterForId] = useState<Tipster | null>(null);
  const [idDocumentUrl, setIdDocumentUrl] = useState<string | null>(null);
  const [loadingIdDocument, setLoadingIdDocument] = useState(false);
  
  // Approval/Rejection Modal
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedTipster, setSelectedTipster] = useState<Tipster | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTipsters = useCallback(async (page = 1, status?: TabType) => {
    try {
      setIsLoading(true);
      setError('');
      
      const statusToFetch = status || activeTab;
      const statusMap: Record<TabType, string> = {
        pending: 'pending',
        approved: 'approved',
        rejected: 'rejected',
      };
      
      const response = await apiService.getTipsters({
        page,
        search: searchTerm || undefined,
        status: statusMap[statusToFetch],
      });
      
      setTipsters(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to load tipsters");
      setTipsters([]);
      setPagination({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchTerm]);

  useEffect(() => {
    // Reset to page 1 when tab or search changes and fetch data
    fetchTipsters(1, activeTab);
  }, [activeTab, searchTerm, fetchTipsters]);

  const handleViewIdDocument = async (tipster: Tipster) => {
    setSelectedTipsterForId(tipster);
    setShowIdDocumentModal(true);
    setLoadingIdDocument(true);
    setIdDocumentUrl(null);
    setError('');

    try {
      const response = await apiService.getTipsterIdDocument(tipster.id);
      if (response.id_document) {
        // Ensure the base64 string has the proper data URI prefix
        let imageUrl = response.id_document.trim();
        
        // If it doesn't start with data:, assume it's raw base64 and add the prefix
        if (!imageUrl.startsWith('data:')) {
          // Remove any whitespace
          const cleanBase64 = imageUrl.replace(/\s/g, '');
          
          // Try to detect image type from base64 string patterns
          // JPEG base64 typically starts with /9j/ (after encoding FF D8 FF)
          // PNG base64 typically starts with iVBORw0KGgo (after encoding 89 50 4E 47)
          if (cleanBase64.startsWith('/9j/') || cleanBase64.match(/^\/9j\//)) {
            imageUrl = `data:image/jpeg;base64,${cleanBase64}`;
          } else if (cleanBase64.startsWith('iVBORw0KGgo') || cleanBase64.match(/^iVBORw0KGgo/)) {
            imageUrl = `data:image/png;base64,${cleanBase64}`;
          } else {
            // Try to detect by decoding first few bytes
            try {
              const decoded = atob(cleanBase64.substring(0, Math.min(8, cleanBase64.length)));
              const bytes = Array.from(decoded, char => char.charCodeAt(0));
              
              // JPEG: FF D8 FF
              if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
                imageUrl = `data:image/jpeg;base64,${cleanBase64}`;
              }
              // PNG: 89 50 4E 47
              else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
                imageUrl = `data:image/png;base64,${cleanBase64}`;
              }
              // Default to jpeg
              else {
                imageUrl = `data:image/jpeg;base64,${cleanBase64}`;
              }
            } catch (e) {
              // If all detection fails, default to jpeg
              imageUrl = `data:image/jpeg;base64,${cleanBase64}`;
            }
          }
        }
        
        setIdDocumentUrl(imageUrl);
      } else {
        setError('ID document not found for this tipster');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load ID document');
    } finally {
      setLoadingIdDocument(false);
    }
  };

  const handleAction = (tipster: Tipster, type: 'approve' | 'reject') => {
    setSelectedTipster(tipster);
    setActionType(type);
    setActionNotes('');
    setShowActionModal(true);
    setError('');
  };

  const handleActionSubmit = async () => {
    if (!selectedTipster) return;
    
    if (actionType === 'reject' && !actionNotes.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (actionType === 'approve') {
        await apiService.approveTipster(selectedTipster.id, actionNotes.trim() || undefined);
        setSuccess('Tipster approved successfully!');
      } else {
        await apiService.rejectTipster(selectedTipster.id, actionNotes.trim());
        setSuccess('Tipster rejected successfully!');
      }
      
      setShowActionModal(false);
      setSelectedTipster(null);
      setActionNotes('');
      setError('');
      // Refresh the list to show updated status
      fetchTipsters(pagination.current_page);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || `Failed to ${actionType} tipster`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge color="warning" size="sm">Pending</Badge>;
      case 'approved':
        return <Badge color="success" size="sm">Approved</Badge>;
      case 'rejected':
        return <Badge color="error" size="sm">Rejected</Badge>;
      default:
        return <Badge color="light" size="sm">Unknown</Badge>;
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPagination(prev => ({ ...prev, current_page: 1 }));
    setError('');
    setSuccess('');
  };

  const tabs = [
    { id: 'pending' as TabType, label: 'Pending', count: activeTab === 'pending' ? pagination.total : null },
    { id: 'approved' as TabType, label: 'Approved', count: activeTab === 'approved' ? pagination.total : null },
    { id: 'rejected' as TabType, label: 'Rejected', count: activeTab === 'rejected' ? pagination.total : null },
  ];

  return (
    <>
      <PageMeta title="Tipster Approvals - Pweza Admin" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tipster Approvals
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Review and manage tipster registration approvals
            </p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
            <p className="text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>{tab.label}</span>
                  {tab.count !== null && tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Tipsters
              </label>
              <Input
                placeholder="Search by name or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button 
                onClick={() => fetchTipsters(pagination.current_page)} 
                className="flex-1"
              >
                Search
              </Button>
              {searchTerm && (
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    fetchTipsters(1);
                  }} 
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
          <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            <button
              onClick={() => setError('')}
              className="float-right text-red-400 hover:text-red-600 dark:hover:text-red-300"
            >
              ×
            </button>
            <p className="pr-6">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && tipsters.length === 0 ? (
          <div className="flex justify-center items-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
          </div>
        ) : tipsters.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <UserCircleIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No {activeTab === 'pending' ? 'Pending' : activeTab === 'approved' ? 'Approved' : 'Rejected'} Tipsters
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === 'pending' 
                ? 'All tipster registrations have been processed.'
                : `No ${activeTab} tipsters found.`}
            </p>
          </div>
        ) : (
          <>
            {/* Tipsters Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Tipster
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Registered
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Admin Notes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {tipsters.map((tipster) => (
                      <tr key={tipster.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-lg">
                                {tipster.name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {tipster.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                ID: {tipster.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {tipster.phone_number}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(tipster.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(tipster.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                            {tipster.admin_notes || (
                              <span className="text-gray-400 italic">No notes</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {tipster.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewIdDocument(tipster)}
                                  className="flex items-center justify-center"
                                >
                                  <FaEye className="w-4 h-4" />
                                  <span className="sr-only">View ID Document</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => handleAction(tipster, 'approve')}
                                  className="flex items-center justify-center"
                                >
                                  <FaCheckCircle className="w-4 h-4" />
                                  <span className="sr-only">Approve</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleAction(tipster, 'reject')}
                                  className="flex items-center justify-center"
                                >
                                  <FaTimes className="w-4 h-4" />
                                  <span className="sr-only">Reject</span>
                                </Button>
                              </>
                            )}
                            {tipster.status === 'approved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewIdDocument(tipster)}
                                className="flex items-center justify-center"
                              >
                                <FaEye className="w-4 h-4" />
                                <span className="sr-only">View ID Document</span>
                              </Button>
                            )}
                            {tipster.status === 'rejected' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewIdDocument(tipster)}
                                className="flex items-center justify-center"
                              >
                                <FaEye className="w-4 h-4" />
                                <span className="sr-only">View ID Document</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.total > 0 && (
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                      {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                      {pagination.total} tipsters
                    </div>
                    {pagination.last_page > 1 && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pagination.current_page === 1 || isLoading}
                          onClick={() => {
                            const newPage = pagination.current_page - 1;
                            setPagination(prev => ({ ...prev, current_page: newPage }));
                            fetchTipsters(newPage, activeTab);
                          }}
                        >
                          Previous
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pagination.current_page === pagination.last_page || isLoading}
                          onClick={() => {
                            const newPage = pagination.current_page + 1;
                            setPagination(prev => ({ ...prev, current_page: newPage }));
                            fetchTipsters(newPage, activeTab);
                          }}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ID Document Modal */}
      <Modal
        isOpen={showIdDocumentModal}
        onClose={() => {
          setShowIdDocumentModal(false);
          setSelectedTipsterForId(null);
          setIdDocumentUrl(null);
        }}
        className="max-w-4xl m-4"
      >
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              ID Document - {selectedTipsterForId?.name || ''}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Review the tipster's identification document
            </p>
          </div>
          <div className="space-y-4 px-2">
            {loadingIdDocument ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
              </div>
            ) : idDocumentUrl ? (
              <div className="space-y-4">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-center min-h-[400px]">
                  <img
                    src={idDocumentUrl || ''}
                    alt="ID Document"
                    className="max-w-full max-h-[600px] object-contain rounded"
                    onError={(e) => {
                      console.error('Image load error:', e);
                      setError('Failed to load image. The image may be corrupted or in an unsupported format.');
                      setIdDocumentUrl(null);
                    }}
                    onLoad={() => {
                      setError('');
                    }}
                  />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>Tipster:</strong> {selectedTipsterForId?.name}</p>
                  <p><strong>Phone:</strong> {selectedTipsterForId?.phone_number}</p>
                  <p><strong>Registered:</strong> {selectedTipsterForId ? formatDate(selectedTipsterForId.created_at) : ''}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  ID document not available
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Approval/Rejection Modal */}
      <Modal
        isOpen={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setSelectedTipster(null);
          setActionNotes('');
          setError('');
        }}
        className="max-w-2xl m-4"
      >
        <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {actionType === 'approve' ? 'Approve' : 'Reject'} Tipster - {selectedTipster?.name || ''}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {actionType === 'approve' 
                ? 'Approve this tipster registration and allow them to access the platform.'
                : 'Reject this tipster registration. Provide a reason for the rejection.'}
            </p>
          </div>
          <div className="space-y-4 px-2">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Tipster:</strong> {selectedTipster?.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Phone:</strong> {selectedTipster?.phone_number}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Registered:</strong> {selectedTipster ? formatDate(selectedTipster.created_at) : ''}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {actionType === 'approve' ? 'Admin Notes (Optional)' : 'Rejection Reason (Required)'}
              </label>
              <TextArea
                placeholder={actionType === 'approve' 
                  ? 'Add any notes about this approval...' 
                  : 'Please provide a reason for rejection...'}
                value={actionNotes}
                onChange={(value) => setActionNotes(value)}
                rows={4}
                required={actionType === 'reject'}
              />
            </div>

            {error && (
              <div className="p-3 text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedTipster(null);
                  setActionNotes('');
                  setError('');
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={actionType === 'approve' ? 'success' : 'danger'}
                onClick={() => {
                  handleActionSubmit();
                }}
                disabled={actionLoading || (actionType === 'reject' && !actionNotes.trim())}
              >
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  `${actionType === 'approve' ? 'Approve' : 'Reject'} Tipster`
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
