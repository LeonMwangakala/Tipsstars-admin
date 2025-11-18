import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import Badge from '../ui/badge/Badge';
import Button from '../ui/button/Button';
import Input from '../form/input/InputField';

interface TipsterEarnings {
  total_earnings: number;
  available_balance: number;
  min_withdrawal_limit: number;
}

interface WithdrawalRequest {
  id: number;
  amount: number;
  status: 'pending' | 'paid' | 'rejected' | 'cancelled';
  requested_at: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
}

interface TipsterWithdrawalCardProps {
  tipsterId: number;
  onWithdrawalRequested?: () => void;
}

const TipsterWithdrawalCard: React.FC<TipsterWithdrawalCardProps> = ({ 
  tipsterId, 
  onWithdrawalRequested 
}) => {
  const [earnings, setEarnings] = useState<TipsterEarnings | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getWithdrawals(`tipster_id=${tipsterId}`);
      setWithdrawals(response.data);
      setEarnings(response.earnings_summary || null);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch withdrawal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tipsterId]);

  const handleWithdrawalRequest = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setRequesting(true);
      setError('');
      setSuccess('');

      await apiService.createWithdrawalRequest({
        amount: parseFloat(amount),
      });

      setSuccess('Withdrawal request submitted successfully!');
      setAmount('');
      fetchData();
      onWithdrawalRequested?.();
    } catch (error: any) {
      setError(error.message || 'Failed to submit withdrawal request');
    } finally {
      setRequesting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const colorMap = {
      pending: 'warning' as const,
      paid: 'success' as const,
      rejected: 'error' as const,
      cancelled: 'light' as const,
    };
    return <Badge color={colorMap[status as keyof typeof colorMap]}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!earnings) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="text-center text-gray-500">
          Unable to load earnings data
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Earnings Summary */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Your Earnings</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Earnings</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(earnings.total_earnings)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Available Balance</span>
            <span className="font-semibold text-blue-600">
              {formatCurrency(earnings.available_balance)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Min Withdrawal</span>
            <span className="font-semibold text-gray-800">
              {formatCurrency(earnings.min_withdrawal_limit)}
            </span>
          </div>
        </div>
      </div>

      {/* Withdrawal Request Form */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Request Withdrawal</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (TZS)
            </label>
                         <Input
               type="number"
               placeholder={`Minimum: ${formatCurrency(earnings.min_withdrawal_limit)}`}
               value={amount}
               onChange={(e) => setAmount(e.target.value)}
             />
          </div>
          
          <Button
            onClick={handleWithdrawalRequest}
            disabled={requesting || !amount || parseFloat(amount) < earnings.min_withdrawal_limit || parseFloat(amount) > earnings.available_balance}
            className="w-full"
          >
            {requesting ? 'Submitting...' : 'Request Withdrawal'}
          </Button>
          
          <div className="text-xs text-gray-500 text-center">
            Available balance: {formatCurrency(earnings.available_balance)}
          </div>
        </div>
      </div>

      {/* Recent Withdrawals */}
      {withdrawals.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Recent Withdrawals</h3>
          
          <div className="space-y-3">
            {withdrawals.slice(0, 5).map((withdrawal) => (
              <div key={withdrawal.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{formatCurrency(withdrawal.amount)}</div>
                  <div className="text-sm text-gray-500">
                    {formatDate(withdrawal.requested_at)}
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(withdrawal.status)}
                  {withdrawal.notes && (
                    <div className="text-xs text-gray-500 mt-1">
                      {withdrawal.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {withdrawals.length > 5 && (
            <div className="text-center mt-4">
              <button className="text-blue-600 text-sm hover:underline">
                View All ({withdrawals.length} total)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TipsterWithdrawalCard; 