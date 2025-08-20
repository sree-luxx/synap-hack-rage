import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  onClose
}) => {
  const Icon = icons[type];

  const getToastClasses = () => {
    const classMap = {
      success: 'toast-success',
      error: 'toast-error',
      warning: 'bg-yellow-900/20 border-yellow-500 text-yellow-400',
      info: 'toast-info'
    };
    return classMap[type];
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
      className={`${getToastClasses()} rounded-lg p-4 shadow-lg backdrop-blur-md max-w-sm w-full`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          {message && (
            <p className="mt-1 text-sm opacity-90">{message}</p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={() => onClose(id)}
            className="inline-flex text-gray-400 hover:text-gray-300 focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const ToastContainer: React.FC<{ toasts: ToastProps[]; onClose: (id: string) => void }> = ({
  toasts,
  onClose
}) => {
  return (
    <div className="fixed bottom-0 right-0 z-50 p-6 space-y-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
};