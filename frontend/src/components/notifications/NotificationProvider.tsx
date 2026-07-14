import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react';
import Notification from './Notification';

interface NotificationState {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface NotificationContextType {
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);
  const notificationId = useRef(0);

  const removeNotification = (id: number) => {
    setNotifications(prevNotifications =>
      prevNotifications.filter(notification => notification.id !== id)
    );
  };

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = notificationId.current++;
    const newNotification: NotificationState = {
      id,
      message,
      type,
    };
    setNotifications(prevNotifications => [...prevNotifications, newNotification]);

    setTimeout(() => {
      removeNotification(id);
    }, 2000);
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};