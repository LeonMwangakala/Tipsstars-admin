import { useEffect, useState } from "react";
import { apiService, Tipster } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import { UserCircleIcon, EyeIcon } from "../../icons";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import { Modal } from "../../components/ui/modal";
import TextArea from "../../components/form/input/TextArea";

export default function TipsterApprovals() {
  const [tipsters, setTipsters] = useState<Tipster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
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

  const fetchTipsters = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await apiService.getTipsters({
        page,
        search: searchTerm || undefined,
        status: 'pending', // Only fetch pending tipsters
      });
      setTipsters(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to load pending tipsters");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTipsters();
  }, [searchTerm]);

  const handleViewIdDocument = async (tipster: Tipster) => {
    setSelectedTipsterForId(tipster);
    setShowIdDocumentModal(true);
    setLoadingIdDocument(true);
    setIdDocumentUrl(null);

    try {
      const response = await apiService.getTipsterIdDocument(tipster.id);
      if (response.id_document) {
        setIdDocumentUrl(response.id_document);
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
    
    try {
      if (actionType === 'approve') {
        await apiService.approveTipster(selectedTipster.id, actionNotes || 'Approved by admin');
      } else {
        await apiService.rejectTipster(selectedTipster.id, actionNotes);
      }
      
      setShowActionModal(false);
      setSelectedTipster(null);
      setActionNotes('');
      fetchTipsters(pagination.current_page);
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
              Review and approve pending tipster registrations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge color="warning" variant="light" className="text-sm">
              {pagination.total} Pending
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
          </div>
        ) : tipsters.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <UserCircleIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Pending Approvals
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              All tipster registrations have been processed.
            </p>
          </div>
        ) : (
          <>
            {/* Tipsters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tipsters.map((tipster) => (
                <div
                  key={tipster.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-lg">
                        {tipster.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {tipster.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {tipster.phone_number}
                        </p>
                      </div>
                    </div>
                    <Badge color="warning" variant="light">Pending</Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Registered:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {formatDate(tipster.created_at)}
                      </span>
                    </div>
                    {tipster.admin_notes && (
                      <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Note:</strong> {tipster.admin_notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewIdDocument(tipster)}
                      className="flex-1"
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View ID
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleAction(tipster, 'approve')}
                      className="flex-1"
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleAction(tipster, 'reject')}
                      className="flex-1"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                  {pagination.total} tipsters
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTipsters(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTipsters(pagination.current_page + 1)}
                    disabled={pagination.current_page === pagination.last_page}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
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
                    src={idDocumentUrl}
                    alt="ID Document"
                    className="max-w-full max-h-[600px] object-contain rounded"
                    onError={() => {
                      setError('Failed to load image. The image may be corrupted or in an unsupported format.');
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
                variant={actionType === 'approve' ? 'success' : 'danger'}
                onClick={handleActionSubmit}
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

