import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';

const PushNotificationPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    // Check initial notification permission status
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
      
      // Show prompt only if permission is not granted or denied
      if (Notification.permission === 'default' && !sessionStorage.getItem('pushPromptDismissed')) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 10000); // Delay prompt to not overwhelm the user
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleEnableClick = async () => {
    if (!('Notification' in window)) return;

    // Request permission
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    setShowPrompt(false);

    if (permission === 'granted') {
      console.log('Push notification permission granted.');
      // Here you would typically send the subscription to your server
    } else {
      console.log('Push notification permission denied.');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pushPromptDismissed', 'true');
  };

  // Only render the prompt if permission is 'default'
  if (permissionStatus !== 'default') {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-40 sm:bottom-28 left-4 right-4 sm:left-auto sm:right-6 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 sm:w-80"
        >
          <button 
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-govBlue rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <Bell className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Enable Notifications</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">
                Stay updated with real-time alerts on your work orders.
              </p>
              <button
                onClick={handleEnableClick}
                className="w-full bg-govBlue hover:bg-govBlue-dark text-white text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Bell className="w-4 h-4" /> Enable Notifications
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PushNotificationPrompt;