import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/ui/modal';
import Button from '../components/ui/button/Button';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
const WARNING_TIME = 30 * 1000; // 30 seconds warning before logout

export const useAutoLogout = () => {
  const { logout, isAuthenticated } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const lastActivityRef = useRef<number>(Date.now());
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    // Reset warning state
    setShowWarning(false);
    setCountdown(30);
    lastActivityRef.current = Date.now();
  }, []);

  const handleLogout = useCallback(async () => {
    // Clear all timers
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    setShowWarning(false);
    await logout();
  }, [logout]);

  const startInactivityTimer = useCallback(() => {
    if (!isAuthenticated) return;

    // Clear any existing timer first
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Set new inactivity timer
    inactivityTimerRef.current = setTimeout(() => {
      // Show warning modal
      setShowWarning(true);
      setCountdown(30);

      // Start countdown
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Time's up, logout
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Set final logout timer
      warningTimerRef.current = setTimeout(() => {
        handleLogout();
      }, WARNING_TIME);
    }, INACTIVITY_TIMEOUT);
  }, [isAuthenticated, handleLogout]);

  const handleStay = useCallback(() => {
    // User chose to stay, reset timers and restart inactivity timer
    resetTimers();
    startInactivityTimer();
  }, [resetTimers, startInactivityTimer]);

  // Track user activity
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear timers if not authenticated
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      setShowWarning(false);
      return;
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      const now = Date.now();
      // Only reset if user was actually inactive (more than 1 second since last activity)
      if (now - lastActivityRef.current > 1000) {
        resetTimers();
        startInactivityTimer();
      }
      lastActivityRef.current = now;
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize timer
    resetTimers();
    startInactivityTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isAuthenticated, resetTimers, startInactivityTimer]);

  // Warning Modal Component
  const WarningModal = () => {
    if (!showWarning) return null;

    return (
      <Modal
        isOpen={showWarning}
        onClose={handleStay}
        showCloseButton={false}
        className="max-w-md"
      >
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
            Session Timeout Warning
          </h2>

          <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
            You've been inactive for 5 minutes. You will be logged out in{' '}
            <span className="font-semibold text-yellow-600 dark:text-yellow-400">
              {countdown} seconds
            </span>
            .
          </p>

          <div className="flex space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={handleStay}
              className="flex-1"
            >
              Stay Logged In
            </Button>
            <Button
              variant="primary"
              onClick={handleLogout}
              className="flex-1"
            >
              Log Out Now
            </Button>
          </div>
        </div>
      </Modal>
    );
  };

  return { WarningModal };
};

