import { useEffect, useState, useRef } from "react";
import { apiService, Prediction, Booker, API_ORIGIN } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import { PencilIcon, TrashBinIcon, PageIcon, CheckCircleIcon } from "../../icons";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";

export default function PredictionsList() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState({
    tipster_name: "",
    status: "all",
    result_status: "all",
    date_from: "",
    date_to: "",
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [resultStatus, setResultStatus] = useState<'won' | 'lost' | 'void' | 'refunded'>('won');
  const [resultNotes, setResultNotes] = useState('');
  const [winningSlipFile, setWinningSlipFile] = useState<File | null>(null);
  const [winningSlipPreview, setWinningSlipPreview] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const resultFileInputRef = useRef<HTMLInputElement>(null);
  const addWinningSlipInputRef = useRef<HTMLInputElement>(null);
  const [showBettingSlipModal, setShowBettingSlipModal] = useState(false);
  
  // Add Prediction form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState({
    tipster_id: '',
    booker_id: '',
    title: '',
    odds_total: '',
    kickoff_at: '',
    kickend_at: '',
    confidence_level: '',
    is_premium: false,
    status: 'draft' as 'draft' | 'published',
    booking_codes: '',
  });
  const [addWinningSlip, setAddWinningSlip] = useState<File | null>(null);
  const [addWinningSlipPreview, setAddWinningSlipPreview] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [tipsters, setTipsters] = useState<any[]>([]);
  const [bookers, setBookers] = useState<Booker[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    tipster_id: '',
    booker_id: '',
    title: '',
    odds_total: '',
    kickoff_at: '',
    kickend_at: '',
    confidence_level: '',
    is_premium: false,
    status: 'draft' as 'draft' | 'published' | 'expired',
    result_status: 'pending' as 'pending' | 'won' | 'lost' | 'void' | 'refunded',
    booking_codes: '',
  });
  const [editWinningSlip, setEditWinningSlip] = useState<File | null>(null);
  const [editWinningSlipPreview, setEditWinningSlipPreview] = useState<string>('');
  const editWinningSlipInputRef = useRef<HTMLInputElement>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [bettingSlipPreviewUrl, setBettingSlipPreviewUrl] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [predictionToDelete, setPredictionToDelete] = useState<Prediction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPredictions = async (page = 1) => {
    try {
      setIsLoading(true);
      const params: any = { page };
      
      if (filters.tipster_name) params.tipster_name = filters.tipster_name;
      if (filters.status !== "all") params.status = filters.status;
      if (filters.result_status !== "all") params.result_status = filters.result_status;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const response = await apiService.getPredictions(params);
      setPredictions(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to load predictions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [filters]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    fetchTipsters();
    fetchBookers();
  }, []);

  const fetchTipsters = async () => {
    try {
      const response = await apiService.getTipsters();
      setTipsters(response.data);
    } catch (err: any) {
      console.error('Failed to fetch tipsters:', err);
    }
  };

  const fetchBookers = async () => {
    try {
      const response = await apiService.getBookers({ simple: true });
      setBookers(response.data);
    } catch (err: any) {
      console.error('Failed to fetch bookers:', err);
    }
  };

  const toDateTimeLocalValue = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const bookingCodesToString = (codes: Prediction['booking_codes']) => {
    if (Array.isArray(codes)) {
      return codes.join(', ');
    }

    if (typeof codes === 'string') {
      try {
        const parsed = JSON.parse(codes);
        if (Array.isArray(parsed)) {
          return parsed.join(', ');
        }
      } catch {
        return codes;
      }
    }

    return '';
  };

  const resolveBettingSlipUrl = (url?: string | null) => {
    if (!url) return '';
    
    // If it's already a full URL, check if it needs host replacement
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const urlObj = new URL(url);
        // If the host is 'localhost' without port, replace with API_ORIGIN
        if (urlObj.hostname === 'localhost' && !urlObj.port) {
          try {
            const apiOriginUrl = new URL(API_ORIGIN);
            urlObj.host = apiOriginUrl.host; // This includes port if present
            return urlObj.toString();
          } catch {
            // Fallback: if API_ORIGIN is invalid, default to port 8000
            urlObj.port = '8000';
            return urlObj.toString();
          }
        }
        return url;
      } catch {
        return url;
      }
    }
    
    if (url.startsWith('//')) {
      return `${window.location.protocol}${url}`;
    }
    
    // For relative URLs, prepend API_ORIGIN
    if (url.startsWith('/')) {
      try {
        const apiOriginUrl = new URL(API_ORIGIN);
        return `${apiOriginUrl.origin}${url}`;
      } catch {
        // Fallback: if API_ORIGIN is invalid, use default
        const defaultOrigin = `${window.location.protocol}//${window.location.hostname}:8000`;
        return `${defaultOrigin}${url}`;
      }
    }
    
    // For non-absolute paths
    try {
      const apiOriginUrl = new URL(API_ORIGIN);
      return `${apiOriginUrl.origin}/${url}`;
    } catch {
      const defaultOrigin = `${window.location.protocol}//${window.location.hostname}:8000`;
      return `${defaultOrigin}/${url}`;
    }
  };

  const handleAddPrediction = async () => {
    setSuccess('');
    if (!addFormData.tipster_id || !addFormData.booker_id || !addFormData.title || 
        !addFormData.odds_total || !addFormData.kickoff_at || !addFormData.confidence_level) {
      setError('Please fill in all required fields.');
      return;
    }

    const kickoffDate = new Date(addFormData.kickoff_at);
    if (Number.isNaN(kickoffDate.getTime())) {
      setError('Please choose a valid kickoff date and time.');
      return;
    }

    if (kickoffDate <= new Date()) {
      setError('Kickoff time must be in the future.');
      return;
    }

    let kickendDate: Date | null = null;
    if (addFormData.kickend_at) {
      kickendDate = new Date(addFormData.kickend_at);
      if (Number.isNaN(kickendDate.getTime())) {
        setError('Please choose a valid kickend date and time.');
        return;
      }

      if (kickendDate <= kickoffDate) {
        setError('Kickend time must be after kickoff time.');
        return;
      }
    }

    setIsCreating(true);
    try {
      const bookingCodes = addFormData.booking_codes 
        ? addFormData.booking_codes.split(',').map(code => code.trim()).filter(code => code)
        : [];

      const payload: any = {
        tipster_id: parseInt(addFormData.tipster_id, 10),
        booker_id: parseInt(addFormData.booker_id, 10),
        title: addFormData.title,
        odds_total: parseFloat(addFormData.odds_total),
        kickoff_at: kickoffDate.toISOString(),
        confidence_level: parseInt(addFormData.confidence_level, 10),
        is_premium: addFormData.is_premium,
        status: addFormData.status,
        booking_codes: bookingCodes,
      };

      if (kickendDate) {
        payload.kickend_at = kickendDate.toISOString();
      }

      let bettingSlipFile: File | null = addWinningSlip ?? null;
      if (!bettingSlipFile && addWinningSlipInputRef.current?.files?.[0]) {
        bettingSlipFile = addWinningSlipInputRef.current.files[0];
      }

      if (bettingSlipFile) {
        payload.betting_slip = bettingSlipFile;
      }

      const response = await apiService.createPrediction(payload);

      toggleAddForm();
      setError('');
      setSuccess('Prediction created successfully!');
      setPredictions((prev) => [response.prediction, ...prev]);
      fetchPredictions(pagination.current_page);
    } catch (err: any) {
      setError(err.message || 'Failed to create prediction');
      setSuccess('');
    } finally {
      setIsCreating(false);
    }
  };

  const resetAddForm = () => {
    setAddFormData({
      tipster_id: '',
      booker_id: '',
      title: '',
      odds_total: '',
      kickoff_at: '',
      kickend_at: '',
      confidence_level: '',
      is_premium: false,
      status: 'draft',
      booking_codes: '',
    });
    setAddWinningSlip(null);
    setAddWinningSlipPreview('');
    if (addWinningSlipInputRef.current) {
      addWinningSlipInputRef.current.value = '';
    }
  };

  const toggleAddForm = () => {
    setShowAddForm((prev) => {
      const next = !prev;
      setError('');
      if (!next) {
        resetAddForm();
      }
      return next;
    });
  };

  const handleAddWinningSlipChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setAddWinningSlip(null);
      setAddWinningSlipPreview('');
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Winning slip must be a JPG or PNG image.');
      event.target.value = '';
      setAddWinningSlip(null);
      setAddWinningSlipPreview('');
      return;
    }

    setError('');
    setAddWinningSlip(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setAddWinningSlipPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEditWinningSlipChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setEditWinningSlip(null);
      setEditWinningSlipPreview(resolveBettingSlipUrl(selectedPrediction?.betting_slip_url));
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Betting slip must be a JPG or PNG image.');
      event.target.value = '';
      setEditWinningSlip(null);
      setEditWinningSlipPreview(resolveBettingSlipUrl(selectedPrediction?.betting_slip_url));
      return;
    }

    setError('');
    setEditWinningSlip(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setEditWinningSlipPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleViewBettingSlip = (prediction: Prediction) => {
    const resolvedUrl = resolveBettingSlipUrl(prediction.betting_slip_url);
    if (!resolvedUrl) {
      setError('No betting slip available for this prediction.');
      return;
    }
    setSelectedPrediction(prediction);
    setBettingSlipPreviewUrl(resolvedUrl);
    setShowBettingSlipModal(true);
  };

  const handleEditPrediction = (prediction: Prediction) => {
    setSelectedPrediction(prediction);
    setEditFormData({
      tipster_id: prediction.tipster_id ? String(prediction.tipster_id) : '',
      booker_id: prediction.booker_id ? String(prediction.booker_id) : '',
      title: prediction.title ?? '',
      odds_total:
        prediction.odds_total !== undefined && prediction.odds_total !== null
          ? String(prediction.odds_total)
          : '',
      kickoff_at: toDateTimeLocalValue(prediction.kickoff_at),
      kickend_at: toDateTimeLocalValue(prediction.kickend_at),
      confidence_level:
        prediction.confidence_level !== undefined && prediction.confidence_level !== null
          ? String(prediction.confidence_level)
          : '',
      is_premium: !!prediction.is_premium,
      status: (prediction.status as 'draft' | 'published' | 'expired') ?? 'draft',
      result_status: (prediction.result_status as 'pending' | 'won' | 'lost' | 'void' | 'refunded') ?? 'pending',
      booking_codes: bookingCodesToString(prediction.booking_codes),
    });
    setEditWinningSlip(null);
    setEditWinningSlipPreview(resolveBettingSlipUrl(prediction.betting_slip_url));
    if (editWinningSlipInputRef.current) {
      editWinningSlipInputRef.current.value = '';
    }
    setError('');
    setSuccess('');
    setShowEditModal(true);
  };

  const handleDelete = (prediction: Prediction) => {
    setPredictionToDelete(prediction);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!predictionToDelete) return;
    
    setIsDeleting(true);
      try {
      await apiService.deletePrediction(predictionToDelete.id);
      setSuccess('Prediction deleted successfully!');
      setShowDeleteModal(false);
      setPredictionToDelete(null);
        fetchPredictions(pagination.current_page);
      } catch (err: any) {
        setError(err.message || "Failed to delete prediction");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPredictionToDelete(null);
  };

  const handleUpdateResult = (prediction: Prediction) => {
    setSelectedPrediction(prediction);
    setResultStatus('won');
    setResultNotes('');
    setWinningSlipFile(null);
    setWinningSlipPreview('');
    setShowResultModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setWinningSlipFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setWinningSlipPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResultSubmit = async () => {
    if (!selectedPrediction) return;

    if (resultStatus === 'won' && !winningSlipFile) {
      setError('Winning slip is required for won predictions.');
      return;
    }

    setIsUpdating(true);
    try {
      await apiService.updatePredictionResult(selectedPrediction.id, {
        result_status: resultStatus,
        result_notes: resultNotes,
        winning_slip: winningSlipFile || undefined,
      });

      setShowResultModal(false);
      setSelectedPrediction(null);
      setResultStatus('won');
      setResultNotes('');
      setWinningSlipFile(null);
      setWinningSlipPreview('');
      if (resultFileInputRef.current) {
        resultFileInputRef.current.value = '';
      }
      setError('');
      fetchPredictions(pagination.current_page);
    } catch (err: any) {
      setError(err.message || 'Failed to update prediction result');
    } finally {
      setIsUpdating(false);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedPrediction(null);
    setEditWinningSlip(null);
    setEditWinningSlipPreview('');
    setBettingSlipPreviewUrl('');
    if (editWinningSlipInputRef.current) {
      editWinningSlipInputRef.current.value = '';
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedPrediction) return;
    if (editLoading) return;

    if (
      !editFormData.booker_id ||
      !editFormData.title.trim() ||
      !editFormData.odds_total ||
      !editFormData.kickoff_at ||
      !editFormData.confidence_level
    ) {
      setError('Please fill in all required fields for the prediction.');
      return;
    }

    const kickoffDate = new Date(editFormData.kickoff_at);
    if (Number.isNaN(kickoffDate.getTime())) {
      setError('Please choose a valid kickoff date and time.');
      return;
    }

    let kickendDate: Date | null = null;
    if (editFormData.kickend_at) {
      kickendDate = new Date(editFormData.kickend_at);
      if (Number.isNaN(kickendDate.getTime())) {
        setError('Please choose a valid kickend date and time.');
        return;
      }

      if (kickendDate <= kickoffDate) {
        setError('Kickend time must be after kickoff time.');
        return;
      }
    }

    const bookingCodesArray = editFormData.booking_codes
      ? editFormData.booking_codes.split(',').map(code => code.trim()).filter(code => code)
      : [];

    const formData = new FormData();
    formData.append('booker_id', editFormData.booker_id);
    formData.append('title', editFormData.title.trim());
    formData.append('odds_total', editFormData.odds_total);
    formData.append('kickoff_at', kickoffDate.toISOString());
    if (kickendDate) {
      formData.append('kickend_at', kickendDate.toISOString());
    }
    formData.append('confidence_level', editFormData.confidence_level);
    formData.append('is_premium', editFormData.is_premium ? '1' : '0');
    formData.append('status', editFormData.status);
    formData.append('result_status', editFormData.result_status);

    bookingCodesArray.forEach((code, index) => {
      formData.append(`booking_codes[${index}]`, code);
    });

    const slipFile =
      editWinningSlip ??
      editWinningSlipInputRef.current?.files?.[0] ??
      null;

    if (slipFile) {
      formData.append('betting_slip', slipFile);
    }

    setEditLoading(true);
    try {
      const response = await apiService.updatePrediction(selectedPrediction.id, formData);
      setPredictions((prev) =>
        prev.map((prediction) =>
          prediction.id === response.prediction.id
            ? {
                ...prediction,
                ...response.prediction,
              }
            : prediction
        )
      );
      setError('');
      setSuccess('Prediction updated successfully!');
      closeEditModal();
      await fetchPredictions(pagination.current_page);
    } catch (err: any) {
      setError(err.message || 'Failed to update prediction');
    } finally {
      setEditLoading(false);
    }
  };

  const needsResultUpdate = (prediction: Prediction) => {
    return prediction.status === 'published' && 
           prediction.result_status === 'pending' && 
           prediction.kickend_at && 
           new Date(prediction.kickend_at).getTime() + (180 * 60 * 1000) < new Date().getTime();
  };

  const getTimeRemaining = (prediction: Prediction) => {
    if (!prediction.kickend_at) return null;
    
    const kickendTime = new Date(prediction.kickend_at).getTime();
    const deadlineTime = kickendTime + (180 * 60 * 1000); // 180 minutes
    const now = new Date().getTime();
    const remaining = deadlineTime - now;
    
    if (remaining <= 0) return 'Overdue';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge color="light" size="sm">Draft</Badge>;
      case "published":
        return <Badge color="success" size="sm">Published</Badge>;
      case "expired":
        return <Badge color="error" size="sm">Expired</Badge>;
      default:
        return <Badge color="light" size="sm">Unknown</Badge>;
    }
  };

  const getResultBadge = (resultStatus: string) => {
    switch (resultStatus) {
      case "pending":
        return <Badge color="warning" size="sm">Pending</Badge>;
      case "won":
        return <Badge color="success" size="sm">Won</Badge>;
      case "lost":
        return <Badge color="error" size="sm">Lost</Badge>;
      case "void":
        return <Badge color="info" size="sm">Void</Badge>;
      case "refunded":
        return <Badge color="info" size="sm">Refunded</Badge>;
      default:
        return <Badge color="light" size="sm">Unknown</Badge>;
    }
  };

  if (isLoading && predictions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Predictions Management"
        description="Manage predictions, view details, and update status"
      />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Predictions Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage all predictions from tipsters
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              onClick={toggleAddForm}
              className="flex items-center gap-2"
            >
              {showAddForm ? (
                'Close Form'
              ) : (
                <>
              <PencilIcon className="w-4 h-4" />
              Add Prediction
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Add Prediction Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Add New Prediction
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipster Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipster *
                </label>
                <select
                  value={addFormData.tipster_id}
                  onChange={(e) => setAddFormData({ ...addFormData, tipster_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Select Tipster</option>
                  {tipsters.map((tipster) => (
                    <option key={tipster.id} value={tipster.id}>
                      {tipster.name} ({tipster.phone_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Booker Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Booker *
                </label>
                <select
                  value={addFormData.booker_id}
                  onChange={(e) => setAddFormData({ ...addFormData, booker_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Select Booker</option>
                  {bookers.map((booker) => (
                    <option key={booker.id} value={booker.id}>
                      {booker.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <Input
                  type="text"
                  value={addFormData.title}
                  onChange={(e) => setAddFormData({ ...addFormData, title: e.target.value })}
                  placeholder="Enter prediction title"
                />
              </div>

              {/* Odds Total */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Odds Total *
                </label>
                <Input
                  type="number"
                  step={0.01}
                  min="1"
                  value={addFormData.odds_total}
                  onChange={(e) => setAddFormData({ ...addFormData, odds_total: e.target.value })}
                  placeholder="e.g., 2.50"
                />
              </div>

              {/* Kickoff Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kickoff Time *
                </label>
                <Input
                  type="datetime-local"
                  value={addFormData.kickoff_at}
                  onChange={(e) => setAddFormData({ ...addFormData, kickoff_at: e.target.value })}
                />
              </div>

              {/* Kickend Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kickend Time (Optional)
                </label>
                <Input
                  type="datetime-local"
                  value={addFormData.kickend_at}
                  onChange={(e) => setAddFormData({ ...addFormData, kickend_at: e.target.value })}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  When the match/event ends. Used to determine when results can be updated.
                </p>
              </div>

              {/* Confidence Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confidence Level (1-10) *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={addFormData.confidence_level}
                  onChange={(e) => setAddFormData({ ...addFormData, confidence_level: e.target.value })}
                  placeholder="1-10"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={addFormData.status}
                  onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value as 'draft' | 'published' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              {/* Booking Codes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Booking Codes (comma-separated)
                </label>
                <Input
                  type="text"
                  value={addFormData.booking_codes}
                  onChange={(e) => setAddFormData({ ...addFormData, booking_codes: e.target.value })}
                  placeholder="e.g., ABC123, DEF456"
                />
              </div>

              {/* Premium Checkbox */}
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={addFormData.is_premium}
                    onChange={(e) => setAddFormData({ ...addFormData, is_premium: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Premium Prediction
                  </span>
                </label>
            </div>

              {/* Betting Slip Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Betting Slip (Optional, JPG/PNG)
                </label>
                <div className="flex items-center justify-between border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-gray-50 dark:bg-gray-900">
                  <div className="mr-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {addWinningSlip ? addWinningSlip.name : 'Upload betting slip image'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Maximum size 5 MB. Accepted formats: JPG, PNG.
                    </p>
                  </div>
              <Button
                variant="outline"
                    onClick={() => addWinningSlipInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                  <input
                    ref={addWinningSlipInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleAddWinningSlipChange}
                    className="hidden"
                  />
                </div>
                {addWinningSlipPreview && (
                  <img
                    src={addWinningSlipPreview}
                    alt="Betting Slip Preview"
                    className="mt-3 max-h-48 rounded-lg shadow border border-gray-200 dark:border-gray-700"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button type="button" variant="outline" onClick={toggleAddForm}>
                Cancel
              </Button>
              <Button type="button" onClick={handleAddPrediction} disabled={isCreating} className="flex items-center gap-2">
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  'Create Prediction'
                )}
              </Button>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 text-green-600 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
            {success}
          </div>
        )}

        {error && (
          <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Filters Card */}
        <div className="bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-0">
              Filters
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFilters({
                tipster_name: "",
                status: "all",
                result_status: "all",
                date_from: "",
                date_to: "",
              })}
            >
              Clear Filters
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipster Name
              </label>
              <Input
                placeholder="Enter Tipster Name"
                value={filters.tipster_name}
                onChange={(e) => setFilters({ ...filters, tipster_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full h-11 rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Result Status
              </label>
              <select
                value={filters.result_status}
                onChange={(e) => setFilters({ ...filters, result_status: e.target.value })}
                className="w-full h-11 rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Results</option>
                <option value="pending">Pending</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="void">Void</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Date
              </label>
              <Input
                type="date"
                placeholder="From Date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Date
              </label>
              <Input
                type="date"
                placeholder="To Date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Predictions Table */}
        <div className="bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Prediction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Tipster
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Booker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Result
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Time Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {predictions.map((prediction) => (
                  <tr key={prediction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {prediction.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {prediction.description?.substring(0, 50)}...
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(prediction.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {prediction.tipster?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {prediction.tipster?.phone_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {prediction.booker?.name || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(prediction.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getResultBadge(prediction.result_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {prediction.confidence_level || 0}/10
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {prediction.is_premium ? 'Premium' : 'Free'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {getTimeRemaining(prediction) ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            needsResultUpdate(prediction) 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {getTimeRemaining(prediction)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">No deadline</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewBettingSlip(prediction)}
                          className="flex items-center gap-1"
                        >
                          <PageIcon className="w-4 h-4" />
                          <span className="sr-only">View Betting Slip</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPrediction(prediction)}
                          className="flex items-center gap-1"
                        >
                          <PencilIcon className="w-4 h-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateResult(prediction)}
                          className="flex items-center gap-1"
                          >
                          <CheckCircleIcon className="w-4 h-4" />
                          <span className="sr-only">Update Result</span>
                          </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(prediction)}
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
                    onClick={() => fetchPredictions(pagination.current_page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pagination.current_page === pagination.last_page}
                    onClick={() => fetchPredictions(pagination.current_page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Prediction Modal */}
        {showEditModal && selectedPrediction && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Edit Prediction
                </h2>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEditSubmit();
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tipster
                    </label>
                    <Input
                      value={selectedPrediction.tipster?.name || `Tipster #${selectedPrediction.tipster_id}`}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Booker *
                    </label>
                    <select
                      value={editFormData.booker_id}
                      onChange={(e) => setEditFormData({ ...editFormData, booker_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    >
                      <option value="">Select Booker</option>
                      {bookers.map((booker) => (
                        <option key={booker.id} value={booker.id}>
                          {booker.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title *
                    </label>
                    <Input
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      placeholder="Enter prediction title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Odds Total *
                    </label>
                    <Input
                      type="number"
                      step={0.01}
                      min="1"
                      value={editFormData.odds_total}
                      onChange={(e) => setEditFormData({ ...editFormData, odds_total: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kickoff Time *
                    </label>
                    <Input
                      type="datetime-local"
                      value={editFormData.kickoff_at}
                      onChange={(e) => setEditFormData({ ...editFormData, kickoff_at: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kickend Time (Optional)
                    </label>
                    <Input
                      type="datetime-local"
                      value={editFormData.kickend_at}
                      onChange={(e) => setEditFormData({ ...editFormData, kickend_at: e.target.value })}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      When the match/event ends. Used to determine when results can be updated.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confidence Level (1-10) *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={editFormData.confidence_level}
                      onChange={(e) => setEditFormData({ ...editFormData, confidence_level: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as 'draft' | 'published' | 'expired' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Result Status
                    </label>
                    <select
                      value={editFormData.result_status}
                      onChange={(e) => setEditFormData({ ...editFormData, result_status: e.target.value as typeof editFormData.result_status })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                      <option value="void">Void</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Booking Codes (comma-separated)
                    </label>
                    <Input
                      value={editFormData.booking_codes}
                      onChange={(e) => setEditFormData({ ...editFormData, booking_codes: e.target.value })}
                      placeholder="e.g., ABC123, DEF456"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.is_premium}
                        onChange={(e) => setEditFormData({ ...editFormData, is_premium: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Premium Prediction
                      </span>
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Betting Slip (Optional, JPG/PNG)
                    </label>
                    <div className="flex items-center justify-between border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-gray-50 dark:bg-gray-900">
                      <div className="mr-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {editWinningSlip
                            ? editWinningSlip.name
                            : editWinningSlipPreview
                            ? 'Current betting slip selected'
                            : selectedPrediction.betting_slip_url
                            ? 'Existing betting slip will be kept'
                            : 'Upload betting slip image'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Maximum size 5 MB. Accepted formats: JPG, PNG.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => editWinningSlipInputRef.current?.click()}
                      >
                        Choose File
                      </Button>
                      <input
                        ref={editWinningSlipInputRef}
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleEditWinningSlipChange}
                        className="hidden"
                      />
                    </div>
                    {editWinningSlipPreview && (
                      <img
                        src={editWinningSlipPreview}
                        alt="Betting Slip Preview"
                        className="mt-3 max-h-48 rounded-lg shadow border border-gray-200 dark:border-gray-700"
                      />
                    )}
                    {!editWinningSlipPreview && selectedPrediction.betting_slip_url && (
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Current slip will be kept if a new one is not uploaded.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={closeEditModal}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={editLoading} className="flex items-center gap-2">
                    {editLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Updating...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Result Update Modal */}
        {showResultModal && selectedPrediction && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Update Prediction Result
                </h2>
                <button
                  onClick={() => {
                    setShowResultModal(false);
                    setSelectedPrediction(null);
                    setResultStatus('won');
                    setResultNotes('');
                    setWinningSlipFile(null);
                    setWinningSlipPreview('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                handleResultSubmit();
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prediction
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {selectedPrediction.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedPrediction.description}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Result Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={resultStatus}
                    onChange={(e) => setResultStatus(e.target.value as any)}
                  >
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                    <option value="void">Void</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                {resultStatus === 'won' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Winning Slip (Required)
                    </label>
                    <input
                      ref={resultFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                    />
                    {winningSlipPreview && (
                      <img
                        src={winningSlipPreview}
                        alt="Winning Slip Preview"
                        className="mt-2 rounded shadow max-h-32"
                      />
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={resultNotes}
                    onChange={(e) => setResultNotes(e.target.value)}
                    placeholder="Enter any notes about the result..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div className="flex space-x-3">
                  <Button 
                    disabled={isUpdating || (resultStatus === 'won' && !winningSlipFile)}
                    className="flex items-center gap-2"
                  >
                    {isUpdating ? 'Updating...' : 'Update Result'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowResultModal(false);
                      setSelectedPrediction(null);
                      setResultStatus('won');
                      setResultNotes('');
                      setWinningSlipFile(null);
                      setWinningSlipPreview('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showBettingSlipModal && selectedPrediction && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Betting Slip Preview
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedPrediction.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowBettingSlipModal(false);
                    setSelectedPrediction(null);
                    setBettingSlipPreviewUrl('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                {bettingSlipPreviewUrl ? (
                  <img
                    src={bettingSlipPreviewUrl}
                    alt="Betting Slip"
                    className="max-h-[70vh] mx-auto rounded-lg shadow-lg"
                  />
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    No betting slip available for this prediction.
                  </p>
                )}
              </div>

              {bettingSlipPreviewUrl && (
                <div className="mt-4 flex justify-end gap-3">
                  <a
                    href={bettingSlipPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                  >
                    Open Full Size
                  </a>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBettingSlipModal(false);
                      setSelectedPrediction(null);
                      setBettingSlipPreviewUrl('');
                    }}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && predictionToDelete && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Delete Prediction
                </h2>
                <button
                  onClick={cancelDelete}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
                  disabled={isDeleting}
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Are you sure you want to delete this prediction?
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {predictionToDelete.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Tipster: {predictionToDelete.tipster?.name || 'Unknown'}
                  </p>
                  {predictionToDelete.booker && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Booker: {predictionToDelete.booker.name}
                    </p>
                  )}
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mt-3">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={cancelDelete}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </span>
                  ) : (
                    'Delete Prediction'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 