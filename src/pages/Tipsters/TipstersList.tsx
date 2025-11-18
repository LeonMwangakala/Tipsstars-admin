import { useEffect, useState, useRef } from "react";
import { apiService, Tipster, CommissionConfig } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import { UserCircleIcon, PencilIcon } from "../../icons";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";

const WEEKLY_LIMIT = 10000;
const MONTHLY_LIMIT = 40000;

export default function TipstersList() {
  const [tipsters, setTipsters] = useState<Tipster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addTipsterName, setAddTipsterName] = useState('');
  const [addTipsterPhone, setAddTipsterPhone] = useState('');
  const [addTipsterPassword, setAddTipsterPassword] = useState('');
  const [addTipsterPassword2, setAddTipsterPassword2] = useState('');
  const [addTipsterIdBase64, setAddTipsterIdBase64] = useState('');
  const [addTipsterLoading, setAddTipsterLoading] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedTipster, setSelectedTipster] = useState<Tipster | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'revoke'>('approve');
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTipsterName, setEditTipsterName] = useState('');
  const [editTipsterPhone, setEditTipsterPhone] = useState('');
  const [editTipsterLoading, setEditTipsterLoading] = useState(false);
  const [commissionConfigs, setCommissionConfigs] = useState<CommissionConfig[]>([]);
  const [editCommissionConfigId, setEditCommissionConfigId] = useState<number | null>(null);
  const [addCommissionConfigId, setAddCommissionConfigId] = useState<number | null>(null);
  const [addTipsterWeeklyAmount, setAddTipsterWeeklyAmount] = useState('');
  const [addTipsterMonthlyAmount, setAddTipsterMonthlyAmount] = useState('');
  const [editTipsterWeeklyAmount, setEditTipsterWeeklyAmount] = useState('');
  const [editTipsterMonthlyAmount, setEditTipsterMonthlyAmount] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetAddTipsterForm = () => {
    setAddTipsterName('');
    setAddTipsterPhone('');
    setAddTipsterPassword('');
    setAddTipsterPassword2('');
    setAddTipsterIdBase64('');
    setAddCommissionConfigId(null);
    setAddTipsterWeeklyAmount('');
    setAddTipsterMonthlyAmount('');
    setAddTipsterLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleAddForm = () => {
    setShowAddForm((prev) => {
      const next = !prev;
      setError('');
      if (!next) {
        resetAddTipsterForm();
      }
      return next;
    });
  };

  const parsedAddWeekly = Number(addTipsterWeeklyAmount);
  const parsedAddMonthly = Number(addTipsterMonthlyAmount);
  const parsedEditWeekly = Number(editTipsterWeeklyAmount);
  const parsedEditMonthly = Number(editTipsterMonthlyAmount);

  const normalizeAmount = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) {
      return null;
    }
    const numericValue =
      typeof value === 'number' ? value : Number((value as string).replace(/,/g, ''));
    if (!Number.isFinite(numericValue)) {
      return null;
    }
    return numericValue;
  };

  const isAddWeeklyValid =
    addTipsterWeeklyAmount !== '' &&
    !Number.isNaN(parsedAddWeekly) &&
    parsedAddWeekly > 0 &&
    parsedAddWeekly <= WEEKLY_LIMIT;

  const isAddMonthlyValid =
    addTipsterMonthlyAmount !== '' &&
    !Number.isNaN(parsedAddMonthly) &&
    parsedAddMonthly > 0 &&
    parsedAddMonthly <= MONTHLY_LIMIT;

  const isEditWeeklyValid =
    editTipsterWeeklyAmount !== '' &&
    !Number.isNaN(parsedEditWeekly) &&
    parsedEditWeekly > 0 &&
    parsedEditWeekly <= WEEKLY_LIMIT;

  const isEditMonthlyValid =
    editTipsterMonthlyAmount !== '' &&
    !Number.isNaN(parsedEditMonthly) &&
    parsedEditMonthly > 0 &&
    parsedEditMonthly <= MONTHLY_LIMIT;

  const fetchTipsters = async (page = 1) => {
    try {
      setIsLoading(true);
      const response = await apiService.getTipsters({
        page,
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setTipsters(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to load tipsters");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTipsters();
    // Fetch commission configs on mount
    apiService.getCommissionConfigs({ status: 'active' }).then(res => {
      setCommissionConfigs(res.data);
    });
  }, [searchTerm, statusFilter]);

  const handleAction = (tipster: Tipster, type: 'approve' | 'reject' | 'revoke') => {
    setSelectedTipster(tipster);
    setActionType(type);
    setActionReason('');
    setShowActionModal(true);
  };

  const handleActionSubmit = async () => {
    if (!selectedTipster) return;
    
    if (actionType === 'reject' || actionType === 'revoke') {
      if (!actionReason.trim()) {
        setError('Please provide a reason for this action.');
        return;
      }
    }

    setActionLoading(true);
    try {
      if (actionType === 'approve') {
        await apiService.approveTipster(selectedTipster.id, actionReason || 'Approved by admin');
      } else if (actionType === 'reject') {
        await apiService.rejectTipster(selectedTipster.id, actionReason);
      } else if (actionType === 'revoke') {
        await apiService.rejectTipster(selectedTipster.id, actionReason); // Using reject endpoint for revoke
      }
      
      setShowActionModal(false);
      setSelectedTipster(null);
      setActionReason('');
      setError('');
      fetchTipsters(pagination.current_page);
    } catch (err: any) {
      setError(err.message || `Failed to ${actionType} tipster`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (tipster: Tipster) => {
    setSelectedTipster(tipster);
    setEditTipsterName(tipster.name);
    setEditTipsterPhone(tipster.phone_number);
    setEditCommissionConfigId(tipster.commission_config_id ?? null);
    const weeklyAmount = normalizeAmount(tipster.weekly_subscription_amount);
    const monthlyAmount = normalizeAmount(tipster.monthly_subscription_amount);
    setEditTipsterWeeklyAmount(weeklyAmount !== null ? String(weeklyAmount) : '');
    setEditTipsterMonthlyAmount(monthlyAmount !== null ? String(monthlyAmount) : '');
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedTipster || !editTipsterName.trim() || !editTipsterPhone.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    // Only validate amounts if they are provided (not empty)
    if (editTipsterWeeklyAmount !== '' && !isEditWeeklyValid) {
      setError(`Weekly subscription amount must be greater than 0 and not exceed ${WEEKLY_LIMIT.toLocaleString()} /=.`);
      return;
    }
    if (editTipsterMonthlyAmount !== '' && !isEditMonthlyValid) {
      setError(`Monthly subscription amount must be greater than 0 and not exceed ${MONTHLY_LIMIT.toLocaleString()} /=.`);
      return;
    }
    // Only validate monthly > weekly if both are provided
    if (editTipsterWeeklyAmount !== '' && editTipsterMonthlyAmount !== '' && parsedEditMonthly <= parsedEditWeekly) {
      setError('Monthly subscription amount must be greater than the weekly amount.');
      return;
    }
    setEditTipsterLoading(true);
    try {
      const updateData: {
        name: string;
        phone_number: string;
        commission_config_id?: number | null;
        weekly_subscription_amount?: number | null;
        monthly_subscription_amount?: number | null;
      } = {
        name: editTipsterName,
        phone_number: editTipsterPhone,
        commission_config_id: editCommissionConfigId,
      };

      // Only include amounts if they are provided and valid, or explicitly set to null
      if (editTipsterWeeklyAmount !== '' && isEditWeeklyValid) {
        updateData.weekly_subscription_amount = parsedEditWeekly;
      } else if (editTipsterWeeklyAmount === '') {
        updateData.weekly_subscription_amount = null;
      }

      if (editTipsterMonthlyAmount !== '' && isEditMonthlyValid) {
        updateData.monthly_subscription_amount = parsedEditMonthly;
      } else if (editTipsterMonthlyAmount === '') {
        updateData.monthly_subscription_amount = null;
      }

      await apiService.updateTipster(selectedTipster.id, updateData);
      setShowEditModal(false);
      setSelectedTipster(null);
      setEditTipsterName('');
      setEditTipsterPhone('');
      setEditCommissionConfigId(null);
       setEditTipsterWeeklyAmount('');
       setEditTipsterMonthlyAmount('');
      setError('');
      fetchTipsters(pagination.current_page);
    } catch (err: any) {
      setError(err.message || 'Failed to update tipster');
    } finally {
      setEditTipsterLoading(false);
    }
  };

  const getStatusBadge = (tipster: Tipster) => {
    switch (tipster.status) {
      case "approved":
        return <Badge color="success" size="sm">Approved</Badge>;
      case "pending":
        return <Badge color="warning" size="sm">Pending</Badge>;
      case "rejected":
        return <Badge color="error" size="sm">Rejected</Badge>;
      case "revoked":
        return <Badge color="error" size="sm">Revoked</Badge>;
      default:
        return <Badge color="light" size="sm">Unknown</Badge>;
    }
  };

  const getActionButtons = (tipster: Tipster) => {
    const buttons = [];
    
    if (tipster.status === 'pending') {
      buttons.push(
        <Button
          key="approve"
          size="sm"
          variant="outline"
          onClick={() => handleAction(tipster, 'approve')}
        >
          Approve
        </Button>
      );
      buttons.push(
        <Button
          key="reject"
          size="sm"
          variant="outline"
          onClick={() => handleAction(tipster, 'reject')}
        >
          Reject
        </Button>
      );
    } else if (tipster.status === 'approved') {
      buttons.push(
        <Button
          key="revoke"
          size="sm"
          variant="outline"
          onClick={() => handleAction(tipster, 'revoke')}
        >
          Revoke
        </Button>
      );
    }
    
    // Add view ID button for pending tipsters
    if (tipster.status === 'pending') {
      buttons.push(
        <Button
          key="view-id"
          size="sm"
          variant="outline"
          onClick={() => {
            // TODO: Implement view ID functionality
            console.log('View ID for tipster:', tipster.id);
          }}
        >
          View ID
        </Button>
      );
    }
    
    return buttons;
  };

  const renderCommissionDetails = (tipster: Tipster) => {
    if (!tipster.commission_config_id) {
      return <span className="text-sm text-gray-400">Not set</span>;
    }

    const config = commissionConfigs.find((item) => item.id === tipster.commission_config_id);
    if (config) {
      return (
        <div className="text-sm text-gray-900 dark:text-white">
          <div className="font-medium">{config.name}</div>
          <div className="text-gray-500 dark:text-gray-400">{config.commission_rate}%</div>
        </div>
      );
    }

    if (tipster.commission_config) {
      return (
        <div className="text-sm text-gray-900 dark:text-white">
          <div className="font-medium">{tipster.commission_config.name}</div>
          <div className="text-gray-500 dark:text-gray-400">{tipster.commission_config.commission_rate}%</div>
        </div>
      );
    }

    return (
      <span className="text-sm text-gray-400">
        Config #{tipster.commission_config_id}
      </span>
    );
  };

  const renderSubscriptionPricing = (tipster: Tipster) => {
    const weekly = normalizeAmount(tipster.weekly_subscription_amount);
    const monthly = normalizeAmount(tipster.monthly_subscription_amount);

    if (weekly === null && monthly === null) {
      return <span className="text-sm text-gray-400">Not set</span>;
    }

    return (
      <div className="text-sm text-gray-900 dark:text-white">
        {weekly !== null && (
          <div>
            <span className="font-medium">Weekly:</span>{' '}
            <span className="text-gray-600 dark:text-gray-300">
              {weekly.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} /=
            </span>
          </div>
        )}
        {monthly !== null && (
          <div>
            <span className="font-medium">Monthly:</span>{' '}
            <span className="text-gray-600 dark:text-gray-300">
              {monthly.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} /=
            </span>
          </div>
        )}
      </div>
    );
  };

  if (isLoading && tipsters.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Tipsters Management"
        description="Manage tipsters and their approval status"
      />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Tipsters Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage tipsters, view profiles, and approve/reject applications
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
          <Button
            size="sm"
            onClick={toggleAddForm}
            className="flex items-center gap-2"
          >
            {showAddForm ? (
              'Close Form'
            ) : (
              <>
                <PencilIcon className="w-4 h-4" />
              Add Tipster
              </>
            )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Add Tipster Form */}
        {showAddForm && (
          <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add New Tipster
            </h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!addTipsterName || !addTipsterPhone || !addTipsterPassword || !addTipsterPassword2) {
                setError('All fields are required.');
                return;
              }
              if (addTipsterPassword !== addTipsterPassword2) {
                setError('Passwords do not match.');
                return;
              }
              if (!addTipsterIdBase64) {
                setError('Please upload a JPG ID document.');
                return;
              }
              if (!addCommissionConfigId) {
                setError('Please select a commission config.');
                return;
              }
              if (!isAddWeeklyValid) {
                setError(`Weekly subscription amount must be greater than 0 and not exceed ${WEEKLY_LIMIT.toLocaleString()} /=.`);
                return;
              }
              if (!isAddMonthlyValid) {
                setError(`Monthly subscription amount must be greater than 0 and not exceed ${MONTHLY_LIMIT.toLocaleString()} /=.`);
                return;
              }
              if (parsedAddMonthly <= parsedAddWeekly) {
                setError('Monthly subscription amount must be greater than the weekly amount.');
                return;
              }
              setAddTipsterLoading(true);
              try {
                await apiService.registerUser({
                  name: addTipsterName,
                  phone_number: addTipsterPhone,
                  password: addTipsterPassword,
                  role: 'tipster',
                  id_document: addTipsterIdBase64,
                  commission_config_id: addCommissionConfigId,
                  weekly_subscription_amount: parsedAddWeekly,
                  monthly_subscription_amount: parsedAddMonthly,
                });
                setAddTipsterLoading(false);
                setShowAddForm(false);
                resetAddTipsterForm();
                setError('');
                fetchTipsters(1);
              } catch (err: any) {
                setError(err.message || 'Failed to add tipster');
                setAddTipsterLoading(false);
              }
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <Input
                    placeholder="Enter full name"
                    value={addTipsterName}
                    onChange={(e) => setAddTipsterName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <Input
                    placeholder="Enter phone number"
                    value={addTipsterPhone}
                    onChange={(e) => setAddTipsterPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={addTipsterPassword}
                    onChange={(e) => setAddTipsterPassword(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Confirm password"
                    value={addTipsterPassword2}
                    onChange={(e) => setAddTipsterPassword2(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload ID Document (JPG only)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg"
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        return;
                      }

                        if (file.type !== 'image/jpeg') {
                          setError('Only JPG files are allowed.');
                          setAddTipsterIdBase64('');
                          return;
                        }

                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setAddTipsterIdBase64((ev.target?.result as string).split(',')[1]);
                        };
                        reader.readAsDataURL(file);
                    }}
                  />
                  {addTipsterIdBase64 && (
                    <img
                      src={`data:image/jpeg;base64,${addTipsterIdBase64}`}
                      alt="ID Preview"
                      className="mt-2 rounded shadow max-h-32"
                    />
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Commission Config
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={addCommissionConfigId ?? ''}
                    onChange={e => setAddCommissionConfigId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">-- Select Commission Config --</option>
                    {commissionConfigs.map(config => (
                      <option key={config.id} value={config.id}>
                        {config.name} ({config.commission_rate}%)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Weekly Subscription Amount (TZS)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max={String(WEEKLY_LIMIT)}
                    placeholder={`Enter weekly amount (max ${WEEKLY_LIMIT.toLocaleString()})`}
                    value={addTipsterWeeklyAmount}
                    onChange={(e) => setAddTipsterWeeklyAmount(e.target.value)}
                  />
                  {!isAddWeeklyValid && addTipsterWeeklyAmount !== '' && (
                    <p className="mt-1 text-sm text-red-500">
                      Must be greater than 0 and not exceed {WEEKLY_LIMIT.toLocaleString()} /=.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monthly Subscription Amount (TZS)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max={String(MONTHLY_LIMIT)}
                    placeholder={`Enter monthly amount (max ${MONTHLY_LIMIT.toLocaleString()})`}
                    value={addTipsterMonthlyAmount}
                    onChange={(e) => setAddTipsterMonthlyAmount(e.target.value)}
                  />
                  {!isAddMonthlyValid && addTipsterMonthlyAmount !== '' && (
                    <p className="mt-1 text-sm text-red-500">
                      Must be greater than 0 and not exceed {MONTHLY_LIMIT.toLocaleString()} /=.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button 
                  disabled={
                    addTipsterLoading ||
                    !addTipsterName ||
                    !addTipsterPhone ||
                    !addTipsterPassword ||
                    !addTipsterPassword2 ||
                    !addTipsterIdBase64 ||
                    !addCommissionConfigId ||
                    !isAddWeeklyValid ||
                    !isAddMonthlyValid ||
                    parsedAddMonthly <= parsedAddWeekly
                  }
                  className="flex items-center gap-2"
                >
                  {addTipsterLoading ? 'Adding...' : 'Add Tipster'}
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
                Search Tipsters
              </label>
              <Input
                placeholder="Search by name or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={() => fetchTipsters()} className="flex-1">
                Search
              </Button>
              {searchTerm && (
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    fetchTipsters();
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

        {/* Tipsters Table */}
        <div className="bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Tipster
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Predictions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Subscribers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Subscription Pricing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Status
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
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserCircleIcon className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {tipster.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {tipster.phone_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {tipster.tipster_rating ? (
                          <div>
                            <div className="font-medium">{tipster.tipster_rating.rating_tier}</div>
                            <div className="text-gray-500">
                              {tipster.tipster_rating.star_rating} ⭐
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No rating</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {tipster.tipster_rating?.total_predictions || 0}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {tipster.tipster_rating?.win_rate || 0}% win rate
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {tipster.tipster_rating?.subscribers_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderSubscriptionPricing(tipster)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderCommissionDetails(tipster)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(tipster)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {getActionButtons(tipster)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(tipster)}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
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
                    onClick={() => fetchTipsters(pagination.current_page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.current_page === pagination.last_page}
                    onClick={() => fetchTipsters(pagination.current_page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Modal */}
        {showActionModal && selectedTipster && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Revoke'} Tipster
                </h2>
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedTipster(null);
                    setActionReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {actionType === 'approve' 
                    ? `Are you sure you want to approve ${selectedTipster.name}?`
                    : actionType === 'reject'
                    ? `Are you sure you want to reject ${selectedTipster.name}?`
                    : `Are you sure you want to revoke ${selectedTipster.name}'s approval?`
                  }
                </p>
                
                {(actionType === 'reject' || actionType === 'revoke') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reason (Required)
                    </label>
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder={`Enter reason for ${actionType === 'reject' ? 'rejection' : 'revocation'}...`}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                )}
                
                {actionType === 'approve' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Enter any notes for approval..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <Button 
                  disabled={actionLoading || (actionType !== 'approve' && !actionReason.trim())}
                  onClick={handleActionSubmit}
                  className="flex items-center gap-2"
                >
                  {actionLoading ? 'Processing...' : actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Revoke'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowActionModal(false);
                    setSelectedTipster(null);
                    setActionReason('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Tipster Modal */}
        {showEditModal && selectedTipster && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Edit Tipster
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTipster(null);
                    setEditTipsterName('');
                    setEditTipsterPhone('');
                    setEditCommissionConfigId(null);
                    setEditTipsterWeeklyAmount('');
                    setEditTipsterMonthlyAmount('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                handleEditSubmit();
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <Input
                    placeholder="Enter full name"
                    value={editTipsterName}
                    onChange={(e) => setEditTipsterName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <Input
                    placeholder="Enter phone number"
                    value={editTipsterPhone}
                    onChange={(e) => setEditTipsterPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Commission Config
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={editCommissionConfigId ?? ''}
                    onChange={e => setEditCommissionConfigId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">-- Select Commission Config --</option>
                    {commissionConfigs.map(config => (
                      <option key={config.id} value={config.id}>
                        {config.name} ({config.commission_rate}%)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Weekly Subscription Amount (TZS)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max={String(WEEKLY_LIMIT)}
                    placeholder={`Enter weekly amount (max ${WEEKLY_LIMIT.toLocaleString()})`}
                    value={editTipsterWeeklyAmount}
                    onChange={(e) => setEditTipsterWeeklyAmount(e.target.value)}
                  />
                  {!isEditWeeklyValid && editTipsterWeeklyAmount !== '' && (
                    <p className="mt-1 text-sm text-red-500">
                      Must be greater than 0 and not exceed {WEEKLY_LIMIT.toLocaleString()} /=.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Monthly Subscription Amount (TZS)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max={String(MONTHLY_LIMIT)}
                    placeholder={`Enter monthly amount (max ${MONTHLY_LIMIT.toLocaleString()})`}
                    value={editTipsterMonthlyAmount}
                    onChange={(e) => setEditTipsterMonthlyAmount(e.target.value)}
                  />
                  {!isEditMonthlyValid && editTipsterMonthlyAmount !== '' && (
                    <p className="mt-1 text-sm text-red-500">
                      Must be greater than 0 and not exceed {MONTHLY_LIMIT.toLocaleString()} /=.
                    </p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <Button 
                    disabled={
                      editTipsterLoading ||
                      !editTipsterName.trim() ||
                      !editTipsterPhone.trim() ||
                      (editTipsterWeeklyAmount !== '' && !isEditWeeklyValid) ||
                      (editTipsterMonthlyAmount !== '' && !isEditMonthlyValid) ||
                      (editTipsterWeeklyAmount !== '' && editTipsterMonthlyAmount !== '' && parsedEditMonthly <= parsedEditWeekly)
                    }
                    className="flex items-center gap-2"
                  >
                    {editTipsterLoading ? 'Updating...' : 'Update Tipster'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedTipster(null);
                      setEditTipsterName('');
                      setEditTipsterPhone('');
                      setEditCommissionConfigId(null);
                      setEditTipsterWeeklyAmount('');
                      setEditTipsterMonthlyAmount('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 