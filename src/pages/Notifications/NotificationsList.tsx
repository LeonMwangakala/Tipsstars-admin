import { useState } from "react";
import { apiService } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import { ChatIcon } from "../../icons";
import { FaPaperPlane, FaTimes } from "react-icons/fa";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";

interface NotificationForm {
  type: 'tipster' | 'customer' | 'all';
  user_ids: number[];
  title: string;
  message: string;
}

export default function NotificationsList() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<NotificationForm>({
    type: 'all',
    user_ids: [],
    title: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await apiService.sendNotification(formData);
      setSuccess("Notification sent successfully!");
      setFormData({
        type: 'all',
        user_ids: [],
        title: '',
        message: ''
      });
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || "Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: 'tipster' | 'customer' | 'all') => {
    setFormData(prev => ({
      ...prev,
      type,
      user_ids: []
    }));
  };

  return (
    <>
      <PageMeta title="Notification Management" description="Send system notifications to tipsters and customers" />
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Notification Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Send system notifications to tipsters, customers, or all users
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

      {/* Send Notification Button */}
      <div className="mb-6">
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2"
        >
          {showForm ? (
            <>
              <FaTimes className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <FaPaperPlane className="w-4 h-4" />
              Send New Notification
            </>
          )}
        </Button>
      </div>

      {/* Notification Form */}
      {showForm && (
        <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Send Notification
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Notification Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Send To
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="all"
                    checked={formData.type === 'all'}
                    onChange={() => handleTypeChange('all')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">All Users</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="tipster"
                    checked={formData.type === 'tipster'}
                    onChange={() => handleTypeChange('tipster')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Tipsters Only</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="customer"
                    checked={formData.type === 'customer'}
                    onChange={() => handleTypeChange('customer')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Customers Only</span>
                </label>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notification Title
              </label>
              <Input
                placeholder="Enter notification title..."
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notification Message
              </label>
              <textarea
                placeholder="Enter notification message..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3">
              <Button 
                disabled={loading || !formData.title || !formData.message}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="w-4 h-4" />
                    Send Notification
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Notification History */}
      <div className="bg-white rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notification History
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Recent system notifications sent
          </p>
        </div>
        
        <div className="p-6">
          <div className="text-center py-12">
            <ChatIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No notification history
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Notifications you send will appear here.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
          <h4 className="font-medium text-blue-900 dark:text-blue-100">System Maintenance</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Notify users about scheduled maintenance
          </p>
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-2"
            onClick={() => {
              setFormData({
                type: 'all',
                user_ids: [],
                title: 'System Maintenance Notice',
                message: 'We will be performing scheduled maintenance on our servers. Please expect some downtime.'
              });
              setShowForm(true);
            }}
          >
            Use Template
          </Button>
        </div>

        <div className="p-4 bg-green-50 rounded-lg dark:bg-green-900/20">
          <h4 className="font-medium text-green-900 dark:text-green-100">New Features</h4>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            Announce new platform features to users
          </p>
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-2"
            onClick={() => {
              setFormData({
                type: 'all',
                user_ids: [],
                title: 'New Features Available!',
                message: 'We\'ve added exciting new features to improve your experience. Check them out!'
              });
              setShowForm(true);
            }}
          >
            Use Template
          </Button>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg dark:bg-yellow-900/20">
          <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Tipster Reminder</h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            Remind tipsters to post predictions
          </p>
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-2"
            onClick={() => {
              setFormData({
                type: 'tipster',
                user_ids: [],
                title: 'Post Your Predictions',
                message: 'Don\'t forget to share your predictions with your subscribers!'
              });
              setShowForm(true);
            }}
          >
            Use Template
          </Button>
        </div>
      </div>
    </>
  );
} 